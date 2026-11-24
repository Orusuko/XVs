/** Cupo efectivo de boletos (confirmación parcial o total). */
export function limiteBoletosFamilia(familia: {
  boletos_total: number;
  boletos_confirmados?: number | null;
}): number {
  const confirmados = familia.boletos_confirmados;
  if (
    typeof confirmados === 'number' &&
    Number.isInteger(confirmados) &&
    confirmados >= 0 &&
    confirmados <= familia.boletos_total
  ) {
    return confirmados;
  }
  return familia.boletos_total;
}

export function esColumnaFaltante(
  error: { code?: string; message?: string } | null | undefined,
  columna: string,
): boolean {
  return error?.code === '42703' && Boolean(error.message?.includes(columna));
}