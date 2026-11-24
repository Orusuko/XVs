import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { esColumnaFaltante, limiteBoletosFamilia } from '@/lib/boletos-familia';
import { camposEntrada } from '@/lib/checkin/entrada';
import { bloqueoCheckinSiEventoNoPublico } from '@/lib/invitacion-evento';
import { readStaffSession } from '@/lib/staff-session';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

const SELECT_CON_CONFIRMADOS =
  'id, nombre_familia, boletos_total, boletos_confirmados, boletos_usados, checked_in, checked_in_at, estado_confirmacion';
const SELECT_SIN_CONFIRMADOS =
  'id, nombre_familia, boletos_total, boletos_usados, checked_in, checked_in_at, estado_confirmacion';

type FamiliaManual = Pick<
  FamilyRow,
  | 'id'
  | 'nombre_familia'
  | 'boletos_total'
  | 'boletos_confirmados'
  | 'boletos_usados'
  | 'checked_in'
  | 'checked_in_at'
  | 'estado_confirmacion'
>;

/** Fallback for a dead camera or an unreadable screen. */
export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin-manual:${requestIp(request)}`, 60, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados escaneos seguidos.' }, { status: 429 });
  }

  let eventId: unknown;
  let familyId: unknown;
  let cantidad: unknown;
  try {
    ({ eventId, familyId, cantidad } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof eventId !== 'string' || typeof familyId !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (cantidad !== undefined && (!Number.isInteger(cantidad) || (cantidad as number) < 1)) {
    return NextResponse.json({ error: 'Indica cuántos boletos entran.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  const db = supabaseAdmin();

  const bloqueo = await bloqueoCheckinSiEventoNoPublico(db, eventId);
  if (bloqueo) {
    return NextResponse.json({ error: bloqueo.error }, { status: bloqueo.status });
  }

  let { data: familiaInicial, error: readError } = await db
    .from('families')
    .select(SELECT_CON_CONFIRMADOS)
    .eq('id', familyId)
    .eq('event_id', eventId)
    .maybeSingle<FamiliaManual>();

  if (esColumnaFaltante(readError, 'boletos_confirmados')) {
    ({ data: familiaInicial, error: readError } = await db
      .from('families')
      .select(SELECT_SIN_CONFIRMADOS)
      .eq('id', familyId)
      .eq('event_id', eventId)
      .maybeSingle<FamiliaManual>());
  }

  if (readError) {
    console.error('checkin-manual.select', readError.code, readError.message);
    return NextResponse.json(
      { error: 'Error al consultar la familia. Intenta de nuevo.' },
      { status: 500 },
    );
  }

  if (!familiaInicial) {
    return NextResponse.json({ error: 'Familia no encontrada.' }, { status: 404 });
  }

  let familia = familiaInicial;
  const topeInicial = limiteBoletosFamilia(familia);
  let entran = typeof cantidad === 'number' ? cantidad : topeInicial - (familia.boletos_usados ?? 0);

  for (let intento = 0; intento < 2; intento += 1) {
    if (familia.checked_in) {
      await db.from('checkin_logs').insert({
        event_id: eventId,
        family_id: familyId,
        scanned_by: sesion.nombre,
        resultado: 'duplicado',
      });

      return NextResponse.json({
        resultado: 'duplicado',
        mensaje: 'Esta familia ya había entrado.',
      });
    }

    if (familia.estado_confirmacion !== 'confirmado') {
      await db.from('checkin_logs').insert({
        event_id: eventId,
        family_id: familyId,
        scanned_by: sesion.nombre,
        resultado: 'invalido',
      });

      return NextResponse.json({ error: 'Esa familia no ha confirmado.' }, { status: 409 });
    }

    const usados = familia.boletos_usados ?? 0;
    const tope = limiteBoletosFamilia(familia);
    const restantes = tope - usados;

    if (restantes <= 0) {
      await db.from('checkin_logs').insert({
        event_id: eventId,
        family_id: familyId,
        scanned_by: sesion.nombre,
        resultado: 'duplicado',
      });

      return NextResponse.json({
        resultado: 'duplicado',
        mensaje: 'Esta familia ya había entrado.',
      });
    }

    if (entran > restantes) {
      return NextResponse.json(
        {
          error: `Solo ${restantes === 1 ? 'queda 1 boleto' : `quedan ${restantes} boletos`} por entrar.`,
        },
        { status: 409 },
      );
    }

    const { data: actualizadas, error: updateError } = await db
      .from('families')
      .update(camposEntrada(sesion.nombre, 'manual', usados, entran, tope))
      .eq('id', familyId)
      .eq('event_id', eventId)
      .eq('checked_in', false)
      .eq('estado_confirmacion', 'confirmado')
      .eq('boletos_usados', usados)
      .lte('boletos_usados', tope - entran)
      .select('id, nombre_familia, boletos_total, boletos_usados, checked_in_at')
      .returns<
        Pick<
          FamilyRow,
          'id' | 'nombre_familia' | 'boletos_total' | 'boletos_usados' | 'checked_in_at'
        >[]
      >();

    if (updateError) {
      console.error('checkin-manual.update', updateError.code, updateError.message);
      return NextResponse.json(
        { error: 'Error al registrar el acceso. Intenta de nuevo.' },
        { status: 500 },
      );
    }

    if (actualizadas && actualizadas.length > 0) {
      await db.from('checkin_logs').insert({
        event_id: eventId,
        family_id: familyId,
        scanned_by: `${sesion.nombre} (manual)`,
        resultado: 'exitoso',
      });

      const reg = actualizadas[0]!;
      return NextResponse.json({
        resultado: 'exitoso',
        familia: reg.nombre_familia,
        boletos: entran,
        boletosUsados: reg.boletos_usados,
        boletosTotal: reg.boletos_total,
        mensaje:
          reg.boletos_usados < limiteBoletosFamilia({ ...familia, ...reg })
            ? `Registrados ${entran} boletos (${reg.boletos_usados} de ${limiteBoletosFamilia({ ...familia, ...reg })}).`
            : 'Acceso registrado a mano.',
      });
    }

    let { data: relectura, error: rereadError } = await db
      .from('families')
      .select(SELECT_CON_CONFIRMADOS)
      .eq('id', familyId)
      .eq('event_id', eventId)
      .maybeSingle<FamiliaManual>();

    if (esColumnaFaltante(rereadError, 'boletos_confirmados')) {
      ({ data: relectura, error: rereadError } = await db
        .from('families')
        .select(SELECT_SIN_CONFIRMADOS)
        .eq('id', familyId)
        .eq('event_id', eventId)
        .maybeSingle<FamiliaManual>());
    }

    if (rereadError) {
      console.error('checkin-manual.reselect', rereadError.code, rereadError.message);
      return NextResponse.json(
        { error: 'Error al verificar la familia. Intenta de nuevo.' },
        { status: 500 },
      );
    }

    if (!relectura) {
      return NextResponse.json({ error: 'Familia no encontrada.' }, { status: 404 });
    }

    familia = relectura;
    if (typeof cantidad !== 'number') {
      entran = limiteBoletosFamilia(familia) - (familia.boletos_usados ?? 0);
    }
  }

  return NextResponse.json(
    { error: 'Otro acceso se registró al mismo tiempo. Intenta de nuevo.' },
    { status: 409 },
  );
}
