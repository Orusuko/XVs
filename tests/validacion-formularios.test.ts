import { describe, expect, test } from 'vitest';
import {
  validarCamposEvento,
  validarCapacidadApi,
  validarCorreo,
  validarEnlaceMaps,
  validarFotoUrl,
  validarPinStaff,
  validarUrlOpcionalAbsoluta,
  MAX_NOMBRE,
} from '@/lib/validacion-formularios';

describe('validacion-formularios', () => {
  test('rechaza no-link en Maps y normaliza URLs válidas', () => {
    expect(validarEnlaceMaps('no-link')).toMatch(/no es válido/i);
    expect(validarUrlOpcionalAbsoluta('https://maps.app.goo.gl/abc', 'Maps')).toBeNull();
    expect(validarUrlOpcionalAbsoluta('/ruta', 'Maps')).toMatch(/completo/i);
  });

  test('rechaza foto http y no-link', () => {
    expect(validarFotoUrl('no-link')).toMatch(/foto/i);
    expect(validarFotoUrl('http://example.com/f.jpg')).toMatch(/https/i);
    expect(validarFotoUrl('https://example.com/f.jpg')).toBeNull();
  });

  test('rechaza capacidad 0 en API', () => {
    expect(validarCapacidadApi(0)).toMatch(/mayor que cero/i);
    expect(validarCapacidadApi(50)).toBeNull();
  });

  test('valida correo en español', () => {
    expect(validarCorreo('')).toMatch(/correo/i);
    expect(validarCorreo('mal@')).toMatch(/válido/i);
    expect(validarCorreo('ok@ejemplo.com')).toBeNull();
  });

  test('rechaza PIN con letras o débil', () => {
    expect(validarPinStaff('12ab56')).toMatch(/números/i);
    expect(validarPinStaff('123456')).toMatch(/difícil/i);
    expect(validarPinStaff('847291')).toBeNull();
  });

  test('valida evento en servidor: longitud y padrinos', () => {
    const largo = 'a'.repeat(MAX_NOMBRE + 1);
    expect(validarCamposEvento({ quinceanera_nombre: largo })).toMatch(
      new RegExp(`${MAX_NOMBRE}`),
    );

    expect(
      validarCamposEvento({
        misa: { maps_url: 'no-link' },
      }),
    ).toMatch(/misa/i);

    expect(
      validarCamposEvento({
        template_config: { foto_url: 'http://inseguro.com/x.jpg' },
      }),
    ).toMatch(/https/i);
  });
});