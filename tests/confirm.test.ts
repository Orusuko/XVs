import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { verifyQrToken } from '@/lib/qr/verify';

const familiaDb = {
  id: 'fam-1',
  event_id: 'ev-1',
  nombre_familia: 'López',
  boletos_total: 4,
  boletos_usados: 0,
  estado_confirmacion: 'pendiente' as 'pendiente' | 'confirmado' | 'rechazado',
  qr_jti: null as string | null,
  checked_in: false,
};

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { ...familiaDb }, error: null }),
        }),
      }),
      update: (valores: Record<string, unknown>) => {
        const filtros: Record<string, unknown> = {};
        const chain = {
          eq: (col: string, val: unknown) => {
            filtros[col] = val;
            return chain;
          },
          is: (col: string, val: unknown) => {
            filtros[col] = val;
            return chain;
          },
          select: async () => {
            if (
              ('checked_in' in filtros && familiaDb.checked_in !== filtros.checked_in) ||
              ('boletos_usados' in filtros && familiaDb.boletos_usados !== filtros.boletos_usados)
            ) {
              return { data: [], error: null };
            }
            Object.assign(familiaDb, valores);
            return { data: [{ id: familiaDb.id, qr_jti: familiaDb.qr_jti }], error: null };
          },
        };
        return chain;
      },
    }),
  }),
}));

const { POST } = await import('@/app/api/confirm/[token]/route');

function confirmRequest(asistira: boolean, ip: string) {
  return POST(
    new Request('http://localhost/api/confirm/tok-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ asistira }),
    }),
    { params: Promise.resolve({ token: 'tok-1' }) },
  );
}

describe('POST /api/confirm/[token]', () => {
  beforeEach(() => {
    resetRateLimitStore();
    familiaDb.boletos_usados = 0;
    familiaDb.estado_confirmacion = 'pendiente';
    familiaDb.qr_jti = null;
    familiaDb.checked_in = false;
  });

  test('dos confirmaciones seguidas devuelven exactamente el mismo pase y jti', async () => {
    const r1 = await confirmRequest(true, '10.0.1.1');
    const d1 = await r1.json();
    expect(r1.status).toBe(200);
    expect(d1.estado).toBe('confirmado');

    const r2 = await confirmRequest(true, '10.0.1.2');
    const d2 = await r2.json();
    expect(r2.status).toBe(200);
    expect(d2.estado).toBe('confirmado');

    const v1 = await verifyQrToken(d1.qr);
    const v2 = await verifyQrToken(d2.qr);
    expect(v1.ok && v2.ok).toBe(true);
    if (v1.ok && v2.ok) {
      expect(v1.jti).toBe(v2.jti);
    }
  });

  test('rechaza cambiar la respuesta cuando checked_in es true', async () => {
    familiaDb.estado_confirmacion = 'confirmado';
    familiaDb.boletos_usados = 4;
    familiaDb.checked_in = true;

    const rRechazar = await confirmRequest(false, '10.0.1.3');
    expect(rRechazar.status).toBe(409);
    expect(familiaDb.estado_confirmacion).toBe('confirmado');

    const rConfirmar = await confirmRequest(true, '10.0.1.4');
    expect(rConfirmar.status).toBe(409);
  });

  test('rechaza pasar a rechazado si ya entraron boletos parciales', async () => {
    familiaDb.estado_confirmacion = 'confirmado';
    familiaDb.boletos_usados = 2;
    familiaDb.qr_jti = 'jti-vivo';
    familiaDb.checked_in = false;

    const rRechazar = await confirmRequest(false, '10.0.1.5');
    expect(rRechazar.status).toBe(409);
    expect(familiaDb.estado_confirmacion).toBe('confirmado');
  });
});
