export function decisionCola(
  status: number,
  resultado?: string,
): 'borrar' | 'reintentar' | 'sesion' {
  if (status === 401 || status === 403) return 'sesion';
  if (status === 429 || status >= 500) return 'reintentar';
  // 409 (no caben más boletos, u otro acceso ganó la carrera) no se reintenta:
  // si se queda al frente, el resto de la cola nunca sale.
  if (status === 200 || status === 400 || status === 404 || status === 409 || status === 422) {
    void resultado;
    return 'borrar';
  }
  return 'reintentar';
}
