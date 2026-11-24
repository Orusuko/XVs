import { NextResponse } from 'next/server';
import { bloqueoSiEventoNoPublico } from '@/lib/invitacion-evento';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { newJti } from '@/lib/qr/jti';
import { signQrToken } from '@/lib/qr/sign';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type FamiliaConfirmacion = Pick<
  FamilyRow,
  | 'id'
  | 'event_id'
  | 'nombre_familia'
  | 'boletos_total'
  | 'boletos_usados'
  | 'estado_confirmacion'
  | 'qr_jti'
  | 'checked_in'
>;

const MENSAJE_YA_ENTRO = 'Ya registraron su entrada en la puerta; no se puede cambiar la respuesta.';

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  // Tight budget: guessing tokens by brute force should not be practical.
  const limite = await checkRateLimit(`confirm:${requestIp(request)}`, 10, 60_000);
  if (!limite.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' },
      { status: 429 },
    );
  }

  let asistira: unknown;
  try {
    ({ asistira } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof asistira !== 'boolean') {
    return NextResponse.json({ error: 'Indica si asistirás.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: familia, error: selectError } = await db
    .from('families')
    .select(
      'id, event_id, nombre_familia, boletos_total, boletos_usados, estado_confirmacion, qr_jti, checked_in',
    )
    .eq('token', token)
    .maybeSingle<FamiliaConfirmacion>();

  if (selectError) {
    console.error('confirm.select', selectError.code, selectError.message);
    return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 });
  }

  const bloqueo = await bloqueoSiEventoNoPublico(db, familia.event_id);
  if (bloqueo) {
    return NextResponse.json({ error: bloqueo.error }, { status: bloqueo.status });
  }

  if (familia.checked_in) {
    return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
  }

  if (!asistira) {
    if ((familia.boletos_usados ?? 0) > 0) {
      return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
    }

    // Declining retires the current QR. A new one is only issued on a fresh yes.
    const { data: actualizadas, error } = await db
      .from('families')
      .update({
        estado_confirmacion: 'rechazado',
        confirmado_at: null,
        qr_jti: null,
      })
      .eq('id', familia.id)
      .eq('checked_in', false)
      .eq('boletos_usados', 0)
      .select('id');

    if (error) {
      return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
    }

    if (!actualizadas || actualizadas.length === 0) {
      return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
    }

    return NextResponse.json({ estado: 'rechazado' });
  }

  let jti =
    familia.estado_confirmacion === 'confirmado' && familia.qr_jti ? familia.qr_jti : null;

  if (!jti) {
    const nuevo = newJti();
    let query = db
      .from('families')
      .update({
        estado_confirmacion: 'confirmado',
        confirmado_at: new Date().toISOString(),
        qr_jti: nuevo,
      })
      .eq('id', familia.id)
      .eq('checked_in', false)
      .eq('estado_confirmacion', familia.estado_confirmacion);

    query = familia.qr_jti ? query.eq('qr_jti', familia.qr_jti) : query.is('qr_jti', null);

    const { data: actualizadas, error } = await query.select('qr_jti');

    if (error) {
      return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
    }

    if (actualizadas && actualizadas.length > 0 && actualizadas[0]?.qr_jti) {
      jti = actualizadas[0].qr_jti;
    } else {
      const { data: relectura, error: readError } = await db
        .from('families')
        .select('estado_confirmacion, qr_jti, checked_in')
        .eq('id', familia.id)
        .maybeSingle<Pick<FamilyRow, 'estado_confirmacion' | 'qr_jti' | 'checked_in'>>();

      if (readError) {
        return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
      }
      if (relectura?.checked_in) {
        return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
      }
      if (relectura?.estado_confirmacion === 'confirmado' && relectura.qr_jti) {
        jti = relectura.qr_jti;
      } else {
        return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
      }
    }
  }

  if (!jti) {
    return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
  }

  const qr = await signQrToken({
    familyId: familia.id,
    eventId: familia.event_id,
    jti,
  });

  return NextResponse.json({
    estado: 'confirmado',
    qr,
    familia: familia.nombre_familia,
    boletos: familia.boletos_total,
  });
}
