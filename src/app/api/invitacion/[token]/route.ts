import { NextResponse } from 'next/server';
import { loadInvitation } from '@/lib/invitation';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const limite = await checkRateLimit(`invitacion:${requestIp(request)}`, 60, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  const invitacion = await loadInvitation(token);

  if (!invitacion) {
    return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 });
  }

  return NextResponse.json(invitacion, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
