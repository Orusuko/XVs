import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type NuevaFamilia = { nombre_familia: string; boletos_total: number };

function validar(fila: unknown): fila is NuevaFamilia {
  if (typeof fila !== 'object' || fila === null) return false;
  const { nombre_familia: nombre, boletos_total: boletos } = fila as NuevaFamilia;
  return (
    typeof nombre === 'string' &&
    nombre.trim() !== '' &&
    Number.isInteger(boletos) &&
    boletos > 0
  );
}

export async function POST(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const { eventId, familias } = (await request.json()) as {
    eventId?: string;
    familias?: unknown[];
  };

  if (typeof eventId !== 'string' || !Array.isArray(familias) || familias.length === 0) {
    return NextResponse.json({ error: 'Agrega al menos una familia.' }, { status: 400 });
  }

  if (!familias.every(validar)) {
    return NextResponse.json(
      { error: 'Cada familia necesita un nombre y al menos un boleto.' },
      { status: 400 },
    );
  }

  // 21 URL-safe characters: long enough that guessing a link is not worth trying.
  const filas = familias.map((familia) => ({
    event_id: eventId,
    nombre_familia: familia.nombre_familia.trim(),
    boletos_total: familia.boletos_total,
    token: nanoid(21),
  }));

  const { data, error } = await db.from('families').insert(filas).select('id, token, nombre_familia');

  if (error) {
    console.error('families.insert', error.message);
    return NextResponse.json(
      { error: 'No pudimos guardar. Revisa los datos e inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ familias: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const { id, nombre_familia: nombre, boletos_total: boletos } = (await request.json()) as {
    id?: string;
    nombre_familia?: string;
    boletos_total?: number;
  };

  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'Falta la familia.' }, { status: 400 });
  }

  const cambios: Record<string, unknown> = {};
  if (typeof nombre === 'string' && nombre.trim() !== '') cambios.nombre_familia = nombre.trim();
  if (Number.isInteger(boletos) && (boletos as number) > 0) cambios.boletos_total = boletos;

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 });
  }

  const { error } = await db.from('families').update(cambios).eq('id', id);

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
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Falta la familia.' }, { status: 400 });
  }

  const { error } = await db.from('families').delete().eq('id', id);

  if (error) {
    console.error('families.delete', error.message);
    return NextResponse.json(
      { error: 'No pudimos quitar a esa familia. Inténtalo de nuevo.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
