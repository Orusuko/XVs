import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { camposEntrada } from '@/lib/checkin/entrada';
import { readStaffSession } from '@/lib/staff-session';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type FamiliaManual = Pick<
  FamilyRow,
  'id' | 'nombre_familia' | 'boletos_total' | 'checked_in' | 'checked_in_at' | 'estado_confirmacion'
>;

/** Fallback for a dead camera or an unreadable screen. */
export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin-manual:${requestIp(request)}`, 60, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados escaneos seguidos.' }, { status: 429 });
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
  const { data: actualizadas } = await db
    .from('families')
    .update(camposEntrada(sesion.nombre, 'manual'))
    .eq('id', familyId)
    .eq('event_id', eventId)
    .eq('checked_in', false)
    .eq('estado_confirmacion', 'confirmado')
    .select('id, nombre_familia, boletos_total, checked_in_at')
    .returns<Pick<FamilyRow, 'id' | 'nombre_familia' | 'boletos_total' | 'checked_in_at'>[]>();

  if (!actualizadas || actualizadas.length === 0) {
    const { data: familia } = await db
      .from('families')
      .select('id, nombre_familia, boletos_total, checked_in, checked_in_at, estado_confirmacion')
      .eq('id', familyId)
      .eq('event_id', eventId)
      .maybeSingle<FamiliaManual>();

    if (!familia) {
      return NextResponse.json({ error: 'Familia no encontrada.' }, { status: 404 });
    }

    if (familia.checked_in) {
      await db.from('checkin_logs').insert({
        event_id: eventId,
        family_id: familyId,
        scanned_by: sesion.nombre,
        resultado: 'duplicado',
      });

      return NextResponse.json({
        resultado: 'duplicado',
        mensaje: 'Esta familia ya había entrado.',
      });
    }

    await db.from('checkin_logs').insert({
      event_id: eventId,
      family_id: familyId,
      scanned_by: sesion.nombre,
      resultado: 'invalido',
    });

    return NextResponse.json({ error: 'Esa familia no ha confirmado.' }, { status: 409 });
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
