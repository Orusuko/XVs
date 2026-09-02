import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { verifyPin } from '@/lib/pin';
import { STAFF_COOKIE, createStaffSession } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

type StaffRow = { id: string; nombre: string; pin_hash: string };

export async function POST(request: Request) {
  const limite = await checkRateLimit(`staff-login:${requestIp(request)}`, 8, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
  }

  let eventId: unknown;
  let pin: unknown;
  try {
    ({ eventId, pin } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof eventId !== 'string' || typeof pin !== 'string' || pin.length < 4) {
    return NextResponse.json({ error: 'Escribe tu PIN de 4 dígitos.' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: staff } = await db
    .from('staff_users')
    .select('id, nombre, pin_hash')
    .eq('event_id', eventId)
    .returns<StaffRow[]>();

  // The PIN identifies the person, so every hash for this event is a candidate.
  let encontrado: StaffRow | null = null;
  for (const candidato of staff ?? []) {
    if (await verifyPin(pin, candidato.pin_hash)) {
      encontrado = candidato;
      break;
    }
  }

  if (!encontrado) {
    return NextResponse.json({ error: 'PIN incorrecto.' }, { status: 401 });
  }

  const sesion = await createStaffSession({ eventId, nombre: encontrado.nombre });
  const response = NextResponse.json({ nombre: encontrado.nombre });

  response.cookies.set(STAFF_COOKIE, sesion, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 18 * 60 * 60,
  });

  return response;
}
