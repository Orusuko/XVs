import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { organizadorActual } from '@/lib/organizador';
import { MAX_NOMBRE, validarNombreFamiliaApi } from '@/lib/validacion-formularios';

export const dynamic = 'force-dynamic';

type NuevaFamilia = { nombre_familia: string; boletos_total: number };

function validar(fila: unknown): fila is NuevaFamilia {
  if (typeof fila !== 'object' || fila === null) return false;
  const { nombre_familia: nombre, boletos_total: boletos } = fila as NuevaFamilia;
  if (typeof nombre !== 'string' || nombre.trim() === '') return false;
  if (nombre.trim().length > MAX_NOMBRE) return false;
  return Number.isInteger(boletos) && boletos > 0;
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

async function esFamiliaPropia(
  db: NonNullable<Awaited<ReturnType<typeof organizadorActual>>>['db'],
  adminId: string,
  familyId: string,
) {
  const { data: familia } = await db
    .from('families')
    .select('event_id')
    .eq('id', familyId)
    .maybeSingle<{ event_id: string }>();

  if (!familia) return false;

  const { data: evento } = await db
    .from('events')
    .select('id')
    .eq('id', familia.event_id)
    .eq('admin_id', adminId)
    .maybeSingle();

  return Boolean(evento);
}

export async function GET(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  const { data: evento } = await actual.db
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('admin_id', actual.sesion.id)
    .maybeSingle();

  if (!evento) {
    return NextResponse.json({ error: 'No encontramos ese evento.' }, { status: 404 });
  }

  const { data, error } = await actual.db
    .from('families')
    .select('id, estado_confirmacion, checked_in, boletos_usados')
    .eq('event_id', eventId);

  if (error) {
    console.error('families.poll', error.message);
    return NextResponse.json({ error: 'No pudimos leer las confirmaciones.' }, { status: 400 });
  }

  return NextResponse.json({ familias: data ?? [] });
}

export async function POST(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const { eventId, familias } = (await request.json()) as {
    eventId?: string;
    familias?: unknown[];
  };

  if (typeof eventId !== 'string' || !Array.isArray(familias) || familias.length === 0) {
    return NextResponse.json({ error: 'Agrega al menos una familia.' }, { status: 400 });
  }

  const conNombre = familias.filter(
    (fila) =>
      typeof fila === 'object' &&
      fila !== null &&
      typeof (fila as NuevaFamilia).nombre_familia === 'string' &&
      (fila as NuevaFamilia).nombre_familia.trim() !== '',
  );

  if (conNombre.length === 0) {
    return NextResponse.json({ error: 'Agrega al menos una familia con nombre.' }, { status: 400 });
  }

  const omitidas = familias.filter((fila) => {
    if (typeof fila !== 'object' || fila === null) return false;
    const nombre = (fila as NuevaFamilia).nombre_familia;
    const boletos = (fila as NuevaFamilia).boletos_total;
    return (
      typeof nombre === 'string' &&
      nombre.trim() !== '' &&
      (typeof boletos !== 'number' || boletos < 1)
    );
  });

  const validas = familias.filter(validar);

  for (const fila of validas) {
    const falloNombre = validarNombreFamiliaApi(fila.nombre_familia);
    if (falloNombre) {
      return NextResponse.json({ error: falloNombre }, { status: 400 });
    }
  }

  const nombreLargo = familias.find((fila) => {
    if (typeof fila !== 'object' || fila === null) return false;
    const nombre = (fila as NuevaFamilia).nombre_familia;
    return typeof nombre === 'string' && nombre.trim().length > MAX_NOMBRE;
  });

  if (nombreLargo) {
    return NextResponse.json(
      { error: `El nombre de la familia no puede pasar de ${MAX_NOMBRE} caracteres.` },
      { status: 400 },
    );
  }

  if (validas.length === 0) {
    return NextResponse.json(
      {
        error: 'Agrega al menos una familia con nombre y al menos un boleto.',
        omitidas: omitidas.length,
      },
      { status: 400 },
    );
  }

  const { data: evento } = await actual.db
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('admin_id', actual.sesion.id)
    .maybeSingle();

  if (!evento) {
    return NextResponse.json({ error: 'No encontramos ese evento.' }, { status: 404 });
  }

  // 21 URL-safe characters: long enough that guessing a link is not worth trying.
  const filas = validas.map((familia) => ({
    event_id: eventId,
    nombre_familia: familia.nombre_familia.trim(),
    boletos_total: familia.boletos_total,
    token: nanoid(21),
  }));

  const { data, error } = await actual.db
    .from('families')
    .insert(filas)
    .select('id, token, nombre_familia');

  if (error) {
    console.error('families.insert', error.message);
    return NextResponse.json(
      { error: 'No pudimos guardar. Revisa los datos e inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      familias: data,
      omitidas: omitidas.length,
      aviso:
        omitidas.length > 0
          ? `Se omitieron ${omitidas.length} ${omitidas.length === 1 ? 'familia' : 'familias'} sin boletos válidos.`
          : undefined,
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const { id, nombre_familia: nombre, boletos_total: boletos } = (await request.json()) as {
    id?: string;
    nombre_familia?: string;
    boletos_total?: number;
  };

  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'Falta la familia.' }, { status: 400 });
  }

  const cambios: Record<string, unknown> = {};
  if (typeof nombre === 'string' && nombre.trim() !== '') {
    const falloNombre = validarNombreFamiliaApi(nombre);
    if (falloNombre) {
      return NextResponse.json({ error: falloNombre }, { status: 400 });
    }
    cambios.nombre_familia = nombre.trim();
  }
  if (Number.isInteger(boletos) && (boletos as number) > 0) cambios.boletos_total = boletos;

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 });
  }

  if (!(await esFamiliaPropia(actual.db, actual.sesion.id, id))) {
    return NextResponse.json({ error: 'No encontramos esa familia.' }, { status: 404 });
  }

  if (typeof cambios.boletos_total === 'number') {
    const { data: famActual } = await actual.db
      .from('families')
      .select('boletos_usados')
      .eq('id', id)
      .maybeSingle<{ boletos_usados: number }>();

    if (famActual && cambios.boletos_total < famActual.boletos_usados) {
      return NextResponse.json(
        { error: `Ya entraron ${famActual.boletos_usados} boletos de esa familia.` },
        { status: 409 },
      );
    }
  }

  const { error } = await actual.db.from('families').update(cambios).eq('id', id);

  if (error) {
    console.error('families.update', error.message);
    return NextResponse.json(
      { error: 'No pudimos guardar. Revisa los datos e inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { actual, respuesta } = await exigirOrganizador();
  if (!actual) return respuesta;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Falta la familia.' }, { status: 400 });
  }

  if (!(await esFamiliaPropia(actual.db, actual.sesion.id, id))) {
    return NextResponse.json({ error: 'No encontramos esa familia.' }, { status: 404 });
  }

  const { error } = await actual.db.from('families').delete().eq('id', id);

  if (error) {
    console.error('families.delete', error.message);
    return NextResponse.json(
      { error: 'No pudimos quitar a esa familia. Inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
