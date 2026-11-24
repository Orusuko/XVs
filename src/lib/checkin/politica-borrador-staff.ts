/**
 * Evento en borrador: el personal no puede registrar entradas nuevas (escáner, preview, manual),
 * pero sí consultar Conteo/Historial (`GET /api/staff/estado`) y corregir con Deshacer (`POST /api/checkin/undo`).
 * Intencional: las lecturas y el undo no publican el evento al invitado.
 */
export const POLITICA_STAFF_BORRADOR =
  'En borrador solo se bloquean entradas nuevas; Conteo, Historial y Deshacer siguen disponibles.';