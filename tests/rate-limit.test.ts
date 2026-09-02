import { beforeEach, describe, expect, test } from 'vitest';
import { checkRateLimit, resetRateLimitStore } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  test('allows exactly the configured number of calls, then blocks', async () => {
    const key = 'ip:203.0.113.1';

    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await checkRateLimit(key, 3, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3 - attempt);
    }

    const blocked = await checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test('each key gets its own budget', async () => {
    await checkRateLimit('ip:a', 1, 60_000);
    const otherKey = await checkRateLimit('ip:b', 1, 60_000);

    expect(otherKey.allowed).toBe(true);
  });

  test('the budget refills once the window has passed', async () => {
    const key = 'ip:203.0.113.9';
    await checkRateLimit(key, 1, 10);
    expect((await checkRateLimit(key, 1, 10)).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect((await checkRateLimit(key, 1, 10)).allowed).toBe(true);
  });
});
