export function decisionCola(
  status: number,
  resultado?: string,
): 'borrar' | 'reintentar' | 'sesion' {
  if (status === 401 || status === 403) return 'sesion';
  if (status === 429 || status >= 500) return 'reintentar';
  if (status === 200) {
    void resultado;
    return 'borrar';
  }
  return 'reintentar';
}
