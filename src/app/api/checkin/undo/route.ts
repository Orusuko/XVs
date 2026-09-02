import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { readStaffSession } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

/**
 * Reverses a mistaken entry. `qr_jti` stays consumed on purpose: the QR that
 * was already scanned must not become usable again just because staff undid the
 * count. The family reopens their invitation to get a fresh one.
 */
export async function POST(request: Request) {
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
  const { error } = await db
    .from('families')
    .update({ checked_in: false, checked_in_at: null, checked_in_by: null })
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

  return NextResponse.json({ ok: true });
}
