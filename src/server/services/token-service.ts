import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { TokenType } from "@prisma/client";
import { prisma } from "@/src/server/db";

/**
 * Single-use verification/reset tokens. We generate a high-entropy random token,
 * email the raw value, and persist only its SHA-256 hash — so a DB leak can't
 * be used to verify emails or reset passwords.
 */
function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(input: {
  userId: string;
  type: TokenType;
  email?: string;
  ttlMs: number;
}): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId: input.userId,
      type: input.type,
      email: input.email ?? null,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + input.ttlMs),
    },
  });
  return token;
}

export type ConsumedToken = { userId: string; email: string | null };

/** Validate + atomically mark a token used. Returns null if invalid/expired/used. */
export async function consumeVerificationToken(
  rawToken: string,
  type: TokenType,
): Promise<ConsumedToken | null> {
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash: hash(rawToken) } });
  if (
    !record ||
    record.type !== type ||
    record.usedAt !== null ||
    record.expiresAt.getTime() < Date.now()
  ) {
    return null;
  }
  // Mark used; updateMany with the usedAt guard avoids a double-consume race.
  const res = await prisma.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (res.count === 0) return null;
  return { userId: record.userId, email: record.email };
}
