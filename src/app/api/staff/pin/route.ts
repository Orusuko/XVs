import { NextResponse } from 'next/server';
import { organizadorActual } from '@/lib/organizador';
import { hashPin } from '@/lib/pin';
import { validarNombreStaff, validarPinStaff } from '@/lib/validacion-formularios';

export const dynamic = 'force-dynamic';

async function eventoPropio(eventId: string, adminId: string) {
  const actual = await organizadorActual();
  if (!actual) return { actual: null, evento: null, respuesta: NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 }) };

  const { data: evento } = await actual.db
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('admin_id', adminId)
    .maybeSingle();

  if (!evento) {
    return {
      actual,
      evento: null,
      respuesta: NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 }),
    };
  }

  return { actual, evento, respuesta: null };
}

/** The organizer creates the door PINs their staff will use on the night. */
export async function GET(request: Request) {
  const actual = await organizadorActual();
  if (!actual) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  const propio = await eventoPropio(eventId, actual.sesion.id);
  if (!propio.evento) return propio.respuesta!;

  const { data: lista, error: errLista } = await propio.actual!.db
    .from('staff_users')
    .select('id, nombre')
    .eq('event_id', eventId)
    .order('nombre');

  if (errLista) {
    console.error('staff_users.list', errLista.message);
    return NextResponse.json({ error: 'No pudimos leer los accesos.' }, { status: 500 });
  }

  return NextResponse.json({ accesos: lista ?? [] });
}

export async function POST(request: Request) {
  const actual = await organizadorActual();
  if (!actual) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const { eventId, nombre, pin } = (await request.json()) as {
    eventId?: string;
    nombre?: string;
    pin?: string;
  };

  if (typeof eventId !== 'string' || typeof nombre !== 'string' || typeof pin !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const falloNombre = validarNombreStaff(nombre);
  if (falloNombre) {
    return NextResponse.json({ error: falloNombre }, { status: 400 });
  }

  const falloPin = validarPinStaff(pin);
  if (falloPin) {
    return NextResponse.json({ error: falloPin }, { status: 400 });
  }

  const propio = await eventoPropio(eventId, actual.sesion.id);
  if (!propio.evento) return propio.respuesta!;

  const { error } = await actual.db.from('staff_users').insert({
    event_id: eventId,
    nombre: nombre.trim(),
    pin_hash: await hashPin(pin),
  });

  if (error) {
    console.error('staff_users.insert', error.message);
    return NextResponse.json(
      { error: 'No pudimos crear el PIN. Inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const actual = await organizadorActual();
  if (!actual) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  const eventId = new URL(request.url).searchParams.get('eventId');

  if (!id || !eventId) {
    return NextResponse.json({ error: 'Falta el acceso.' }, { status: 400 });
  }

  const propio = await eventoPropio(eventId, actual.sesion.id);
  if (!propio.evento) return propio.respuesta!;

  const { error } = await actual.db.from('staff_users').delete().eq('id', id).eq('event_id', eventId);

  if (error) {
    console.error('staff_users.delete', error.message);
    return NextResponse.json({ error: 'No pudimos revocar ese acceso.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}