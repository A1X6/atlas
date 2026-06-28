import { describe, it, expect } from "vitest";
import { updateAccountSchema } from "@/src/server/validation/account-schemas";
import { adminUpdateUserSchema } from "@/src/server/validation/user-admin-schemas";
import { productFeedSchema } from "@/src/server/validation/product-schemas";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/src/server/validation/auth-schemas";

describe("updateAccountSchema", () => {
  const base = {
    emails: [{ address: "a@b.co" }],
    phones: [{ countryCode: "+44", number: "7700 900812" }],
  };
  it("requires at least one email and one phone", () => {
    expect(updateAccountSchema.safeParse({ ...base, emails: [] }).success).toBe(false);
    expect(updateAccountSchema.safeParse({ ...base, phones: [] }).success).toBe(false);
    expect(updateAccountSchema.safeParse(base).success).toBe(true);
  });
  it("allows clearing optional fields with null", () => {
    const r = updateAccountSchema.safeParse({ ...base, bio: null, country: null });
    expect(r.success).toBe(true);
  });
});

describe("adminUpdateUserSchema", () => {
  it("accepts a valid role", () => {
    expect(adminUpdateUserSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
  });
  it("rejects an unknown role", () => {
    expect(adminUpdateUserSchema.safeParse({ role: "SUPERUSER" }).success).toBe(false);
  });
});

describe("productFeedSchema", () => {
  it("defaults limit and accepts a uuid cursor", () => {
    const r = productFeedSchema.safeParse({});
    expect(r.success && r.data.limit).toBe(12);
    expect(
      productFeedSchema.safeParse({ cursor: "11111111-1111-4111-8111-111111111111" }).success,
    ).toBe(true);
  });
  it("rejects a non-uuid cursor and an oversized limit", () => {
    expect(productFeedSchema.safeParse({ cursor: "abc" }).success).toBe(false);
    expect(productFeedSchema.safeParse({ limit: 999 }).success).toBe(false);
  });
});

describe("password reset schemas", () => {
  it("validates forgot + reset payloads", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ token: "x".repeat(20), password: "abcd1234" }).success,
    ).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "short", password: "abcd1234" }).success).toBe(
      false,
    );
  });
});
