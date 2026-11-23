import { describe, expect, test } from 'vitest';
import { camposEntrada } from '@/lib/checkin/entrada';

describe('camposEntrada', () => {
  test('entrada parcial suma boletos_usados y no quema el QR ni marca checked_in', () => {
    const campos = camposEntrada('María', 'escaner', 0, 2, 5);
    expect(campos.boletos_usados).toBe(2);
    expect(campos.checked_in).toBe(false);
    expect('qr_jti' in campos).toBe(false);
    expect(campos.checked_in_by).toBe('María');
    expect(Number.isNaN(Date.parse(campos.checked_in_at))).toBe(false);
  });

  test('al completar boletos_total marca checked_in y apaga qr_jti', () => {
    const campos = camposEntrada('María', 'escaner', 2, 3, 5);
    expect(campos.boletos_usados).toBe(5);
    expect(campos.checked_in).toBe(true);
    expect(campos.qr_jti).toBeNull();
  });

  test('el origen manual etiqueta al staff', () => {
    expect(camposEntrada('María', 'manual', 0, 1, 1).checked_in_by).toBe('María (manual)');
  });
});
