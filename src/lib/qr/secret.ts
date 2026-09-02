let cached: Uint8Array | null = null;

export function qrSecret(): Uint8Array {
  if (cached) return cached;

  const secret = process.env.QR_SECRET;
  if (!secret) {
    throw new Error('QR_SECRET is not set. QR tokens cannot be signed or verified.');
  }

  cached = new TextEncoder().encode(secret);
  return cached;
}
