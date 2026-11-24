import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';

const estado = {
  qr_jti: 'jti-vivo' as string | null,
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
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { qr_jti: estado.qr_jti }, error: null }),
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
          }),
        }),
      };
    },
  }),
}));

const { POST } = await import('@/app/api/checkin/undo/route');

function undoRequest() {
  return POST(
    new Request('http://localhost/api/checkin/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.4.1' },
      body: JSON.stringify({ eventId: 'ev-1', familyId: 'fam-1' }),
    }),
  );
}

describe('POST /api/checkin/undo', () => {
  beforeEach(() => {
    resetRateLimitStore();
    estado.qr_jti = 'jti-vivo';
  });

  test('mismoQr true cuando el nonce sigue vivo (entrada parcial deshecha)', async () => {
    const respuesta = await undoRequest();
    const datos = await respuesta.json();
    expect(respuesta.status).toBe(200);
    expect(datos.mismoQr).toBe(true);
    expect(datos.mensaje).toMatch(/mismo QR/i);
  });

  test('mismoQr false cuando el nonce ya se consumió (entrada completa)', async () => {
    estado.qr_jti = null;
    const respuesta = await undoRequest();
    const datos = await respuesta.json();
    expect(datos.mismoQr).toBe(false);
    expect(datos.mensaje).toMatch(/abrir su invitación/i);
  });
});