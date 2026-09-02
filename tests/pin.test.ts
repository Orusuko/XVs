import { describe, expect, test } from 'vitest';
import { hashPin, verifyPin } from '@/lib/pin';

describe('staff PIN', () => {
  test('the hash is never the PIN itself', async () => {
    const hash = await hashPin('4821');

    expect(hash).not.toContain('4821');
    expect(hash.startsWith('$2')).toBe(true);
  });

  test('accepts the correct PIN', async () => {
    const hash = await hashPin('4821');

    expect(await verifyPin('4821', hash)).toBe(true);
  });

  test('rejects a wrong PIN', async () => {
    const hash = await hashPin('4821');

    expect(await verifyPin('4822', hash)).toBe(false);
  });

  test('hashing the same PIN twice gives different hashes', async () => {
    expect(await hashPin('4821')).not.toBe(await hashPin('4821'));
  });
});
