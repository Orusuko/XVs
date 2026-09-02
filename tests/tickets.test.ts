import { describe, expect, test } from 'vitest';
import { summarizeTickets, type FamilyTicketRow } from '@/lib/tickets';

const familias: FamilyTicketRow[] = [
  { boletos_total: 5, estado_confirmacion: 'confirmado', checked_in: true },
  { boletos_total: 4, estado_confirmacion: 'confirmado', checked_in: false },
  { boletos_total: 3, estado_confirmacion: 'pendiente', checked_in: false },
  { boletos_total: 2, estado_confirmacion: 'rechazado', checked_in: false },
];

describe('summarizeTickets', () => {
  test('counts tickets, not families', () => {
    const resumen = summarizeTickets(familias);

    expect(resumen.total).toBe(14);
    expect(resumen.confirmados).toBe(9);
    expect(resumen.pendientes).toBe(3);
    expect(resumen.rechazados).toBe(2);
  });

  test('porIngresar only counts families that confirmed and have not entered', () => {
    const resumen = summarizeTickets(familias);

    expect(resumen.ingresados).toBe(5);
    expect(resumen.porIngresar).toBe(4);
  });

  test('an empty guest list produces zeroes rather than NaN', () => {
    expect(summarizeTickets([])).toEqual({
      total: 0,
      confirmados: 0,
      pendientes: 0,
      rechazados: 0,
      ingresados: 0,
      porIngresar: 0,
    });
  });
});
