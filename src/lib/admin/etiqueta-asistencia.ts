import { limiteBoletosFamilia } from '@/lib/boletos-familia';

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  rechazado: 'No asistirá',
};

export function etiquetaAsistenciaFamilia(familia: {
  estado_confirmacion: string;
  boletos_total: number;
  boletos_confirmados?: number | null;
}): string {
  const estado = familia.estado_confirmacion;
  if (estado !== 'confirmado') {
    return ETIQUETA_ESTADO[estado] ?? estado;
  }
  const confirmados = familia.boletos_confirmados;
  const cupo = limiteBoletosFamilia(familia);
  if (
    typeof confirmados === 'number' &&
    confirmados >= 0 &&
    confirmados < familia.boletos_total
  ) {
    return `Confirmado ${cupo} de ${familia.boletos_total}`;
  }
  return ETIQUETA_ESTADO.confirmado;
}