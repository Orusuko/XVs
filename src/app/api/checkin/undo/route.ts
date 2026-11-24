import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { readStaffSession } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

/**
 * Reverses the count. The printed QR stays valid: partial entry must not
 * burn `qr_jti`, or the family cannot scan the rest of their tickets.
 */
export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin-undo:${requestIp(request)}`, 30, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos seguidos.' }, { status: 429 });
  }

  let eventId: unknown;
  let familyId: unknown;
  try {
    ({ eventId, familyId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof eventId !== 'string' || typeof familyId !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: antes, error: readError } = await db
    .from('families')
    .select('qr_jti')
    .eq('id', familyId)
    .eq('event_id', eventId)
    .maybeSingle<{ qr_jti: string | null }>();

  if (readError || !antes) {
    return NextResponse.json({ error: 'Familia no encontrada.' }, { status: 404 });
  }

  const { error } = await db
    .from('families')
    .update({
      boletos_usados: 0,
      checked_in: false,
      checked_in_at: null,
      checked_in_by: null,
    })
    .eq('id', familyId)
    .eq('event_id', eventId);

  if (error) {
    return NextResponse.json({ error: 'No pudimos revertir la entrada.' }, { status: 500 });
  }

  await db.from('checkin_logs').insert({
    event_id: eventId,
    family_id: familyId,
    scanned_by: sesion.nombre,
    resultado: 'revertido',
  });

  /** `qr_jti` no cambia en el undo: solo se limpia al completar todos los boletos en puerta. */
  const mismoQr = Boolean(antes.qr_jti);

  return NextResponse.json({
    ok: true,
    mismoQr,
    mensaje: mismoQr
      ? 'Entrada deshecha. El mismo QR de la familia vuelve a servir.'
      : 'Entrada deshecha. El pase impreso ya no sirve; la familia debe abrir su invitación en el teléfono para ver un código nuevo.',
  });
}
