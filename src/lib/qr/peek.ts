/**
 * Reads the claims of a QR token WITHOUT checking the signature.
 *
 * The HMAC secret lives on the server and must stay there, so an offline
 * scanner cannot prove a code is genuine. This is used only to put a family
 * name on screen while there is no signal; the real verdict comes from
 * /api/checkin once the queue syncs.
 */
export function peekQrClaims(token: string): { familyId: string; eventId: string } | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;

  try {
    const json = atob(partes[1]!.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { family_id?: unknown; event_id?: unknown };

    if (typeof claims.family_id !== 'string' || typeof claims.event_id !== 'string') return null;

    return { familyId: claims.family_id, eventId: claims.event_id };
  } catch {
    return null;
  }
}
