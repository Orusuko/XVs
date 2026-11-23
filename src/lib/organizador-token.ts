import { SignJWT, jwtVerify } from 'jose';
import { qrSecret } from '@/lib/qr/secret';

export const ORG_COOKIE = 'xv_org';
export const ORG_MAX_AGE_SEG = 60 * 60 * 24 * 7;

export type OrganizadorSesion = {
  id: string;
  email: string;
};

export function opcionesCookieOrganizador(maxAge = ORG_MAX_AGE_SEG) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export async function firmarSesionOrganizador(sesion: OrganizadorSesion): Promise<string> {
  return new SignJWT({ email: sesion.email, scope: 'organizador' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sesion.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(qrSecret());
}

export async function verificarTokenOrganizador(raw: string): Promise<OrganizadorSesion | null> {
  try {
    const { payload } = await jwtVerify(raw, qrSecret(), { algorithms: ['HS256'] });
    if (payload.scope !== 'organizador' || typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return null;
    }
    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
    };
  } catch {
    return null;
  }
}
