import { limiteBoletosFamilia } from '@/lib/boletos-familia';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyQrToken } from '@/lib/qr/verify';
import type { FamilyRow } from '@/lib/types';

const SELECT_CON_CONFIRMADOS =
  'id, nombre_familia, boletos_total, boletos_confirmados, boletos_usados, qr_jti, checked_in, checked_in_at';
const SELECT_SIN_CONFIRMADOS =
  'id, nombre_familia, boletos_total, boletos_usados, qr_jti, checked_in, checked_in_at';

export type FamiliaVerificada = Pick<
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

export type VerificacionQr =
  | { resultado: 'error'; mensaje: string }
  | { resultado: 'invalido'; mensaje: string }
  | { resultado: 'jti_expirado'; mensaje: string; familia: FamiliaVerificada }
  | { resultado: 'ya_ingresado'; mensaje: string; familia: FamiliaVerificada }
  | { resultado: 'listo'; familia: FamiliaVerificada; jti: string };

/**
 * The three checks shared by preview and confirm: signature, event match,
 * family exists, and the `jti` is still the live one. Whether tickets remain
 * is read here for display, and the confirm route re-checks and updates
 * atomically — a stale read here must never let two doors count past total.
 */
export async function verificarQr(qr: string, eventId: string): Promise<VerificacionQr> {
  const verificado = await verifyQrToken(qr);
  if (!verificado.ok || verificado.eventId !== eventId) {
    return { resultado: 'invalido', mensaje: 'Este código no es válido para este evento.' };
  }

  const db = supabaseAdmin();
  let { data: familia, error } = await db
    .from('families')
    .select(SELECT_CON_CONFIRMADOS)
    .eq('id', verificado.familyId)
    .maybeSingle<FamiliaVerificada>();

  if (error?.code === '42703' && error.message?.includes('boletos_confirmados')) {
    ({ data: familia, error } = await db
      .from('families')
      .select(SELECT_SIN_CONFIRMADOS)
      .eq('id', verificado.familyId)
      .maybeSingle<FamiliaVerificada>());
  }

  if (error) {
    console.error('verificarQr.select', error.code, error.message);
    return { resultado: 'error', mensaje: 'No pudimos consultar el boleto. Intenta de nuevo.' };
  }

  if (!familia) {
    return { resultado: 'invalido', mensaje: 'Esta familia ya no está en la lista.' };
  }

  const usados = familia.boletos_usados ?? 0;
  const tope = limiteBoletosFamilia(familia);

  if (familia.checked_in || usados >= tope) {
    return { resultado: 'ya_ingresado', familia, mensaje: 'Este boleto ya fue registrado.' };
  }

  if (!familia.qr_jti || familia.qr_jti !== verificado.jti) {
    return {
      resultado: 'jti_expirado',
      familia,
      mensaje: 'Este código ya fue reemplazado. Pide a la familia que abra su invitación de nuevo.',
    };
  }

  return { resultado: 'listo', familia: { ...familia, boletos_usados: usados }, jti: verificado.jti };
}
