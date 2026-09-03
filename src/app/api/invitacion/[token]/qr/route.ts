import { NextResponse } from 'next/server';
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
 * re-signed so a downloaded PNG stays valid. After check-in (or undo) the
 * nonce is gone — mint a new one so they can walk back in with a fresh pass.
 */
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const limite = await checkRateLimit(`qr:${requestIp(request)}`, 30, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  const db = supabaseAdmin();

  const { data: familia } = await db
    .from('families')
    .select('id, event_id, nombre_familia, boletos_total, estado_confirmacion, qr_jti')
    .eq('token', token)
    .maybeSingle<
      Pick<
        FamilyRow,
        'id' | 'event_id' | 'nombre_familia' | 'boletos_total' | 'estado_confirmacion' | 'qr_jti'
      >
    >();

  if (!familia || familia.estado_confirmacion !== 'confirmado') {
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
    { qr, familia: familia.nombre_familia, boletos: familia.boletos_total },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
