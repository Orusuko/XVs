import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ERROR_CHECKIN_EVENTO_NO_PUBLICADO,
  ERROR_INVITACION_NO_PUBLICADA,
  eventoAbiertoAInvitados,
} from '@/lib/invitacion-publica';

export type BloqueoInvitacion = { status: 403; error: string } | { status: 500; error: string };

async function estadoEventoPublicacion(
  db: SupabaseClient,
  eventId: string,
): Promise<BloqueoInvitacion | null> {
  const { data: evento, error } = await db
    .from('events')
    .select('estado')
    .eq('id', eventId)
    .maybeSingle<{ estado: string }>();

  if (error) {
    console.error('invitacion.events.estado', error.code, error.message);
    return { status: 500, error: 'No pudimos verificar el evento.' };
  }

  if (!evento || !eventoAbiertoAInvitados(evento.estado)) {
    return { status: 403, error: '' };
  }

  return null;
}

/** Devuelve un bloqueo si el evento no está publicado; null si los invitados pueden continuar. */
export async function bloqueoSiEventoNoPublico(
  db: SupabaseClient,
  eventId: string,
): Promise<BloqueoInvitacion | null> {
  const base = await estadoEventoPublicacion(db, eventId);
  if (!base) return null;
  if (base.status === 500) return base;
  return { status: 403, error: ERROR_INVITACION_NO_PUBLICADA };
}

/** Mismo control, mensaje para personal de puerta (check-in). */
export async function bloqueoCheckinSiEventoNoPublico(
  db: SupabaseClient,
  eventId: string,
): Promise<BloqueoInvitacion | null> {
  const base = await estadoEventoPublicacion(db, eventId);
  if (!base) return null;
  if (base.status === 500) return base;
  return { status: 403, error: ERROR_CHECKIN_EVENTO_NO_PUBLICADO };
}