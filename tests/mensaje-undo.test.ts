import { describe, expect, test } from 'vitest';
import { mensajeDeshacerEntrada } from '@/lib/checkin/mensaje-undo';

describe('mensajeDeshacerEntrada', () => {
  test('entrada parcial: nonce vivo → mismo QR (aunque checked_in fuera true por error)', () => {
    const { mismoQr, mensaje } = mensajeDeshacerEntrada({
      boletos_total: 2,
      boletos_confirmados: null,
      qr_jti: 'jti-vivo',
    });
    expect(mismoQr).toBe(true);
    expect(mensaje).toMatch(/\(0 de 2\)/);
    expect(mensaje).toMatch(/mismo QR/i);
    expect(mensaje).not.toMatch(/abrir su invitación/i);
  });

  test('entrada completa: nonce consumido → pase nuevo (aunque checked_in ya sea false tras undo)', () => {
    const { mismoQr, mensaje } = mensajeDeshacerEntrada({
      boletos_total: 4,
      boletos_confirmados: 4,
      qr_jti: null,
    });
    expect(mismoQr).toBe(false);
    expect(mensaje).toMatch(/\(0 de 4\)/);
    expect(mensaje).toMatch(/abrir su invitación/i);
  });

  test('RSVP parcial 2 de 3: cupo N en el aviso', () => {
    const { mensaje } = mensajeDeshacerEntrada({
      boletos_total: 3,
      boletos_confirmados: 2,
      qr_jti: 'jti',
    });
    expect(mensaje).toMatch(/\(0 de 2\)/);
  });

  test('usar checked_in invertiría el mensaje (regresión)', () => {
    const conNonce = mensajeDeshacerEntrada({
      boletos_total: 2,
      boletos_confirmados: null,
      qr_jti: 'jti',
    }).mismoQr;
    const sinNonce = mensajeDeshacerEntrada({
      boletos_total: 4,
      boletos_confirmados: null,
      qr_jti: null,
    }).mismoQr;
    expect(conNonce).toBe(true);
    expect(sinNonce).toBe(false);
  });
});