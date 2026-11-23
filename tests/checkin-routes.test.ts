import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { signQrToken } from '@/lib/qr/sign';

const estadoDb = {
  familia: {
    id: 'fam-1',
    event_id: 'ev-1',
    nombre_familia: 'Martínez',
    boletos_total: 4,
    boletos_usados: 0,
    estado_confirmacion: 'confirmado',
    qr_jti: 'jti-1' as string | null,
    checked_in: false,
    checked_in_at: null as string | null,
  },
  errorSelect: null as { code: string; message: string } | null,
  errorUpdate: null as { code: string; message: string } | null,
  ultimosFiltros: {} as Record<string, unknown>,
};

vi.mock('@/lib/staff-session', () => ({
  readStaffSession: async () => ({ eventId: 'ev-1', nombre: 'Ana' }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: (tabla: string) => {
      if (tabla === 'checkin_logs') {
        return { insert: async () => ({ error: null }) };
      }

      return {
        select: () => ({
          eq: () => {
            const q = {
              eq: () => q,
              maybeSingle: async () => {
                if (estadoDb.errorSelect) {
                  return { data: null, error: estadoDb.errorSelect };
                }
                return { data: { ...estadoDb.familia }, error: null };
              },
            };
            return q;
          },
        }),
        update: (valores: Record<string, unknown>) => {
          const filtros: Record<string, unknown> = {};
          const chain = {
            eq: (col: string, val: unknown) => {
              filtros[col] = val;
              return chain;
            },
            lte: (col: string, val: unknown) => {
              filtros[`lte:${col}`] = val;
              return chain;
            },
            select: () => {
              const run = async () => {
                estadoDb.ultimosFiltros = filtros;
                if (estadoDb.errorUpdate) {
                  return { data: null, error: estadoDb.errorUpdate };
                }
                const fam = estadoDb.familia;
                const coincide =
                  fam.id === filtros.id &&
                  (!('qr_jti' in filtros) || fam.qr_jti === filtros.qr_jti) &&
                  fam.checked_in === filtros.checked_in &&
                  fam.boletos_usados === filtros.boletos_usados &&
                  (!('lte:boletos_usados' in filtros) ||
                    fam.boletos_usados <= (filtros['lte:boletos_usados'] as number));

                if (!coincide) {
                  return { data: [], error: null };
                }

                Object.assign(fam, valores);
                return { data: [{ ...fam }], error: null };
              };
              return Object.assign(run(), { returns: run });
            },
          };
          return chain;
        },
      };
    },
  }),
}));

const { POST: checkinPost } = await import('@/app/api/checkin/route');
const { POST: manualPost } = await import('@/app/api/checkin/manual/route');

describe('Check-in por boletos y errores 500', () => {
  beforeEach(() => {
    resetRateLimitStore();
    estadoDb.familia = {
      id: 'fam-1',
      event_id: 'ev-1',
      nombre_familia: 'Martínez',
      boletos_total: 4,
      boletos_usados: 0,
      estado_confirmacion: 'confirmado',
      qr_jti: 'jti-1',
      checked_in: false,
      checked_in_at: null,
    };
    estadoDb.errorSelect = null;
    estadoDb.errorUpdate = null;
    estadoDb.ultimosFiltros = {};
  });

  test('entrada parcial resta solo esos boletos y no borra qr_jti hasta completar boletos_total', async () => {
    const qr = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: 'jti-1' });

    const r1 = await checkinPost(
      new Request('http://localhost/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.1' },
        body: JSON.stringify({ qr, eventId: 'ev-1', cantidad: 2 }),
      }),
    );
    const d1 = await r1.json();

    expect(r1.status).toBe(200);
    expect(d1.resultado).toBe('exitoso');
    expect(d1.boletos).toBe(2);
    expect(d1.boletosUsados).toBe(2);
    expect(d1.boletosRestantes).toBe(2);
    expect(estadoDb.familia.checked_in).toBe(false);
    expect(estadoDb.familia.qr_jti).toBe('jti-1');
    expect(estadoDb.ultimosFiltros.qr_jti).toBe('jti-1');

    const r2 = await checkinPost(
      new Request('http://localhost/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.2' },
        body: JSON.stringify({ qr, eventId: 'ev-1', cantidad: 2 }),
      }),
    );
    const d2 = await r2.json();

    expect(r2.status).toBe(200);
    expect(d2.resultado).toBe('exitoso');
    expect(d2.boletosRestantes).toBe(0);
    expect(estadoDb.familia.checked_in).toBe(true);
    expect(estadoDb.familia.qr_jti).toBeNull();
  });

  test('error de Postgres en update responde 500 y no duplicado', async () => {
    const qr = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: 'jti-1' });
    estadoDb.errorUpdate = { code: '08006', message: 'connection failure' };

    const res = await checkinPost(
      new Request('http://localhost/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.3' },
        body: JSON.stringify({ qr, eventId: 'ev-1', cantidad: 1 }),
      }),
    );

    expect(res.status).toBe(500);
  });

  test('error de Postgres en manual responde 500 y no duplicado', async () => {
    estadoDb.errorUpdate = { code: '57014', message: 'query timeout' };

    const res = await manualPost(
      new Request('http://localhost/api/checkin/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.4' },
        body: JSON.stringify({ eventId: 'ev-1', familyId: 'fam-1', cantidad: 1 }),
      }),
    );

    expect(res.status).toBe(500);
  });

  test('no permite contar más de los boletos que faltan', async () => {
    estadoDb.familia.boletos_usados = 3;
    const qr = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: 'jti-1' });

    const res = await checkinPost(
      new Request('http://localhost/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.5' },
        body: JSON.stringify({ qr, eventId: 'ev-1', cantidad: 2 }),
      }),
    );

    expect(res.status).toBe(409);
    expect(estadoDb.familia.boletos_usados).toBe(3);
  });
});
