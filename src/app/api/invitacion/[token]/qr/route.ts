import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { signQrToken } from '@/lib/qr/sign';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Re-issues the QR for a family that already confirmed, so reopening the link
 * does not force them to confirm again. It signs the stored nonce rather than
 * minting a new one, which keeps any previously downloaded QR valid.
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

  if (!familia || familia.estado_confirmacion !== 'confirmado' || !familia.qr_jti) {
    return NextResponse.json({ error: 'Todavía no hay un boleto para esta familia.' }, { status: 404 });
  }

  const qr = await signQrToken({
    familyId: familia.id,
    eventId: familia.event_id,
    jti: familia.qr_jti,
  });

  return NextResponse.json(
    { qr, familia: familia.nombre_familia, boletos: familia.boletos_total },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
