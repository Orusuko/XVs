import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { EventRow, FamilyRow, InvitationView } from '@/lib/types';

/**
 * Single source of truth for what an invitation link may reveal. Both the page
 * and the JSON route go through here so the two can never drift apart.
 */
export async function loadInvitation(token: string): Promise<InvitationView | null> {
  const db = supabaseAdmin();

  const { data: familia } = await db
    .from('families')
    .select('id, event_id, nombre_familia, boletos_total, estado_confirmacion')
    .eq('token', token)
    .maybeSingle<
      Pick<
        FamilyRow,
        'id' | 'event_id' | 'nombre_familia' | 'boletos_total' | 'estado_confirmacion'
      >
    >();

  if (!familia) return null;

  const { data: evento } = await db
    .from('events')
    .select(
      'quinceanera_nombre, padre, madre, padrinos, mensaje, misa, recepcion, template_config, estado',
    )
    .eq('id', familia.event_id)
    .maybeSingle<
      Pick<
        EventRow,
        | 'quinceanera_nombre'
        | 'padre'
        | 'madre'
        | 'padrinos'
        | 'mensaje'
        | 'misa'
        | 'recepcion'
        | 'template_config'
        | 'estado'
      >
    >();

  if (!evento || evento.estado === 'cancelado') return null;

  return {
    familia: {
      nombre: familia.nombre_familia,
      boletos: familia.boletos_total,
      estado: familia.estado_confirmacion,
    },
    evento: {
      quinceanera: evento.quinceanera_nombre,
      padre: evento.padre,
      madre: evento.madre,
      padrinos: evento.padrinos ?? [],
      mensaje: evento.mensaje,
      misa: evento.misa,
      recepcion: evento.recepcion,
      templateConfig: evento.template_config ?? {},
    },
  };
}
