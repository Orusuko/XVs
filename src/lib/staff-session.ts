import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { qrSecret } from '@/lib/qr/secret';

export const STAFF_COOKIE = 'xv_staff';

export type StaffSession = {
  eventId: string;
  nombre: string;
};

export async function createStaffSession(session: StaffSession): Promise<string> {
  return new SignJWT({ event_id: session.eventId, nombre: session.nombre, scope: 'staff' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('18h')
    .sign(qrSecret());
}

export async function readStaffSession(eventId: string): Promise<StaffSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(STAFF_COOKIE)?.value;
  if (!raw) return null;

  try {
    const { payload } = await jwtVerify(raw, qrSecret(), { algorithms: ['HS256'] });

    if (payload.scope !== 'staff' || payload.event_id !== eventId) return null;

    return {
      eventId: payload.event_id as string,
      nombre: (payload.nombre as string) ?? 'staff',
    };
  } catch {
    return null;
  }
}
