import { NextResponse } from 'next/server';
import { esColumnaFaltante, limiteBoletosFamilia } from '@/lib/boletos-familia';
import { bloqueoSiEventoNoPublico } from '@/lib/invitacion-evento';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { signQrToken } from '@/lib/qr/sign';
import { newJti } from '@/lib/qr/jti';
import { debeRemintar } from '@/lib/qr/reemitir';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Re-issues the QR for a family that already confirmed. A live nonce is
 * re-signed so a downloaded PNG stays valid. After full check-in the nonce is
 * cleared — mint a new one on the next fetch. Undo after partial entry keeps the
 * same nonce; undo after a completed entry still needs a remint here.
 */
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const limite = await checkRateLimit(`qr:${requestIp(request)}`, 30, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  const db = supabaseAdmin();

  let { data: familia, error: selectError } = await db
    .from('families')
    .select(
      'id, event_id, nombre_familia, boletos_total, boletos_confirmados, estado_confirmacion, qr_jti',
    )
    .eq('token', token)
    .maybeSingle<
      Pick<
        FamilyRow,
        | 'id'
        | 'event_id'
        | 'nombre_familia'
        | 'boletos_total'
        | 'boletos_confirmados'
        | 'estado_confirmacion'
        | 'qr_jti'
      >
    >();

  if (esColumnaFaltante(selectError, 'boletos_confirmados')) {
    ({ data: familia, error: selectError } = await db
      .from('families')
      .select('id, event_id, nombre_familia, boletos_total, estado_confirmacion, qr_jti')
      .eq('token', token)
      .maybeSingle());
  }

  if (selectError) {
    console.error('invitacion.qr.select', selectError.code, selectError.message);
    return NextResponse.json({ error: 'No pudimos preparar tu pase.' }, { status: 500 });
  }

  if (!familia) {
    return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 });
  }

  const bloqueo = await bloqueoSiEventoNoPublico(db, familia.event_id);
  if (bloqueo) {
    return NextResponse.json({ error: bloqueo.error }, { status: bloqueo.status });
  }

  if (familia.estado_confirmacion !== 'confirmado') {
    return NextResponse.json({ error: 'Todavía no hay un boleto para esta familia.' }, { status: 404 });
  }

  let jti = familia.qr_jti;

  if (debeRemintar(familia)) {
    const nuevo = newJti();
    const { data: actualizadas } = await db
      .from('families')
      .update({ qr_jti: nuevo })
      .eq('id', familia.id)
      .eq('estado_confirmacion', 'confirmado')
      .select('qr_jti');

    if (!actualizadas || actualizadas.length === 0 || !actualizadas[0]?.qr_jti) {
      return NextResponse.json({ error: 'Todavía no hay un boleto para esta familia.' }, { status: 404 });
    }

    jti = actualizadas[0].qr_jti;
  }

  if (!jti) {
    return NextResponse.json({ error: 'Todavía no hay un boleto para esta familia.' }, { status: 404 });
  }

  const qr = await signQrToken({
    familyId: familia.id,
    eventId: familia.event_id,
    jti,
  });

  return NextResponse.json(
    {
      qr,
      familia: familia.nombre_familia,
      boletos: limiteBoletosFamilia(familia),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
