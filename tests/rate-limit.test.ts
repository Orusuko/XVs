import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { checkRateLimit, resetRateLimitStore } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
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

  test('usa Upstash cuando hay env vars y no afloja el tope si Upstash falla', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-test';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    expect((await checkRateLimit('ip:fallback', 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit('ip:fallback', 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit('ip:fallback', 2, 60_000)).allowed).toBe(false);
  });
});
