import { NextResponse } from 'next/server';
import { esColumnaFaltante } from '@/lib/boletos-familia';
import { bloqueoSiEventoNoPublico } from '@/lib/invitacion-evento';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { newJti } from '@/lib/qr/jti';
import { signQrToken } from '@/lib/qr/sign';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SELECT_CON_CONFIRMADOS =
  'id, event_id, nombre_familia, boletos_total, boletos_confirmados, boletos_usados, estado_confirmacion, qr_jti, checked_in';
const SELECT_SIN_CONFIRMADOS =
  'id, event_id, nombre_familia, boletos_total, boletos_usados, estado_confirmacion, qr_jti, checked_in';

type FamiliaConfirmacion = Pick<
  FamilyRow,
  | 'id'
  | 'event_id'
  | 'nombre_familia'
  | 'boletos_total'
  | 'boletos_confirmados'
  | 'boletos_usados'
  | 'estado_confirmacion'
  | 'qr_jti'
  | 'checked_in'
>;

const MENSAJE_YA_ENTRO = 'Ya registraron su entrada en la puerta; no se puede cambiar la respuesta.';

async function actualizarSinColumnaOpcional(
  db: ReturnType<typeof supabaseAdmin>,
  payload: Record<string, unknown>,
  filtros: { id: string; checked_in?: boolean; boletos_usados?: number },
) {
  const eq = (chain: ReturnType<ReturnType<typeof db.from>['update']>) => {
    let q = chain.eq('id', filtros.id);
    if (filtros.checked_in !== undefined) q = q.eq('checked_in', filtros.checked_in);
    if (filtros.boletos_usados !== undefined) q = q.eq('boletos_usados', filtros.boletos_usados);
    return q;
  };

  let resultado = await eq(db.from('families').update(payload)).select('id');

  if (esColumnaFaltante(resultado.error, 'boletos_confirmados') && 'boletos_confirmados' in payload) {
    const sinConfirmados = { ...payload };
    delete sinConfirmados.boletos_confirmados;
    resultado = await eq(db.from('families').update(sinConfirmados)).select('id');
  }

  return resultado;
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const limite = await checkRateLimit(`confirm:${requestIp(request)}`, 10, 60_000);
  if (!limite.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.' },
      { status: 429 },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const asistira =
    typeof cuerpo === 'object' && cuerpo !== null && 'asistira' in cuerpo
      ? (cuerpo as { asistira: unknown }).asistira
      : undefined;
  const brutoConfirmados =
    typeof cuerpo === 'object' && cuerpo !== null && 'boletos_confirmados' in cuerpo
      ? (cuerpo as { boletos_confirmados: unknown }).boletos_confirmados
      : undefined;

  if (typeof asistira !== 'boolean') {
    return NextResponse.json({ error: 'Indica si asistirás.' }, { status: 400 });
  }

  const db = supabaseAdmin();

  let { data: familia, error: selectError } = await db
    .from('families')
    .select(SELECT_CON_CONFIRMADOS)
    .eq('token', token)
    .maybeSingle<FamiliaConfirmacion>();

  if (esColumnaFaltante(selectError, 'boletos_confirmados')) {
    ({ data: familia, error: selectError } = await db
      .from('families')
      .select(SELECT_SIN_CONFIRMADOS)
      .eq('token', token)
      .maybeSingle<FamiliaConfirmacion>());
  }

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

  let cantidadConfirmada = familia.boletos_total;
  if (asistira) {
    if (brutoConfirmados !== undefined) {
      if (
        !Number.isInteger(brutoConfirmados) ||
        (brutoConfirmados as number) < 1 ||
        (brutoConfirmados as number) > familia.boletos_total
      ) {
        return NextResponse.json(
          { error: `Indica cuántos asistirán (entre 1 y ${familia.boletos_total}).` },
          { status: 400 },
        );
      }
      cantidadConfirmada = brutoConfirmados as number;
    }

    if ((familia.boletos_usados ?? 0) > cantidadConfirmada) {
      return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
    }
  }

  if (!asistira) {
    if ((familia.boletos_usados ?? 0) > 0) {
      return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
    }

    const { data: actualizadas, error } = await actualizarSinColumnaOpcional(
      db,
      {
        estado_confirmacion: 'rechazado',
        confirmado_at: null,
        qr_jti: null,
        boletos_confirmados: null,
      },
      { id: familia.id, checked_in: false, boletos_usados: 0 },
    );

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

  if (jti) {
    const necesitaActualizar =
      familia.boletos_confirmados == null
        ? cantidadConfirmada !== familia.boletos_total
        : familia.boletos_confirmados !== cantidadConfirmada;

    if (necesitaActualizar) {
      const { data: actualizadas, error } = await actualizarSinColumnaOpcional(
        db,
        { boletos_confirmados: cantidadConfirmada },
        { id: familia.id, checked_in: false },
      );

      if (error) {
        return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
      }

      if (!actualizadas || actualizadas.length === 0) {
        return NextResponse.json({ error: MENSAJE_YA_ENTRO }, { status: 409 });
      }
    }
  }

  if (!jti) {
    const nuevo = newJti();
    const payload = {
      estado_confirmacion: 'confirmado' as const,
      confirmado_at: new Date().toISOString(),
      qr_jti: nuevo,
      boletos_confirmados: cantidadConfirmada,
    };

    let query = db
      .from('families')
      .update(payload)
      .eq('id', familia.id)
      .eq('checked_in', false)
      .eq('estado_confirmacion', familia.estado_confirmacion);

    query = familia.qr_jti ? query.eq('qr_jti', familia.qr_jti) : query.is('qr_jti', null);

    let { data: actualizadas, error } = await query.select('qr_jti');

    if (esColumnaFaltante(error, 'boletos_confirmados')) {
      const sinColumna = { ...payload };
      delete sinColumna.boletos_confirmados;
      query = db
        .from('families')
        .update(sinColumna)
        .eq('id', familia.id)
        .eq('checked_in', false)
        .eq('estado_confirmacion', familia.estado_confirmacion);
      query = familia.qr_jti ? query.eq('qr_jti', familia.qr_jti) : query.is('qr_jti', null);
      ({ data: actualizadas, error } = await query.select('qr_jti'));
    }

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
    boletos: cantidadConfirmada,
  });
}