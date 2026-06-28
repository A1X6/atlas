/**
 * Per-account lockout policy. After MAX_FAILED_ATTEMPTS consecutive failed
 * password attempts, the account is locked for LOCK_DURATION_MS — this throttles
 * targeted brute force that a per-IP limit alone can't stop (attacker rotating IPs).
 *
 * Pure functions only (no DB / no clock) so the policy is unit-testable;
 * persistence + enforcement live in the auth service.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** Is the account currently locked, given its lockedUntil and the current time? */
export function isLocked(lockedUntil: Date | null, now: number): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now;
}

export type LoginState = { failedLoginAttempts: number; lockedUntil: Date | null };

/**
 * Compute the next persisted state after one failed attempt. Increments the
 * counter; once it reaches the threshold, locks the account and resets the
 * counter so the next window starts clean.
 */
export function registerFailedAttempt(currentAttempts: number, now: number): LoginState {
  const attempts = currentAttempts + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return { failedLoginAttempts: 0, lockedUntil: new Date(now + LOCK_DURATION_MS) };
  }
  return { failedLoginAttempts: attempts, lockedUntil: null };
}
