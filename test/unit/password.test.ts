import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/src/server/auth/password";

describe("password hashing (argon2id)", () => {
  it("hashes to a non-plaintext argon2 string", async () => {
    const hash = await hashPassword("Secret123!");
    expect(hash).not.toBe("Secret123!");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("Secret123!");
    expect(await verifyPassword(hash, "Secret123!")).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Secret123!");
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("returns false on a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });
});
