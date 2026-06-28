import "server-only";
import { hash, verify } from "@node-rs/argon2";

// argon2id parameters aligned with OWASP guidance (memory-hard, resists GPU cracking).
// @node-rs/argon2 ships prebuilt binaries → works on Vercel serverless.
const ARGON2_OPTS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(hashString: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashString, plain);
  } catch {
    return false;
  }
}
