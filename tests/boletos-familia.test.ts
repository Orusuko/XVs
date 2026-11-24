import { describe, expect, test } from 'vitest';
import { esColumnaFaltante, limiteBoletosFamilia } from '@/lib/boletos-familia';

describe('limiteBoletosFamilia', () => {
  test('usa boletos_confirmados cuando es válido', () => {
    expect(limiteBoletosFamilia({ boletos_total: 5, boletos_confirmados: 2 })).toBe(2);
  });

  test('cae a boletos_total si confirmados es null o inválido', () => {
    expect(limiteBoletosFamilia({ boletos_total: 4, boletos_confirmados: null })).toBe(4);
    expect(limiteBoletosFamilia({ boletos_total: 4, boletos_confirmados: 9 })).toBe(4);
  });
});

describe('esColumnaFaltante', () => {
  test('detecta 42703 con el nombre de columna', () => {
    expect(
      esColumnaFaltante(
        { code: '42703', message: 'column families.boletos_confirmados does not exist' },
        'boletos_confirmados',
      ),
    ).toBe(true);
    expect(esColumnaFaltante({ code: '42703', message: 'other column' }, 'boletos_confirmados')).toBe(
      false,
    );
  });
});