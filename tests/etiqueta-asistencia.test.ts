import { describe, expect, test } from 'vitest';
import { etiquetaAsistenciaFamilia } from '@/lib/admin/etiqueta-asistencia';

describe('etiquetaAsistenciaFamilia', () => {
  test('RSVP parcial muestra Confirmado 2 de 3', () => {
    expect(
      etiquetaAsistenciaFamilia({
        estado_confirmacion: 'confirmado',
        boletos_total: 3,
        boletos_confirmados: 2,
      }),
    ).toBe('Confirmado 2 de 3');
  });

  test('confirmación total mantiene Confirmado', () => {
    expect(
      etiquetaAsistenciaFamilia({
        estado_confirmacion: 'confirmado',
        boletos_total: 3,
        boletos_confirmados: 3,
      }),
    ).toBe('Confirmado');
  });
});