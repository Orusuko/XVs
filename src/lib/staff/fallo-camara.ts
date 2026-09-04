export function mensajeFalloCamara(error: { name?: string } | unknown): string {
  const name = typeof error === 'object' && error && 'name' in error ? String(error.name) : '';
  if (name === 'NotAllowedError') {
    return 'Hay que dar permiso de cámara en el navegador. Si no, usa la búsqueda por nombre.';
  }
  if (name === 'NotFoundError') {
    return 'Este aparato no tiene cámara. Usa la búsqueda por nombre en Historial.';
  }
  return 'No pudimos abrir la cámara. Revisa los permisos o usa la búsqueda por nombre.';
}
