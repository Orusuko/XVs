export type FamilyTicketRow = {
  boletos_total: number;
  boletos_usados?: number;
  estado_confirmacion: string;
  checked_in: boolean;
};

export type TicketSummary = {
  total: number;
  confirmados: number;
  pendientes: number;
  rechazados: number;
  ingresados: number;
  porIngresar: number;
};

/**
 * Every figure here is a ticket count. Families are the unit of the guest list,
 * but the venue cares about how many people walk through the door.
 */
export function summarizeTickets(familias: FamilyTicketRow[]): TicketSummary {
  const resumen: TicketSummary = {
    total: 0,
    confirmados: 0,
    pendientes: 0,
    rechazados: 0,
    ingresados: 0,
    porIngresar: 0,
  };

  for (const familia of familias) {
    const boletos = familia.boletos_total;
    resumen.total += boletos;

    if (familia.estado_confirmacion === 'confirmado') {
      resumen.confirmados += boletos;
      const usados = familia.checked_in
        ? boletos
        : Math.min(boletos, Math.max(0, familia.boletos_usados ?? 0));
      resumen.ingresados += usados;
      resumen.porIngresar += boletos - usados;
    } else if (familia.estado_confirmacion === 'rechazado') {
      resumen.rechazados += boletos;
    } else {
      resumen.pendientes += boletos;
    }
  }

  return resumen;
}
