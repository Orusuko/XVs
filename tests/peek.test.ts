import { describe, expect, test } from 'vitest';
import { SignJWT } from 'jose';
import { newJti } from '@/lib/qr/jti';
import { signQrToken } from '@/lib/qr/sign';
import { verifyQrToken } from '@/lib/qr/verify';
import { peekQrClaims } from '@/lib/qr/peek';

describe('peekQrClaims', () => {
  test('reads the claims of a genuine token', async () => {
    const token = await signQrToken({ familyId: 'fam-7', eventId: 'ev-7', jti: newJti() });

    expect(peekQrClaims(token)).toEqual({ familyId: 'fam-7', eventId: 'ev-7' });
  });

  test('deliberately does not check the signature, which is why the server must', async () => {
    const forjado = await new SignJWT({ family_id: 'fam-7', event_id: 'ev-7' })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti('inventado')
      .sign(new TextEncoder().encode('secreto-que-no-es-el-nuestro'));

    expect(peekQrClaims(forjado)).toEqual({ familyId: 'fam-7', eventId: 'ev-7' });
    expect(await verifyQrToken(forjado)).toEqual({ ok: false, reason: 'invalid_signature' });
  });

  test('returns null for anything that is not a token', () => {
    expect(peekQrClaims('hola')).toBeNull();
    expect(peekQrClaims('a.b.c')).toBeNull();
  });
});

describe('rotating the nonce', () => {
  test('re-confirming produces a token whose jti no longer matches the old one', async () => {
    const jtiViejo = newJti();
    const tokenViejo = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: jtiViejo });

    const jtiNuevo = newJti();
    const tokenNuevo = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti: jtiNuevo });

    const viejo = await verifyQrToken(tokenViejo);
    const nuevo = await verifyQrToken(tokenNuevo);

    // Both are correctly signed; only the stored jti decides which one gets in.
    expect(viejo.ok && nuevo.ok).toBe(true);
    expect(viejo.ok && viejo.jti).not.toBe(nuevo.ok && nuevo.jti);
    expect(viejo.ok && viejo.jti === jtiNuevo).toBe(false);
  });
});
