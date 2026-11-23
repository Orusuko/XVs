import { describe, expect, test } from 'vitest';
import { formatearHora, partesFecha } from '@/lib/format';

describe('format America/Mexico_City', () => {
  test('recepción a las 19:00 en México (01:00 UTC del día siguiente) conserva el mismo día', () => {
    const iso = '2026-11-29T01:00:00.000Z'; // 28 nov 2026, 19:00 en America/Mexico_City (UTC-6)
    const partes = partesFecha(iso);

    expect(partes).toEqual({
      dia: '28',
      mes: 'nov',
      anio: '2026',
    });

    const hora = formatearHora(iso).toLowerCase();
    expect(hora).toContain('7:00');
    expect(hora).toContain('p.');
  });
});
