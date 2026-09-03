import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { camposEntrada } from '@/lib/checkin/entrada';
import { verificarQr } from '@/lib/checkin/verificar-qr';
import { readStaffSession } from '@/lib/staff-session';
import type { CheckinResultado } from '@/lib/types';

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

  const verificado = await verificarQr(qr, eventId);

  if (verificado.resultado === 'invalido' || verificado.resultado === 'jti_expirado') {
    const familyId = verificado.resultado === 'jti_expirado' ? verificado.familia.id : null;
    await registrar(eventId, familyId, sesion.nombre, verificado.resultado);
    return NextResponse.json<Respuesta>({
      resultado: verificado.resultado,
      familia: verificado.resultado === 'jti_expirado' ? verificado.familia.nombre_familia : undefined,
      mensaje: verificado.mensaje,
    });
  }

  // The read above (`listo` vs `ya_ingresado`) is only for the preview screen.
  // This atomic update is the only thing that decides duplicado — two doors
  // scanning at once cannot both win.
  const db = supabaseAdmin();
  const { data: actualizadas } = await db
    .from('families')
    .update(camposEntrada(sesion.nombre, 'escaner'))
    .eq('id', verificado.familia.id)
    .eq('checked_in', false)
    .select('id, nombre_familia, boletos_total, checked_in_at');

  if (!actualizadas || actualizadas.length === 0) {
    await registrar(eventId, verificado.familia.id, sesion.nombre, 'duplicado');
    return NextResponse.json<Respuesta>({
      resultado: 'duplicado',
      familia: verificado.familia.nombre_familia,
      boletos: verificado.familia.boletos_total,
      checkedInAt: verificado.familia.checked_in_at,
      mensaje: 'Este boleto ya fue registrado.',
    });
  }

  await registrar(eventId, verificado.familia.id, sesion.nombre, 'exitoso');

  const registrada = actualizadas[0]!;
  return NextResponse.json<Respuesta>({
    resultado: 'exitoso',
    familia: registrada.nombre_familia,
    boletos: registrada.boletos_total,
    checkedInAt: registrada.checked_in_at,
    mensaje: 'Acceso registrado.',
  });
}
