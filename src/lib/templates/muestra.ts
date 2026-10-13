import {
  CLAVE_TEMPLATE_CONFIG,
  CLAVE_VESTIMENTA_CONFIG,
  TEMPLATE_POR_DEFECTO,
  esTemplateId,
} from '@/lib/templates/catalogo';
import type { InvitationView, Lugar, Padrino } from '@/lib/types';

/** Invitación de demostración para la vista previa del organizador. */
export function invitacionMuestra(evento: {
  quinceanera_nombre: string;
  padre: string | null;
  madre: string | null;
  padrinos: Padrino[];
  mensaje: string | null;
  misa: Lugar | null;
  recepcion: Lugar | null;
  template_config: Record<string, string>;
}): InvitationView {
  const templateConfig = evento.template_config ?? {};
  const plantillaElegida = templateConfig[CLAVE_TEMPLATE_CONFIG];

  return {
    familia: { nombre: 'Los Ramírez', boletos: 4, estado: 'pendiente' },
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
