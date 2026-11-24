export const MENSAJES_INVITACION = [
  'Hay momentos que se guardan para siempre, y quiero que tú seas parte de este.',
  'Con la ilusión de cumplir quince años, me encantaría celebrarlo contigo.',
  'Hoy dejo atrás la niñez y me acompañas a empezar una etapa nueva.',
  'Gracias por caminar conmigo hasta aquí. Acompáñame también esa noche.',
] as const;

export const ETIQUETAS_MENSAJES: Record<(typeof MENSAJES_INVITACION)[number], string> = {
  [MENSAJES_INVITACION[0]]: 'Momento especial',
  [MENSAJES_INVITACION[1]]: 'Ilusión de mis XV',
  [MENSAJES_INVITACION[2]]: 'Nueva etapa',
  [MENSAJES_INVITACION[3]]: 'Gratitud',
};

export function esMensajeCatalogo(texto: string): boolean {
  return (MENSAJES_INVITACION as readonly string[]).includes(texto);
}
