import { describe, it, expect } from "vitest";
import {
  generateOtpCode,
  hashOtp,
  evaluateOtp,
  OTP_MAX_ATTEMPTS,
  type OtpRecord,
} from "@/src/server/auth/otp";

const base = (over: Partial<OtpRecord> = {}): OtpRecord => ({
  tokenHash: hashOtp("123456"),
  expiresAt: new Date(Date.now() + 60_000),
  usedAt: null,
  attempts: 0,
  ...over,
});

describe("generateOtpCode", () => {
  it("returns a zero-padded 6-digit numeric string", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp", () => {
  it("is deterministic and not the raw code", () => {
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
    expect(hashOtp("123456")).not.toBe("123456");
    expect(hashOtp("123456")).not.toBe(hashOtp("654321"));
  });
});

describe("evaluateOtp", () => {
  const now = Date.now();

  it("accepts a correct, fresh, unused code", () => {
    expect(evaluateOtp({ record: base(), code: "123456", now })).toBe("ok");
  });

  it("reports mismatch for a wrong code on a valid record", () => {
    expect(evaluateOtp({ record: base(), code: "000000", now })).toBe("mismatch");
  });

  it("is invalid when no record exists", () => {
    expect(evaluateOtp({ record: null, code: "123456", now })).toBe("invalid");
  });

  it("is invalid when already used", () => {
    expect(evaluateOtp({ record: base({ usedAt: new Date() }), code: "123456", now })).toBe("invalid");
  });

  it("is invalid when expired", () => {
    const rec = base({ expiresAt: new Date(now - 1) });
    expect(evaluateOtp({ record: rec, code: "123456", now })).toBe("invalid");
  });

  it("is invalid once attempts are exhausted, even with the right code", () => {
    const rec = base({ attempts: OTP_MAX_ATTEMPTS });
    expect(evaluateOtp({ record: rec, code: "123456", now })).toBe("invalid");
  });
});
