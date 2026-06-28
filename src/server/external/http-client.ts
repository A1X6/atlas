import "server-only";
import { ExternalServiceError } from "@/src/server/http/errors";

/**
 * Resilient fetch for untrusted third-party services. Provides:
 *  - per-request timeout (AbortController) so a slow upstream can't hang us,
 *  - bounded retries with exponential backoff + jitter for transient failures,
 *  - a lightweight circuit breaker so we stop hammering a service that is down.
 *
 * Callers should still validate the response body (we never trust shape/content).
 */

type BreakerState = { failures: number; openUntil: number };
const breakers = new Map<string, BreakerState>();

const BREAKER_THRESHOLD = 5; // consecutive failures before opening
const BREAKER_COOLDOWN_MS = 30_000; // how long the circuit stays open

function breakerKey(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function isOpen(key: string): boolean {
  const b = breakers.get(key);
  if (!b) return false;
  if (b.openUntil && b.openUntil > Date.now()) return true;
  return false;
}

function recordSuccess(key: string) {
  breakers.set(key, { failures: 0, openUntil: 0 });
}

function recordFailure(key: string) {
  const b = breakers.get(key) ?? { failures: 0, openUntil: 0 };
  b.failures += 1;
  if (b.failures >= BREAKER_THRESHOLD) {
    b.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    b.failures = 0;
  }
  breakers.set(key, b);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ResilientFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
};

export async function resilientFetch(
  url: string,
  { timeoutMs = 4000, retries = 2, signal }: ResilientFetchOptions = {},
): Promise<Response> {
  const key = breakerKey(url);

  if (isOpen(key)) {
    throw new ExternalServiceError("Upstream temporarily unavailable (circuit open)");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      // Retry only on 5xx / 429; 4xx (except 429) is a client problem, don't retry.
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`Upstream responded ${res.status}`);
      }
      recordSuccess(key);
      return res;
    } catch (err) {
      lastError = err;
      recordFailure(key);
      if (attempt < retries) {
        const backoff = 200 * 2 ** attempt + Math.floor(Math.random() * 100);
        await sleep(backoff);
      }
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }

  throw new ExternalServiceError(
    `Upstream request failed after ${retries + 1} attempts: ${String(
      lastError instanceof Error ? lastError.message : lastError,
    )}`,
  );
}
