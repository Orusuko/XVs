/** Invitaciones y RSVP solo cuando el evento está publicado (visitantes sin sesión admin). */

export function eventoAbiertoAInvitados(estado: string | null | undefined): boolean {
  return estado === 'publicado';
}

export const TITULO_INVITACION_NO_PUBLICADA = 'Esta invitación aún no está disponible';

export const DETALLE_INVITACION_NO_PUBLICADA =
  'El organizador todavía no ha publicado el evento. Vuelve más tarde o avisa a quien te invitó.';

export const ERROR_INVITACION_NO_PUBLICADA =
  'Esta invitación aún no está disponible hasta que el evento se publique.';

export const ERROR_CHECKIN_EVENTO_NO_PUBLICADO =
  'Este evento ya no está publicado. Los códigos generados antes de volver a borrador no sirven en la puerta.';