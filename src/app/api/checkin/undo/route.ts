import { NextResponse } from 'next/server';
import { mensajeDeshacerEntrada } from '@/lib/checkin/mensaje-undo';
import { esColumnaFaltante } from '@/lib/boletos-familia';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { requestIp } from '@/lib/request-ip';
import { readStaffSession } from '@/lib/staff-session';
import type { FamilyRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CAMPOS_ANTES_CON = 'qr_jti, boletos_total, boletos_confirmados';
const CAMPOS_ANTES_SIN = 'qr_jti, boletos_total';

type FamiliaAntes = Pick<FamilyRow, 'qr_jti' | 'boletos_total' | 'boletos_confirmados'>;

/**
 * Reverses the count. The printed QR stays valid: partial entry must not
 * burn `qr_jti`, or the family cannot scan the rest of their tickets.
 *
 * Borrador: permitido (corrección); ver `politica-borrador-staff.ts`.
 */
export async function POST(request: Request) {
  const limite = await checkRateLimit(`checkin-undo:${requestIp(request)}`, 30, 60_000);
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos seguidos.' }, { status: 429 });
  }

  let eventId: unknown;
  let familyId: unknown;
  try {
    ({ eventId, familyId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  if (typeof eventId !== 'string' || typeof familyId !== 'string') {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
  }

  const sesion = await readStaffSession(eventId);
  if (!sesion) {
    return NextResponse.json({ error: 'Inicia sesión con tu PIN.' }, { status: 401 });
  }

  const db = supabaseAdmin();

  let { data: antes, error: readError } = await db
    .from('families')
    .select(CAMPOS_ANTES_CON)
    .eq('id', familyId)
    .eq('event_id', eventId)
    .maybeSingle<FamiliaAntes>();

  if (esColumnaFaltante(readError, 'boletos_confirmados')) {
    ({ data: antes, error: readError } = await db
      .from('families')
      .select(CAMPOS_ANTES_SIN)
      .eq('id', familyId)
      .eq('event_id', eventId)
      .maybeSingle<FamiliaAntes>());
  }

  if (readError || !antes) {
    return NextResponse.json({ error: 'Familia no encontrada.' }, { status: 404 });
  }

  const { error } = await db
    .from('families')
    .update({
      boletos_usados: 0,
      checked_in: false,
      checked_in_at: null,
      checked_in_by: null,
    })
    .eq('id', familyId)
    .eq('event_id', eventId);

  if (error) {
    return NextResponse.json({ error: 'No pudimos revertir la entrada.' }, { status: 500 });
  }

  const { data: despues, error: readAfter } = await db
    .from('families')
    .select('qr_jti')
    .eq('id', familyId)
    .eq('event_id', eventId)
    .maybeSingle<Pick<FamilyRow, 'qr_jti'>>();

  if (readAfter || !despues) {
    return NextResponse.json({ error: 'No pudimos revertir la entrada.' }, { status: 500 });
  }

  await db.from('checkin_logs').insert({
    event_id: eventId,
    family_id: familyId,
    scanned_by: sesion.nombre,
    resultado: 'revertido',
  });

  const { mismoQr, mensaje } = mensajeDeshacerEntrada({
    boletos_total: antes.boletos_total,
    boletos_confirmados: antes.boletos_confirmados,
    qr_jti: despues.qr_jti,
  });

  return NextResponse.json({ ok: true, mismoQr, mensaje });
}