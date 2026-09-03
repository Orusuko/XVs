import { describe, expect, test } from 'vitest';
import { MENSAJES_INVITACION, esMensajeCatalogo } from '@/lib/mensajes-invitacion';

describe('mensajes de invitación', () => {
  test('hay exactamente cuatro frases y ninguna está vacía', () => {
    expect(MENSAJES_INVITACION).toHaveLength(4);
    expect(MENSAJES_INVITACION.every((m) => m.trim().length > 20)).toBe(true);
  });

  test('una frase del catálogo se reconoce; un texto propio no', () => {
    expect(esMensajeCatalogo(MENSAJES_INVITACION[0]!)).toBe(true);
    expect(esMensajeCatalogo('Nos vemos en el vals.')).toBe(false);
  });
});
