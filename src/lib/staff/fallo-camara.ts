export function mensajeFalloCamara(error: { name?: string } | unknown): string {
  const name = typeof error === 'object' && error && 'name' in error ? String(error.name) : '';
  if (name === 'NotAllowedError') {
    return 'Hay que dar permiso de cámara en el navegador. También puedes registrar entradas en Historial.';
  }
  if (name === 'NotFoundError') {
    return 'Este aparato no tiene cámara. Registra entradas en Historial con la búsqueda por nombre.';
  }
  return 'No pudimos abrir la cámara. Revisa los permisos o registra entradas en Historial.';
}
