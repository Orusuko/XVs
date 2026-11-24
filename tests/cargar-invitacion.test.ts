import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const familiaDb = {
  id: 'fam-1',
  event_id: 'ev-1',
  nombre_familia: 'Ramírez',
  boletos_total: 4,
  boletos_usados: 0,
  estado_confirmacion: 'pendiente' as const,
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
    }
  });
});