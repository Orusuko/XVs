import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyQrToken } from '@/lib/qr/verify';
import type { FamilyRow } from '@/lib/types';

export type FamiliaVerificada = Pick<
  FamilyRow,
  'id' | 'nombre_familia' | 'boletos_total' | 'qr_jti' | 'checked_in' | 'checked_in_at'
>;

export type VerificacionQr =
  | { resultado: 'invalido'; mensaje: string }
  | { resultado: 'jti_expirado'; mensaje: string; familia: FamiliaVerificada }
  | { resultado: 'ya_ingresado'; mensaje: string; familia: FamiliaVerificada }
  | { resultado: 'listo'; familia: FamiliaVerificada };

/**
 * The three checks shared by preview and confirm: signature, event match,
 * family exists, and the `jti` is still the live one. Whether the ticket is
 * already checked in is read here for display, but the confirm route re-checks
 * it atomically — a stale read here must never be the thing that lets two
 * doors both win.
 */
export async function verificarQr(qr: string, eventId: string): Promise<VerificacionQr> {
  const verificado = await verifyQrToken(qr);
  if (!verificado.ok || verificado.eventId !== eventId) {
    return { resultado: 'invalido', mensaje: 'Este código no es válido para este evento.' };
  }

  const db = supabaseAdmin();
  const { data: familia } = await db
    .from('families')
    .select('id, nombre_familia, boletos_total, qr_jti, checked_in, checked_in_at')
    .eq('id', verificado.familyId)
    .maybeSingle<FamiliaVerificada>();

  if (!familia) {
    return { resultado: 'invalido', mensaje: 'Esta familia ya no está en la lista.' };
  }

  if (!familia.qr_jti || familia.qr_jti !== verificado.jti) {
    return {
      resultado: 'jti_expirado',
      familia,
      mensaje: 'Este código ya fue reemplazado. Pide a la familia que abra su invitación de nuevo.',
    };
  }

  if (familia.checked_in) {
    return { resultado: 'ya_ingresado', familia, mensaje: 'Este boleto ya fue registrado.' };
  }

  return { resultado: 'listo', familia };
}
