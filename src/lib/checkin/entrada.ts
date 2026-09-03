export function camposEntrada(nombre: string, origen: 'escaner' | 'manual') {
  return {
    checked_in: true as const,
    checked_in_at: new Date().toISOString(),
    checked_in_by: origen === 'manual' ? `${nombre} (manual)` : nombre,
    qr_jti: null,
  };
}
