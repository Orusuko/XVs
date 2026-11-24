import { describe, expect, test } from 'vitest';
import {
  esFotoUrlValida,
  normalizarMapsUrl,
  validarCapacidad,
  validarCorreo,
  validarPinStaff,
} from '@/lib/validacion-formularios';

describe('validacion-formularios', () => {
  test('rechaza no-link y normaliza URLs de Maps', () => {
    expect(normalizarMapsUrl('no-link')).toBeNull();
    expect(normalizarMapsUrl('https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc');
    expect(normalizarMapsUrl('maps.google.com/?q=1')).toBe('https://maps.google.com/?q=1');
  });

  test('rechaza foto no-link', () => {
    expect(esFotoUrlValida('no-link')).toBe(false);
    expect(esFotoUrlValida('https://example.com/f.jpg')).toBe(true);
  });

  test('rechaza capacidad negativa', () => {
    expect(validarCapacidad('-3')).toMatch(/negativo/i);
  });

  test('valida correo en español', () => {
    expect(validarCorreo('')).toMatch(/correo/i);
    expect(validarCorreo('mal@')).toMatch(/válido/i);
    expect(validarCorreo('ok@ejemplo.com')).toBeNull();
  });

  test('rechaza PIN débil 123456', () => {
    expect(validarPinStaff('123456')).toMatch(/difícil/i);
    expect(validarPinStaff('123')).toMatch(/6 y 8/);
  });
});