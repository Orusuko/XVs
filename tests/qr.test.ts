import { describe, expect, test } from 'vitest';
import { SignJWT } from 'jose';
import { newJti } from '@/lib/qr/jti';
import { signQrToken } from '@/lib/qr/sign';
import { verifyQrToken } from '@/lib/qr/verify';

describe('QR token', () => {
  test('a signed token round-trips back to its claims', async () => {
    const jti = newJti();
    const token = await signQrToken({ familyId: 'fam-1', eventId: 'ev-1', jti });

    expect(await verifyQrToken(token)).toEqual({
      ok: true,
      familyId: 'fam-1',
      eventId: 'ev-1',
      jti,
    });
  });

  test('a token signed with another secret is rejected', async () => {
    const forged = await new SignJWT({ family_id: 'fam-1', event_id: 'ev-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti('forged-jti')
      .setIssuedAt()
      .sign(new TextEncoder().encode('a-completely-different-secret'));

    expect(await verifyQrToken(forged)).toEqual({
      ok: false,
      reason: 'invalid_signature',
    });
  });

  test('garbage input is rejected without throwing', async () => {
    expect(await verifyQrToken('not-a-jwt')).toEqual({
      ok: false,
      reason: 'invalid_signature',
    });
  });

  test('a token missing the family claim is malformed', async () => {
    const secret = new TextEncoder().encode(process.env.QR_SECRET);
    const incomplete = await new SignJWT({ event_id: 'ev-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti('some-jti')
      .setIssuedAt()
      .sign(secret);

    expect(await verifyQrToken(incomplete)).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  test('every jti is unique', () => {
    const jtis = new Set(Array.from({ length: 500 }, () => newJti()));
    expect(jtis.size).toBe(500);
  });
});
