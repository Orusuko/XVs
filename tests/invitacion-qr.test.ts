import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';

vi.mock('server-only', () => ({}));

const familiaDb = {
  id: 'fam-1',
  event_id: 'ev-1',
  nombre_familia: 'Ramírez',
  boletos_total: 5,
  boletos_confirmados: 3 as number | null,
  estado_confirmacion: 'confirmado' as const,
  qr_jti: 'jti-vivo',
};

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: (tabla: string) => {
      if (tabla === 'events') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { estado: 'publicado' }, error: null }),
            }),
          }),
        };
      }
      if (tabla === 'families') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { ...familiaDb }, error: null }),
            }),
          }),
        };
      }
      throw new Error(`tabla: ${tabla}`);
    },
  }),
}));

const { GET } = await import('@/app/api/invitacion/[token]/qr/route');

describe('GET /api/invitacion/[token]/qr', () => {
  beforeEach(() => {
    resetRateLimitStore();
    familiaDb.boletos_confirmados = 3;
  });

  test('boletos en JSON usa cupo confirmado, no boletos_total', async () => {
    const respuesta = await GET(new Request('http://localhost/api/invitacion/tok/qr'), {
      params: Promise.resolve({ token: 'tok' }),
    });
    expect(respuesta.status).toBe(200);
    const datos = await respuesta.json();
    expect(datos.boletos).toBe(3);
    expect(datos.qr).toBeTruthy();
  });
});