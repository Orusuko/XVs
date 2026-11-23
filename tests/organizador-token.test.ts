import { SignJWT } from 'jose';
import { describe, expect, test } from 'vitest';
import { firmarSesionOrganizador, verificarTokenOrganizador } from '@/lib/organizador-token';

const ID = '6f1b1c1a-1c1a-4c1a-8c1a-1c1a1c1a1c1a';

describe('sesión del organizador', () => {
  test('la cookie firmada devuelve la cuenta y rechaza el PIN de staff', async () => {
    const token = await firmarSesionOrganizador({ id: ID, email: 'ana@x.com' });
    expect(await verificarTokenOrganizador(token)).toEqual({ id: ID, email: 'ana@x.com' });

    const staff = await new SignJWT({ event_id: 'evento', nombre: 'puerta', scope: 'staff' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(ID)
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.QR_SECRET));

    expect(await verificarTokenOrganizador(staff)).toBeNull();
    expect(await verificarTokenOrganizador(`${token}x`)).toBeNull();
  });
});
