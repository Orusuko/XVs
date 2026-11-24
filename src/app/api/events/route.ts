import { NextResponse } from 'next/server';
import { organizadorActual } from '@/lib/organizador';

export const dynamic = 'force-dynamic';

const CAMPOS_EDITABLES = [
  'quinceanera_nombre',
  'padre',
  'madre',
  'padrinos',
  'mensaje',
  'template_id',
  'template_config',
  'misa',
  'recepcion',
  'capacidad_total',
  'estado',
] as const;

function soloCamposEditables(body: Record<string, unknown>) {
  const limpio: Record<string, unknown> = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in body) limpio[campo] = body[campo];
  }
  return limpio;
}

async function exigirOrganizador() {
  const actual = await organizadorActual();
  if (!actual) {
    return {
      actual: null,
      respuesta: NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 }),
    };
  }
  return { actual, respuesta: null };
}

export async function POST(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const body = (await request.json()) as Record<string, unknown>;
  const nombre = body.quinceanera_nombre;

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return NextResponse.json({ error: 'Escribe el nombre de la quinceañera.' }, { status: 400 });
  }

  const { data, error } = await actual.db
    .from('events')
    .insert({ ...soloCamposEditables(body), admin_id: actual.sesion.id })
    .select('id')
    .single();

  if (error) {
    console.error('events.insert', error.message);
    return NextResponse.json(
      { error: 'No pudimos guardar los datos. Revisa los campos e inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id;

  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  const cambios = soloCamposEditables(body);

  if (cambios.estado === 'publicado') {
    const { count, error: errCount } = await actual.db
      .from('families')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id);

    if (errCount) {
      console.error('events.publish', errCount.message);
      return NextResponse.json({ error: 'No pudimos verificar la lista de invitados.' }, { status: 500 });
    }

    if (!count || count < 1) {
      return NextResponse.json(
        { error: 'Agrega al menos una familia con boletos antes de publicar.' },
        { status: 400 },
      );
    }
  }

  const { data, error } = await actual.db
    .from('events')
    .update(cambios)
    .eq('id', id)
    .eq('admin_id', actual.sesion.id)
    .select('id');

  if (error) {
    console.error('events.update', error.message);
    return NextResponse.json(
      { error: 'No pudimos guardar los datos. Revisa los campos e inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'No encontramos ese evento.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  const { data, error } = await actual.db
    .from('events')
    .delete()
    .eq('id', id)
    .eq('admin_id', actual.sesion.id)
    .select('id');

  if (error) {
    console.error('events.delete', error.message);
    return NextResponse.json(
      { error: 'No pudimos eliminar el evento. Inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'No encontramos ese evento.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
