import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetRateLimitStore } from '@/lib/rate-limit';

const insertMock = vi.fn();
const listUsersMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    auth: {
      admin: {
        listUsers: listUsersMock,
      },
    },
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        insertMock(row);
        return {
          select: () => ({
            single: async () => ({
              data: { id: (row.id as string | undefined) ?? 'new-generated-uuid' },
              error: null,
            }),
          }),
        };
      },
    }),
  }),
}));

const { POST } = await import('@/app/api/cuenta/route');

describe('POST /api/cuenta', () => {
  beforeEach(() => {
    resetRateLimitStore();
    insertMock.mockClear();
    listUsersMock.mockReset();
  });

  test('si auth.users ya tiene ese correo, inserta la cuenta con ese mismo id', async () => {
    listUsersMock.mockResolvedValue({
      data: { users: [{ id: 'old-auth-user-uuid', email: 'Organizador@Ejemplo.com' }] },
      error: null,
    });

    const res = await POST(
      new Request('http://localhost/api/cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
        body: JSON.stringify({
          accion: 'crear',
          email: 'organizador@ejemplo.com',
          password: 'clave-segura-123',
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0]![0]).toMatchObject({
      id: 'old-auth-user-uuid',
      email: 'organizador@ejemplo.com',
    });
  });

  test('si el correo es nuevo, inserta sin id para generar uno nuevo', async () => {
    listUsersMock.mockResolvedValue({
      data: { users: [{ id: 'otro-id', email: 'alguien-mas@ejemplo.com' }] },
      error: null,
    });

    const res = await POST(
      new Request('http://localhost/api/cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
        body: JSON.stringify({
          accion: 'crear',
          email: 'nuevo@ejemplo.com',
          password: 'clave-segura-123',
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0]![0]).not.toHaveProperty('id');
    expect(insertMock.mock.calls[0]![0]).toMatchObject({
      email: 'nuevo@ejemplo.com',
    });
  });
});
