import { describe, it, expect } from "vitest";
import {
  isLocked,
  registerFailedAttempt,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
} from "@/src/server/auth/lockout";

describe("isLocked", () => {
  const now = 1_000_000;
  it("is false when lockedUntil is null", () => {
    expect(isLocked(null, now)).toBe(false);
  });
  it("is false when the lock has expired", () => {
    expect(isLocked(new Date(now - 1), now)).toBe(false);
  });
  it("is true while the lock is in the future", () => {
    expect(isLocked(new Date(now + 1000), now)).toBe(true);
  });
});

describe("registerFailedAttempt", () => {
  const now = 5_000_000;

  it("increments attempts without locking below the threshold", () => {
    const s = registerFailedAttempt(0, now);
    expect(s).toEqual({ failedLoginAttempts: 1, lockedUntil: null });
    const s4 = registerFailedAttempt(MAX_FAILED_ATTEMPTS - 2, now);
    expect(s4.failedLoginAttempts).toBe(MAX_FAILED_ATTEMPTS - 1);
    expect(s4.lockedUntil).toBeNull();
  });

  it("locks once the threshold is reached and resets the counter", () => {
    const s = registerFailedAttempt(MAX_FAILED_ATTEMPTS - 1, now);
    expect(s.failedLoginAttempts).toBe(0);
    expect(s.lockedUntil).toEqual(new Date(now + LOCK_DURATION_MS));
  });
});
