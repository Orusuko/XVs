import { NextResponse } from 'next/server';
import { STAFF_COOKIE } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(STAFF_COOKIE, '', { path: '/', maxAge: 0 });
  return respuesta;
}
