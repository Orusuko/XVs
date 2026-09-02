import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { readStaffSession } from '@/lib/staff-session';
import { summarizeTickets } from '@/lib/tickets';
import type { EventRow, FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Staff devices are not signed in with Supabase Auth, so they poll this route
 * instead of subscribing to Realtime with the anon key.
 */
export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'Falta el evento.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  const db = supabaseAdmin();

  const [familiasRes, eventoRes] = await Promise.all([
    db
      .from('families')
      .select('id, nombre_familia, boletos_total, estado_confirmacion, checked_in, checked_in_at, checked_in_by')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false, nullsFirst: false })
      .returns<
        Pick<
          FamilyRow,
          | 'id'
          | 'nombre_familia'
          | 'boletos_total'
          | 'estado_confirmacion'
          | 'checked_in'
          | 'checked_in_at'
          | 'checked_in_by'
        >[]
      >(),
    db
      .from('events')
      .select('capacidad_total, quinceanera_nombre')
      .eq('id', eventId)
      .maybeSingle<Pick<EventRow, 'capacidad_total' | 'quinceanera_nombre'>>(),
  ]);

  const familias = familiasRes.data ?? [];

  return NextResponse.json(
    {
      staff: sesion.nombre,
      evento: {
        quinceanera: eventoRes.data?.quinceanera_nombre ?? '',
        capacidadTotal: eventoRes.data?.capacidad_total ?? null,
      },
      resumen: summarizeTickets(familias),
      ingresados: familias.filter((f) => f.checked_in),
      pendientes: familias.filter(
        (f) => f.estado_confirmacion === 'confirmado' && !f.checked_in,
      ),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
