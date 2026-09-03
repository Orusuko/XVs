import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { hashPin } from '@/lib/pin';

export const dynamic = 'force-dynamic';

/** The organizer creates the door PINs their staff will use on the night. */
export async function POST(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
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

  if (!/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: 'El PIN debe tener entre 4 y 8 dígitos.' }, { status: 400 });
  }

  // Confirms ownership through RLS before writing to a table the browser cannot reach.
  const { data: evento } = await db.from('events').select('id').eq('id', eventId).maybeSingle();
  if (!evento) {
    return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 });
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');
  const { error } = await supabaseAdmin().from('staff_users').insert({
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
