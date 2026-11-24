import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { readStaffSession } from '@/lib/staff-session';
import { limiteBoletosFamilia } from '@/lib/boletos-familia';
import { consultarFamiliasEvento } from '@/lib/supabase/families-query';
import { summarizeTickets } from '@/lib/tickets';
import type { EventRow, FamilyRow } from '@/lib/types';

const CAMPOS_CON =
  'id, nombre_familia, boletos_total, boletos_confirmados, boletos_usados, estado_confirmacion, checked_in, checked_in_at, checked_in_by';
const CAMPOS_SIN =
  'id, nombre_familia, boletos_total, boletos_usados, estado_confirmacion, checked_in, checked_in_at, checked_in_by';

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
    consultarFamiliasEvento(db, eventId, CAMPOS_CON, CAMPOS_SIN, {
      orden: { columna: 'checked_in_at', ascendente: false, nullsFirst: false },
    }),
    db
      .from('events')
      .select('capacidad_total, quinceanera_nombre')
      .eq('id', eventId)
      .maybeSingle<Pick<EventRow, 'capacidad_total' | 'quinceanera_nombre'>>(),
  ]);

  if (familiasRes.error || eventoRes.error) {
    console.error('staff.estado', familiasRes.error?.code ?? eventoRes.error?.code);
    return NextResponse.json({ error: 'No pudimos leer el conteo.' }, { status: 500 });
  }

  const familias = (familiasRes.data ?? []) as unknown as Pick<
    FamilyRow,
    | 'id'
    | 'nombre_familia'
    | 'boletos_total'
    | 'boletos_confirmados'
    | 'boletos_usados'
    | 'estado_confirmacion'
    | 'checked_in'
    | 'checked_in_at'
    | 'checked_in_by'
  >[];

  return NextResponse.json(
    {
      staff: sesion.nombre,
      evento: {
        quinceanera: eventoRes.data?.quinceanera_nombre ?? '',
        capacidadTotal: eventoRes.data?.capacidad_total ?? null,
      },
      resumen: summarizeTickets(familias),
      ingresados: familias.filter((f) => f.boletos_usados > 0 || f.checked_in),
      pendientes: familias.filter((f) => {
        if (f.estado_confirmacion !== 'confirmado' || f.checked_in) return false;
        const tope = limiteBoletosFamilia(f as FamilyRow);
        return (f.boletos_usados ?? 0) < tope;
      }),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
