import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { newJti } from '@/lib/qr/jti';
import { signQrToken } from '@/lib/qr/sign';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  const { data: familia } = await db
    .from('families')
    .select('id, event_id, nombre_familia, boletos_total')
    .eq('token', token)
    .maybeSingle<Pick<FamilyRow, 'id' | 'event_id' | 'nombre_familia' | 'boletos_total'>>();

  if (!familia) {
    return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 });
  }

  if (!asistira) {
    // Declining retires the current QR. A new one is only issued on a fresh yes.
    const { error } = await db
      .from('families')
      .update({
        estado_confirmacion: 'rechazado',
        confirmado_at: null,
        qr_jti: null,
      })
      .eq('id', familia.id);

    if (error) {
      return NextResponse.json({ error: 'No pudimos guardar tu respuesta.' }, { status: 500 });
    }

    return NextResponse.json({ estado: 'rechazado' });
  }

  // Every yes mints a new nonce, which silently invalidates any QR already in
  // circulation — including a screenshot taken after an earlier confirmation.
  const jti = newJti();

  const { error } = await db
    .from('families')
    .update({
      estado_confirmacion: 'confirmado',
      confirmado_at: new Date().toISOString(),
      qr_jti: jti,
    })
    .eq('id', familia.id);

  if (error) {
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
