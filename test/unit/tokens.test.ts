import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "@/src/server/auth/tokens";

describe("access tokens", () => {
  it("round-trips subject and role", async () => {
    const token = await signAccessToken("user-1", "ADMIN");
    const claims = await verifyAccessToken(token);
    expect(claims.sub).toBe("user-1");
    expect(claims.role).toBe("ADMIN");
  });

  it("rejects a tampered token", async () => {
    const token = await signAccessToken("user-1", "USER");
    await expect(verifyAccessToken(token + "x")).rejects.toBeTruthy();
  });
});

describe("refresh tokens", () => {
  it("creates a token with a jti and matching hash", async () => {
    const r = await createRefreshToken("user-2");
    expect(r.jti).toBeTruthy();
    expect(r.tokenHash).toBe(hashToken(r.token));
    const claims = await verifyRefreshToken(r.token);
    expect(claims.sub).toBe("user-2");
    expect(claims.jti).toBe(r.jti);
  });

  it("hashToken is deterministic and not the raw token", async () => {
    const r = await createRefreshToken("user-3");
    expect(hashToken(r.token)).toBe(hashToken(r.token));
    expect(hashToken(r.token)).not.toBe(r.token);
  });
});
