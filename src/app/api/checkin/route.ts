import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { verifyQrToken } from '@/lib/qr/verify';
import { readStaffSession } from '@/lib/staff-session';
import type { CheckinResultado, FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Respuesta = {
  resultado: CheckinResultado;
  familia?: string;
  boletos?: number;
  checkedInAt?: string | null;
  mensaje: string;
};

async function registrar(
  eventId: string | null,
  familyId: string | null,
  scannedBy: string,
  resultado: CheckinResultado,
) {
  await supabaseAdmin().from('checkin_logs').insert({
    event_id: eventId,
    family_id: familyId,
    scanned_by: scannedBy,
    resultado,
  });
}

export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin:${requestIp(request)}`, 120, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados escaneos seguidos.' }, { status: 429 });
  }

  let qr: unknown;
  let eventId: unknown;
  try {
    ({ qr, eventId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof qr !== 'string' || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  // 1. Signature.
  const verificado = await verifyQrToken(qr);
  if (!verificado.ok || verificado.eventId !== eventId) {
    await registrar(eventId, null, sesion.nombre, 'invalido');
    return NextResponse.json<Respuesta>({
      resultado: 'invalido',
      mensaje: 'Este código no es válido para este evento.',
    });
  }

  const db = supabaseAdmin();
  const { data: familia } = await db
    .from('families')
    .select('id, nombre_familia, boletos_total, qr_jti, checked_in, checked_in_at')
    .eq('id', verificado.familyId)
    .maybeSingle<
      Pick<
        FamilyRow,
        'id' | 'nombre_familia' | 'boletos_total' | 'qr_jti' | 'checked_in' | 'checked_in_at'
      >
    >();

  if (!familia) {
    await registrar(eventId, null, sesion.nombre, 'invalido');
    return NextResponse.json<Respuesta>({
      resultado: 'invalido',
      mensaje: 'Esta familia ya no está en la lista.',
    });
  }

  // 2. The nonce must still be the live one. An older screenshot fails here.
  if (!familia.qr_jti || familia.qr_jti !== verificado.jti) {
    await registrar(eventId, familia.id, sesion.nombre, 'jti_expirado');
    return NextResponse.json<Respuesta>({
      resultado: 'jti_expirado',
      familia: familia.nombre_familia,
      mensaje: 'Este código ya fue reemplazado. Pide a la familia que abra su invitación de nuevo.',
    });
  }

  // 3. Conditional update: two doors scanning at once cannot both win.
  const { data: actualizadas } = await db
    .from('families')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: sesion.nombre,
    })
    .eq('id', familia.id)
    .eq('checked_in', false)
    .select('id, nombre_familia, boletos_total, checked_in_at');

  if (!actualizadas || actualizadas.length === 0) {
    await registrar(eventId, familia.id, sesion.nombre, 'duplicado');
    return NextResponse.json<Respuesta>({
      resultado: 'duplicado',
      familia: familia.nombre_familia,
      boletos: familia.boletos_total,
      checkedInAt: familia.checked_in_at,
      mensaje: 'Este boleto ya fue registrado.',
    });
  }

  await registrar(eventId, familia.id, sesion.nombre, 'exitoso');

  const registrada = actualizadas[0]!;
  return NextResponse.json<Respuesta>({
    resultado: 'exitoso',
    familia: registrada.nombre_familia,
    boletos: registrada.boletos_total,
    checkedInAt: registrada.checked_in_at,
    mensaje: 'Acceso registrado.',
  });
}
