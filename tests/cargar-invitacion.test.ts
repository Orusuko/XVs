import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const familiaDb = {
  id: 'fam-1',
  event_id: 'ev-1',
  nombre_familia: 'Ramírez',
  boletos_total: 5,
  boletos_confirmados: null as number | null,
  boletos_usados: 0,
  estado_confirmacion: 'pendiente' as 'pendiente' | 'confirmado' | 'rechazado',
  checked_in: false,
};

let estadoEvento = 'publicado';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: (tabla: string) => {
      if (tabla === 'families') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { ...familiaDb }, error: null }),
            }),
          }),
        };
      }
      if (tabla === 'events') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  quinceanera_nombre: 'María',
                  padre: null,
                  madre: null,
                  padrinos: [],
                  mensaje: 'Hola',
                  misa: null,
                  recepcion: null,
                  template_config: {},
                  estado: estadoEvento,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`tabla inesperada: ${tabla}`);
    },
  }),
}));

const { cargarInvitacion } = await import('@/lib/invitation');

describe('cargarInvitacion', () => {
  beforeEach(() => {
    estadoEvento = 'publicado';
  });

  test('evento en borrador bloquea la invitación al invitado', async () => {
    estadoEvento = 'borrador';
    const resultado = await cargarInvitacion('tok-test');
    expect(resultado.tipo).toBe('no_publicado');
  });

  test('evento publicado devuelve vista', async () => {
    const resultado = await cargarInvitacion('tok-test');
    expect(resultado.tipo).toBe('ok');
    if (resultado.tipo === 'ok') {
      expect(resultado.vista.familia.nombre).toBe('Ramírez');
      expect(resultado.vista.familia.boletosTotal).toBe(5);
      expect(resultado.vista.familia.boletos).toBe(5);
    }
  });

  test('boletos en vista usa boletos_confirmados cuando existe', async () => {
    familiaDb.estado_confirmacion = 'confirmado';
    familiaDb.boletos_confirmados = 2;
    const resultado = await cargarInvitacion('tok-test');
    expect(resultado.tipo).toBe('ok');
    if (resultado.tipo === 'ok') {
      expect(resultado.vista.familia.boletos).toBe(2);
      expect(resultado.vista.familia.boletosTotal).toBe(5);
    }
    familiaDb.estado_confirmacion = 'pendiente';
    familiaDb.boletos_confirmados = null;
  });
});