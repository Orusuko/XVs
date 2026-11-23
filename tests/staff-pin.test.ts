import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/organizador', () => ({
  organizadorActual: async () => ({
    sesion: { id: 'admin-1', email: 'org@ejemplo.com' },
    db: {
      from: (tabla: string) => {
        if (tabla === 'events') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: 'ev-1' }, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          insert: async () => ({ error: null }),
        };
      },
    },
  }),
}));

const { POST } = await import('@/app/api/staff/pin/route');

describe('POST /api/staff/pin', () => {
  test('rechaza PINs de 4 o 5 dígitos', async () => {
    for (const pin of ['1234', '12345']) {
      const res = await POST(
        new Request('http://localhost/api/staff/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: 'ev-1', nombre: 'Puerta 1', pin }),
        }),
      );
      expect(res.status).toBe(400);
    }
  });

  test('acepta PIN de 6 dígitos', async () => {
    const res = await POST(
      new Request('http://localhost/api/staff/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: 'ev-1', nombre: 'Puerta 1', pin: '123456' }),
      }),
    );
    expect(res.status).toBe(201);
  });
});
