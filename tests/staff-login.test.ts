import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          returns: async () => ({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

const { POST } = await import('@/app/api/staff/login/route');

describe('POST /api/staff/login', () => {
  test('rechaza PIN corto con mensaje de 6-8 dígitos', async () => {
    const res = await POST(
      new Request('http://localhost/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: 'ev-1', pin: '1234' }),
      }),
    );
    const datos = await res.json();
    expect(res.status).toBe(400);
    expect(datos.error).toMatch(/6 y 8 dígitos/i);
  });
});