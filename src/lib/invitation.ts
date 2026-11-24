import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  CLAVE_TEMPLATE_CONFIG,
  CLAVE_VESTIMENTA_CONFIG,
  TEMPLATE_POR_DEFECTO,
  esTemplateId,
} from '@/lib/templates/catalogo';
import type { EventRow, FamilyRow, InvitationView } from '@/lib/types';

export type ResultadoInvitacion =
  | { tipo: 'ok'; vista: InvitationView }
  | { tipo: 'no_encontrada' }
  | { tipo: 'indisponible' };

function esErrorColumnaFaltante(codigo: string | undefined): boolean {
  return codigo === '42703' || codigo === 'PGRST204';
}

/**
 * Single source of truth for what an invitation link may reveal. Both the page
 * and the JSON route go through here so the two can never drift apart.
 */
export async function cargarInvitacion(token: string): Promise<ResultadoInvitacion> {
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
    if (esErrorColumnaFaltante(errFamilia.code)) return { tipo: 'indisponible' };
    return { tipo: 'no_encontrada' };
  }

  if (!familia) return { tipo: 'no_encontrada' };

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
    if (esErrorColumnaFaltante(errEvento.code)) return { tipo: 'indisponible' };
    return { tipo: 'no_encontrada' };
  }

  if (!evento || evento.estado === 'cancelado') return { tipo: 'no_encontrada' };

  const templateConfig = evento.template_config ?? {};
  const plantillaElegida = templateConfig[CLAVE_TEMPLATE_CONFIG];

  return {
    tipo: 'ok',
    vista: {
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
    },
  };
}

export async function loadInvitation(token: string): Promise<InvitationView | null> {
  const resultado = await cargarInvitacion(token);
  return resultado.tipo === 'ok' ? resultado.vista : null;
}