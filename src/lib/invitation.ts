import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  CLAVE_TEMPLATE_CONFIG,
  CLAVE_VESTIMENTA_CONFIG,
  TEMPLATE_POR_DEFECTO,
  esTemplateId,
} from '@/lib/templates/catalogo';
import type { EventRow, FamilyRow, InvitationView } from '@/lib/types';

/**
 * Single source of truth for what an invitation link may reveal. Both the page
 * and the JSON route go through here so the two can never drift apart.
 */
export async function loadInvitation(token: string): Promise<InvitationView | null> {
  const db = supabaseAdmin();

  const { data: familia, error: errFamilia } = await db
    .from('families')
    .select('id, event_id, nombre_familia, boletos_total, boletos_usados, estado_confirmacion, checked_in')
    .eq('token', token)
    .maybeSingle<
      Pick<
        FamilyRow,
        | 'id'
        | 'event_id'
        | 'nombre_familia'
        | 'boletos_total'
        | 'boletos_usados'
        | 'estado_confirmacion'
        | 'checked_in'
      >
    >();

  if (errFamilia) {
    console.error('invitation.families', errFamilia.message, errFamilia.code);
    return null;
  }

  if (!familia) return null;

  const { data: evento, error: errEvento } = await db
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

  if (errEvento) {
    console.error('invitation.events', errEvento.message, errEvento.code);
    return null;
  }

  if (!evento || evento.estado === 'cancelado') return null;

  const templateConfig = evento.template_config ?? {};
  const plantillaElegida = templateConfig[CLAVE_TEMPLATE_CONFIG];

  return {
    familia: {
      nombre: familia.nombre_familia,
      boletos: familia.boletos_total,
      estado: familia.estado_confirmacion,
      yaEntro: familia.checked_in || (familia.boletos_usados ?? 0) > 0,
    },
    evento: {
      quinceanera: evento.quinceanera_nombre,
      padre: evento.padre,
      madre: evento.madre,
      padrinos: evento.padrinos ?? [],
      mensaje: evento.mensaje,
      misa: evento.misa,
      recepcion: evento.recepcion,
      templateId: esTemplateId(plantillaElegida) ? plantillaElegida : TEMPLATE_POR_DEFECTO,
      templateConfig,
      vestimenta: templateConfig[CLAVE_VESTIMENTA_CONFIG] || null,
    },
  };
}
