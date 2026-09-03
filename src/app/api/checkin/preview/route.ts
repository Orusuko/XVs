import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { verificarQr } from '@/lib/checkin/verificar-qr';
import { readStaffSession } from '@/lib/staff-session';

export const dynamic = 'force-dynamic';

type ResultadoPreview = 'listo' | 'duplicado' | 'invalido' | 'jti_expirado';

type Respuesta = {
  resultado: ResultadoPreview;
  familia?: string;
  boletos?: number;
  checkedInAt?: string | null;
  mensaje: string;
};

/**
 * Shows the door staff what they are about to register — it never writes
 * `checked_in`. Only a bad or reused code is worth an audit row here; a
 * `listo` or `duplicado` verdict only becomes a log entry once staff presses
 * Adelante and hits /api/checkin.
 */
export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin-preview:${requestIp(request)}`, 120, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados escaneos seguidos.' }, { status: 429 });
  }

  let qr: unknown;
  let eventId: unknown;
  try {
    ({ qr, eventId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof qr !== 'string' || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  const verificado = await verificarQr(qr, eventId);

  if (verificado.resultado === 'invalido' || verificado.resultado === 'jti_expirado') {
    await supabaseAdmin()
      .from('checkin_logs')
      .insert({
        event_id: eventId,
        family_id: verificado.resultado === 'jti_expirado' ? verificado.familia.id : null,
        scanned_by: sesion.nombre,
        resultado: verificado.resultado,
      });

    return NextResponse.json<Respuesta>({
      resultado: verificado.resultado,
      familia: verificado.resultado === 'jti_expirado' ? verificado.familia.nombre_familia : undefined,
      mensaje: verificado.mensaje,
    });
  }

  if (verificado.resultado === 'ya_ingresado') {
    return NextResponse.json<Respuesta>({
      resultado: 'duplicado',
      familia: verificado.familia.nombre_familia,
      boletos: verificado.familia.boletos_total,
      checkedInAt: verificado.familia.checked_in_at,
      mensaje: verificado.mensaje,
    });
  }

  return NextResponse.json<Respuesta>({
    resultado: 'listo',
    familia: verificado.familia.nombre_familia,
    boletos: verificado.familia.boletos_total,
    mensaje: 'Listo para registrar.',
  });
}
