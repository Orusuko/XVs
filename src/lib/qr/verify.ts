import { jwtVerify } from 'jose';
import { qrSecret } from './secret';

export type QrVerifyResult =
  | { ok: true; familyId: string; eventId: string; jti: string }
  | { ok: false; reason: 'invalid_signature' | 'malformed' };

/**
 * Checks the signature only. Whether the `jti` is still the live one, and
 * whether the family has already checked in, are database questions answered
 * by the check-in handler.
 */
export async function verifyQrToken(token: string): Promise<QrVerifyResult> {
  let claims;
  try {
    ({ payload: claims } = await jwtVerify(token, qrSecret(), { algorithms: ['HS256'] }));
  } catch {
    return { ok: false, reason: 'invalid_signature' };
  }

  const familyId = claims.family_id;
  const eventId = claims.event_id;
  const jti = claims.jti;

  if (typeof familyId !== 'string' || typeof eventId !== 'string' || typeof jti !== 'string') {
    return { ok: false, reason: 'malformed' };
  }

  return { ok: true, familyId, eventId, jti };
}
