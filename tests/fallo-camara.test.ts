import { describe, expect, test } from 'vitest';
import { mensajeFalloCamara } from '@/lib/staff/fallo-camara';

describe('mensajeFalloCamara', () => {
  test('distingue permiso, cámara ausente y el resto', () => {
    expect(mensajeFalloCamara({ name: 'NotAllowedError' })).toMatch(/permiso/i);
    expect(mensajeFalloCamara({ name: 'NotFoundError' })).toMatch(/cámara/i);
    expect(mensajeFalloCamara({})).toMatch(/búsqueda por nombre/i);
  });
});
