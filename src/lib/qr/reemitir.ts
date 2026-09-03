export function debeRemintar(familia: {
  estado_confirmacion: string;
  qr_jti: string | null;
}): boolean {
  return familia.estado_confirmacion === 'confirmado' && !familia.qr_jti;
}
