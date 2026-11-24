import { limiteBoletosFamilia } from '@/lib/boletos-familia';

type FamiliaDeshacer = {
  boletos_total: number;
  boletos_confirmados?: number | null;
  qr_jti: string | null;
};

/**
 * Tras deshacer, el contador va a 0 de N; el QR depende solo de si el nonce sigue en BD.
 * No usar `checked_in`: con RSVP parcial puede estar desincronizado de `qr_jti` y invierte el aviso.
 */
export function mensajeDeshacerEntrada(familia: FamiliaDeshacer): {
  mismoQr: boolean;
  mensaje: string;
} {
  const cupo = limiteBoletosFamilia(familia);
  const mismoQr = Boolean(familia.qr_jti);
  const lineaEntrada = `Entrada de la familia deshecha (0 de ${cupo}).`;
  const lineaQr = mismoQr
    ? 'El mismo QR de la familia vuelve a servir.'
    : 'El pase impreso ya no sirve; la familia debe abrir su invitación en el teléfono para ver un código nuevo.';
  return { mismoQr, mensaje: `${lineaEntrada} ${lineaQr}` };
}