import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { ERROR_CHECKIN_EVENTO_NO_PUBLICADO } from '@/lib/invitacion-publica';
import { signQrToken } from '@/lib/qr/sign';

let estadoEvento = 'publicado';

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
              maybeSingle: async () => ({ data: { estado: estadoEvento }, error: null }),
            }),
          }),
        };
      }
      if (tabla === 'checkin_logs') {
        return { insert: async () => ({ error: null }) };
      }
      if (tabla === 'families') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: 'fam-1',
                  nombre_familia: 'López',
                  boletos_total: 2,
                  boletos_usados: 0,
                  qr_jti: 'jti-1',
                  checked_in: false,
                  checked_in_at: null,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

const { POST: checkinPost } = await import('@/app/api/checkin/route');
const { POST: manualPost } = await import('@/app/api/checkin/manual/route');
const { POST: previewPost } = await import('@/app/api/checkin/preview/route');

vi.mock('@/lib/supabase/families-query', () => ({
  consultarFamiliasEvento: async () => ({ data: [], error: null }),
}));

const { GET: estadoGet } = await import('@/app/api/staff/estado/route');

describe('check-in con evento en borrador', () => {
  beforeEach(() => {
    resetRateLimitStore();
    estadoEvento = 'borrador';
  });

  test('POST /api/checkin responde 403 con mensaje claro', async () => {
    const qr = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: 'jti-1' });
    const respuesta = await checkinPost(
      new Request('http://localhost/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.3.1' },
        body: JSON.stringify({ qr, eventId: 'ev-1' }),
      }),
    );
    expect(respuesta.status).toBe(403);
    const datos = await respuesta.json();
    expect(datos.error).toBe(ERROR_CHECKIN_EVENTO_NO_PUBLICADO);
  });

  test('POST /api/checkin/manual responde 403', async () => {
    const respuesta = await manualPost(
      new Request('http://localhost/api/checkin/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.3.2' },
        body: JSON.stringify({ eventId: 'ev-1', familyId: 'fam-1' }),
      }),
    );
    expect(respuesta.status).toBe(403);
  });

  test('GET /api/staff/estado sigue disponible en borrador', async () => {
    const respuesta = await estadoGet(
      new Request('http://localhost/api/staff/estado?eventId=ev-1'),
    );
    expect(respuesta.status).toBe(200);
  });

  test('POST /api/checkin/preview responde 403', async () => {
    const qr = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: 'jti-1' });
    const respuesta = await previewPost(
      new Request('http://localhost/api/checkin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.3.3' },
        body: JSON.stringify({ qr, eventId: 'ev-1' }),
      }),
    );
    expect(respuesta.status).toBe(403);
  });
});