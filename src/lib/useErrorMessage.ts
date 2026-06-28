"use client";

import { ApiError } from "@/src/lib/api";

/**
 * Resolves a user-facing message for a caught error. The API already localizes
 * its error messages (per-field validation + by-code) to the request locale, so
 * for an ApiError we surface that message directly; only non-API failures
 * (network/unexpected) fall back to the caller's contextual translated string.
 *
 * Returns a stable function; kept as a hook for call-site ergonomics and future
 * extension.
 */
export function useErrorMessage() {
  return (err: unknown, fallback: string): string =>
    err instanceof ApiError && err.message ? err.message : fallback;
}
