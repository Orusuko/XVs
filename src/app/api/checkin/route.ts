import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { limiteBoletosFamilia } from '@/lib/boletos-familia';
import { camposEntrada } from '@/lib/checkin/entrada';
import { verificarQr } from '@/lib/checkin/verificar-qr';
import { bloqueoCheckinSiEventoNoPublico } from '@/lib/invitacion-evento';
import { readStaffSession } from '@/lib/staff-session';
import type { CheckinResultado, FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Respuesta = {
  resultado: CheckinResultado;
  familia?: string;
  boletos?: number;
  boletosTotal?: number;
  boletosUsados?: number;
  boletosRestantes?: number;
  checkedInAt?: string | null;
  mensaje: string;
};

type FamiliaActual = Pick<
  FamilyRow,
  | 'id'
  | 'nombre_familia'
  | 'boletos_total'
  | 'boletos_confirmados'
  | 'boletos_usados'
  | 'qr_jti'
  | 'checked_in'
  | 'checked_in_at'
>;

async function registrar(
  eventId: string | null,
  familyId: string | null,
  scannedBy: string,
  resultado: CheckinResultado,
) {
  await supabaseAdmin().from('checkin_logs').insert({
    event_id: eventId,
    family_id: familyId,
    scanned_by: scannedBy,
    resultado,
  });
}

export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin:${requestIp(request)}`, 120, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados escaneos seguidos.' }, { status: 429 });
  }

  let qr: unknown;
  let eventId: unknown;
  let cantidad: unknown;
  try {
    ({ qr, eventId, cantidad } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof qr !== 'string' || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (cantidad !== undefined && (!Number.isInteger(cantidad) || (cantidad as number) < 1)) {
    return NextResponse.json({ error: 'Indica cuántos boletos entran.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  const dbCheck = supabaseAdmin();
  const bloqueo = await bloqueoCheckinSiEventoNoPublico(dbCheck, eventId);
  if (bloqueo) {
    return NextResponse.json({ error: bloqueo.error }, { status: bloqueo.status });
  }

  const verificado = await verificarQr(qr, eventId);

  if (verificado.resultado === 'error') {
    return NextResponse.json({ error: verificado.mensaje }, { status: 500 });
  }

  if (verificado.resultado === 'invalido' || verificado.resultado === 'jti_expirado') {
    const familyId = verificado.resultado === 'jti_expirado' ? verificado.familia.id : null;
    await registrar(eventId, familyId, sesion.nombre, verificado.resultado);
    return NextResponse.json<Respuesta>({
      resultado: verificado.resultado,
      familia: verificado.resultado === 'jti_expirado' ? verificado.familia.nombre_familia : undefined,
      mensaje: verificado.mensaje,
    });
  }

  if (verificado.resultado === 'ya_ingresado') {
    await registrar(eventId, verificado.familia.id, sesion.nombre, 'duplicado');
    return NextResponse.json<Respuesta>({
      resultado: 'duplicado',
      familia: verificado.familia.nombre_familia,
      boletos: verificado.familia.boletos_total,
      boletosTotal: verificado.familia.boletos_total,
      boletosUsados: verificado.familia.boletos_usados,
      boletosRestantes: 0,
      checkedInAt: verificado.familia.checked_in_at,
      mensaje: verificado.mensaje,
    });
  }

  const db = supabaseAdmin();
  const jti = verificado.jti;
  let actual = verificado.familia;
  const topeActual = limiteBoletosFamilia(actual);
  let entran = typeof cantidad === 'number' ? cantidad : topeActual - actual.boletos_usados;

  for (let intento = 0; intento < 2; intento += 1) {
    const tope = limiteBoletosFamilia(actual);
    const restantes = tope - actual.boletos_usados;
    if (restantes <= 0) {
      await registrar(eventId, actual.id, sesion.nombre, 'duplicado');
      return NextResponse.json<Respuesta>({
        resultado: 'duplicado',
        familia: actual.nombre_familia,
        boletos: actual.boletos_total,
        boletosTotal: actual.boletos_total,
        boletosUsados: actual.boletos_usados,
        boletosRestantes: 0,
        checkedInAt: actual.checked_in_at,
        mensaje: 'Este boleto ya fue registrado.',
      });
    }

    if (entran > restantes) {
      return NextResponse.json(
        {
          error: `Solo ${restantes === 1 ? 'queda 1 boleto' : `quedan ${restantes} boletos`} por entrar.`,
          boletosRestantes: restantes,
        },
        { status: 409 },
      );
    }

    const { data: actualizadas, error: updateError } = await db
      .from('families')
      .update(camposEntrada(sesion.nombre, 'escaner', actual.boletos_usados, entran, tope))
      .eq('id', actual.id)
      .eq('qr_jti', jti)
      .eq('checked_in', false)
      .eq('boletos_usados', actual.boletos_usados)
      .lte('boletos_usados', tope - entran)
      .select('id, nombre_familia, boletos_total, boletos_usados, checked_in, checked_in_at');

    if (updateError) {
      console.error('checkin.update', updateError.code, updateError.message);
      return NextResponse.json(
        { error: 'Error al registrar el acceso. Intenta de nuevo.' },
        { status: 500 },
      );
    }

    if (actualizadas && actualizadas.length > 0) {
      const registrada = actualizadas[0]!;
      await registrar(eventId, actual.id, sesion.nombre, 'exitoso');
      const usadosDespues = registrada.boletos_usados ?? actual.boletos_usados + entran;
      return NextResponse.json<Respuesta>({
        resultado: 'exitoso',
        familia: registrada.nombre_familia,
        boletos: entran,
        boletosTotal: registrada.boletos_total,
        boletosUsados: usadosDespues,
        boletosRestantes: Math.max(
          0,
          limiteBoletosFamilia({ ...registrada, boletos_confirmados: actual.boletos_confirmados }) -
            usadosDespues,
        ),
        checkedInAt: registrada.checked_in_at,
        mensaje: 'Acceso registrado.',
      });
    }

    const { data: relectura, error: readError } = await db
      .from('families')
      .select(
        'id, nombre_familia, boletos_total, boletos_confirmados, boletos_usados, qr_jti, checked_in, checked_in_at',
      )
      .eq('id', actual.id)
      .maybeSingle<FamiliaActual>();

    if (readError) {
      console.error('checkin.reselect', readError.code, readError.message);
      return NextResponse.json(
        { error: 'Error al verificar el boleto. Intenta de nuevo.' },
        { status: 500 },
      );
    }

    if (!relectura) {
      await registrar(eventId, actual.id, sesion.nombre, 'invalido');
      return NextResponse.json<Respuesta>({
        resultado: 'invalido',
        mensaje: 'Esta familia ya no está en la lista.',
      });
    }

    if (relectura.checked_in) {
      await registrar(eventId, actual.id, sesion.nombre, 'duplicado');
      return NextResponse.json<Respuesta>({
        resultado: 'duplicado',
        familia: relectura.nombre_familia,
        boletos: relectura.boletos_total,
        boletosTotal: relectura.boletos_total,
        boletosUsados: relectura.boletos_usados,
        boletosRestantes: 0,
        checkedInAt: relectura.checked_in_at,
        mensaje: 'Este boleto ya fue registrado.',
      });
    }

    if (!relectura.qr_jti || relectura.qr_jti !== jti) {
      await registrar(eventId, actual.id, sesion.nombre, 'jti_expirado');
      return NextResponse.json<Respuesta>({
        resultado: 'jti_expirado',
        familia: relectura.nombre_familia,
        mensaje: 'Este código ya fue reemplazado. Pide a la familia que abra su invitación de nuevo.',
      });
    }

    actual = relectura;
    if (typeof cantidad !== 'number') {
      entran = limiteBoletosFamilia(actual) - actual.boletos_usados;
    }
  }

  return NextResponse.json(
    { error: 'Otro acceso se registró al mismo tiempo. Intenta de nuevo.' },
    { status: 409 },
  );
}
