import { describe, expect, test } from 'vitest';
import { debeRemintar } from '@/lib/qr/reemitir';

describe('debeRemintar', () => {
  test('confirmada sin nonce (tras entrar o deshacer) necesita pase nuevo', () => {
    expect(debeRemintar({ estado_confirmacion: 'confirmado', qr_jti: null })).toBe(true);
  });

  test('confirmada con nonce vigente no rota', () => {
    expect(debeRemintar({ estado_confirmacion: 'confirmado', qr_jti: 'abc' })).toBe(false);
  });

  test('pendiente o rechazada no reminta', () => {
    expect(debeRemintar({ estado_confirmacion: 'pendiente', qr_jti: null })).toBe(false);
    expect(debeRemintar({ estado_confirmacion: 'rechazado', qr_jti: null })).toBe(false);
  });
});
