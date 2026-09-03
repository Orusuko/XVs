import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { camposEntrada } from '@/lib/checkin/entrada';
import { readStaffSession } from '@/lib/staff-session';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Fallback for a dead camera or an unreadable screen. */
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
  const { data: actualizadas } = await db
    .from('families')
    .update(camposEntrada(sesion.nombre, 'manual'))
    .eq('id', familyId)
    .eq('event_id', eventId)
    .eq('checked_in', false)
    .select('id, nombre_familia, boletos_total, checked_in_at')
    .returns<Pick<FamilyRow, 'id' | 'nombre_familia' | 'boletos_total' | 'checked_in_at'>[]>();

  if (!actualizadas || actualizadas.length === 0) {
    await db.from('checkin_logs').insert({
      event_id: eventId,
      family_id: familyId,
      scanned_by: sesion.nombre,
      resultado: 'duplicado',
    });

    return NextResponse.json({ resultado: 'duplicado', mensaje: 'Esta familia ya había entrado.' });
  }

  await db.from('checkin_logs').insert({
    event_id: eventId,
    family_id: familyId,
    scanned_by: `${sesion.nombre} (manual)`,
    resultado: 'exitoso',
  });

  return NextResponse.json({
    resultado: 'exitoso',
    familia: actualizadas[0]!.nombre_familia,
    boletos: actualizadas[0]!.boletos_total,
    mensaje: 'Acceso registrado a mano.',
  });
}
