import { describe, expect, test } from 'vitest';
import { camposEntrada } from '@/lib/checkin/entrada';

describe('camposEntrada', () => {
  test('siempre apaga qr_jti', () => {
    const campos = camposEntrada('María', 'escaner');
    expect(campos.checked_in).toBe(true);
    expect(campos.qr_jti).toBeNull();
    expect(campos.checked_in_by).toBe('María');
    expect(Number.isNaN(Date.parse(campos.checked_in_at))).toBe(false);
  });

  test('el origen manual etiqueta al staff', () => {
    expect(camposEntrada('María', 'manual').checked_in_by).toBe('María (manual)');
  });
});
