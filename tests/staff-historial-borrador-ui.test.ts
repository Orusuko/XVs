import { describe, expect, test } from 'vitest';
import {
  AVISO_PUBLICAR_PARA_ENTRADAS,
  staffPuedeRegistrarEntradaNueva,
} from '@/lib/checkin/politica-borrador-staff';

describe('Historial: entradas nuevas en borrador', () => {
  test('solo evento publicado permite Marcar entrada', () => {
    expect(staffPuedeRegistrarEntradaNueva('publicado')).toBe(true);
    expect(staffPuedeRegistrarEntradaNueva('borrador')).toBe(false);
    expect(staffPuedeRegistrarEntradaNueva('cancelado')).toBe(false);
  });

  test('aviso para controles deshabilitados', () => {
    expect(AVISO_PUBLICAR_PARA_ENTRADAS).toMatch(/Publica el evento/i);
  });
});