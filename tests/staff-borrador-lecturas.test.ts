import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { POLITICA_STAFF_BORRADOR } from '@/lib/checkin/politica-borrador-staff';

let estadoEvento = 'borrador';

vi.mock('@/lib/staff-session', () => ({
  readStaffSession: async () => ({ eventId: 'ev-1', nombre: 'Ana' }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: (tabla: string) => {
      if (tabla === 'events') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  quinceanera_nombre: 'María',
                  capacidad_total: 100,
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

vi.mock('@/lib/supabase/families-query', () => ({
  consultarFamiliasEvento: async () => ({ data: [], error: null }),
}));

const { GET: estadoGet } = await import('@/app/api/staff/estado/route');

describe('staff con evento en borrador', () => {
  beforeEach(() => {
    resetRateLimitStore();
    estadoEvento = 'borrador';
  });

  test('política documentada', () => {
    expect(POLITICA_STAFF_BORRADOR).toMatch(/Conteo/i);
    expect(POLITICA_STAFF_BORRADOR).toMatch(/Deshacer/i);
  });

  test('GET /api/staff/estado sigue respondiendo (con estado del evento)', async () => {
    const respuesta = await estadoGet(
      new Request('http://localhost/api/staff/estado?eventId=ev-1'),
    );
    expect(respuesta.status).toBe(200);
    const datos = await respuesta.json();
    expect(datos.evento.estado).toBe('borrador');
  });
});