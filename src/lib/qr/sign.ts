import { SignJWT } from 'jose';
import { qrSecret } from './secret';

export type QrPayload = {
  familyId: string;
  eventId: string;
  jti: string;
};

export async function signQrToken({ familyId, eventId, jti }: QrPayload): Promise<string> {
  return new SignJWT({ family_id: familyId, event_id: eventId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setJti(jti)
    .setIssuedAt()
    .sign(qrSecret());
}
