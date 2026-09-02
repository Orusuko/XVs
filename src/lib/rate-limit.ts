export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

type Window = {
  count: number;
  expiresAt: number;
};

const windows = new Map<string, Window>();

/** Exposed for tests, which need a clean slate between cases. */
export function resetRateLimitStore(): void {
  windows.clear();
}

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function upstashLimit(
  config: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['PEXPIRE', redisKey, String(windowMs), 'NX'],
    ]),
    cache: 'no-store',
  });

  if (!response.ok) {
    // A limiter outage must not take the door down with it.
    return { allowed: true, remaining: limit };
  }

  const [incr] = (await response.json()) as { result: number }[];
  const count = incr?.result ?? 0;

  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

function inMemoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.expiresAt <= now) {
    windows.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
  };
}

/**
 * Uses Upstash when it is configured. The in-memory fallback is per serverless
 * instance, so it slows an attacker down rather than stopping them outright.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const config = upstashConfig();
  if (config) {
    try {
      return await upstashLimit(config, key, limit, windowMs);
    } catch {
      return inMemoryLimit(key, limit, windowMs);
    }
  }

  return inMemoryLimit(key, limit, windowMs);
}
