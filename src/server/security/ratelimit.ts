import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RateLimitError } from "@/src/server/http/errors";

/**
 * Shared, serverless-safe rate limiting backed by Upstash Redis. A single
 * in-memory counter cannot limit requests across isolated serverless instances,
 * so we use a Redis sliding window. If Upstash isn't configured (local dev),
 * limiting is skipped rather than failing the request.
 */
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number, window: `${number} ${"s" | "m" | "h"}`) {
  const client = getRedis();
  if (!client) return null;
  const key = `${name}:${limit}:${window}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `atlas:rl:${name}`,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Enforce a rate limit for `identifier` (e.g. ip or ip+route). Throws
 * RateLimitError (429) when exceeded. No-ops when Redis is unconfigured.
 */
export async function enforceRateLimit(
  name: string,
  identifier: string,
  limit: number,
  window: `${number} ${"s" | "m" | "h"}`,
): Promise<void> {
  const limiter = getLimiter(name, limit, window);
  if (!limiter) return;
  const { success } = await limiter.limit(identifier);
  if (!success) throw new RateLimitError();
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
