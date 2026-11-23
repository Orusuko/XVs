export function camposEntrada(
  nombre: string,
  origen: 'escaner' | 'manual',
  boletosUsadosActuales: number,
  entran: number,
  boletosTotal: number,
) {
  const nuevosUsados = boletosUsadosActuales + entran;
  const completo = nuevosUsados >= boletosTotal;

  return {
    boletos_usados: nuevosUsados,
    checked_in: completo,
    checked_in_at: new Date().toISOString(),
    checked_in_by: origen === 'manual' ? `${nombre} (manual)` : nombre,
    ...(completo ? { qr_jti: null as null } : {}),
  };
}
