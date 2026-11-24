import { NextResponse } from 'next/server';
import { ERROR_INVITACION_NO_PUBLICADA } from '@/lib/invitacion-publica';
import { cargarInvitacion } from '@/lib/invitation';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const limite = await checkRateLimit(`invitacion:${requestIp(request)}`, 60, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  const resultado = await cargarInvitacion(token);

  if (resultado.tipo === 'indisponible') {
    return NextResponse.json(
      { error: 'Invitación temporalmente no disponible.' },
      { status: 503 },
    );
  }

  if (resultado.tipo === 'no_publicado') {
    return NextResponse.json({ error: ERROR_INVITACION_NO_PUBLICADA }, { status: 403 });
  }

  if (resultado.tipo !== 'ok') {
    return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 });
  }

  return NextResponse.json(resultado.vista, {
    headers: { 'Cache-Control': 'no-store' },
  });
}