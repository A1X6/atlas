import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, passwordSchema } from "@/src/server/validation/auth-schemas";

describe("passwordSchema", () => {
  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("ab1").success).toBe(false);
  });
  it("requires a letter and a number", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("abcd1234").success).toBe(true);
  });
});

describe("registerSchema", () => {
  const base = {
    firstName: "Mara",
    lastName: "Vance",
    password: "abcd1234",
    emails: [{ address: "mara@atlas.io" }],
    phones: [{ countryCode: "+44", number: "7700 900812" }],
  };

  it("accepts a valid payload and lowercases email", () => {
    const r = registerSchema.safeParse({ ...base, emails: [{ address: "MARA@atlas.io" }] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.emails[0].address).toBe("mara@atlas.io");
  });

  it("requires at least one email and one phone", () => {
    expect(registerSchema.safeParse({ ...base, emails: [] }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, phones: [] }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...base, emails: [{ address: "nope" }] }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(false);
  });
});
