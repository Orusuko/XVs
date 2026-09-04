import { describe, expect, test } from 'vitest';
import { decisionCola } from '@/lib/offline/decision-cola';

describe('decisionCola', () => {
  test('200 se borra de la cola aunque el QR ya no sirva', () => {
    expect(decisionCola(200, 'exitoso')).toBe('borrar');
    expect(decisionCola(200, 'duplicado')).toBe('borrar');
    expect(decisionCola(200, 'invalido')).toBe('borrar');
    expect(decisionCola(200, 'jti_expirado')).toBe('borrar');
  });

  test('401/403 cortan la sync: hay que volver a entrar', () => {
    expect(decisionCola(401)).toBe('sesion');
    expect(decisionCola(403)).toBe('sesion');
  });

  test('429 y 5xx se reintentan', () => {
    expect(decisionCola(429)).toBe('reintentar');
    expect(decisionCola(500)).toBe('reintentar');
  });
});
