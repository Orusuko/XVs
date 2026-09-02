import { nanoid } from 'nanoid';

/**
 * Single-use nonce carried inside a QR token. Rotating it is what makes a
 * photographed QR useless after the ticket has been used or re-confirmed.
 */
export function newJti(): string {
  return nanoid(24);
}
