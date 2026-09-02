import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

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

export async function POST(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const nombre = body.quinceanera_nombre;

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return NextResponse.json({ error: 'Escribe el nombre de la quinceañera.' }, { status: 400 });
  }

  const { data, error } = await db
    .from('events')
    .insert({ ...soloCamposEditables(body), admin_id: user.id })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id;

  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  // RLS keeps this scoped to the caller's own event.
  const { error } = await db.from('events').update(soloCamposEditables(body)).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
