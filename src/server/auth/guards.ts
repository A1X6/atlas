import "server-only";
import type { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "@/src/server/http/errors";
import { verifyAccessToken, type AccessClaims } from "@/src/server/auth/tokens";

/**
 * Stateless request authentication: every protected endpoint reads the access
 * token from the `Authorization: Bearer <token>` header. This works identically
 * for the web client and future native mobile apps, and keeps data endpoints
 * free of ambient cookies (so they're not exposed to CSRF).
 */
export async function getAuth(req: Request): Promise<AccessClaims> {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError();
  }
  try {
    return await verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/** Require authentication AND a specific role. Returns the claims when allowed. */
export async function requireRole(req: Request, role: Role): Promise<AccessClaims> {
  const claims = await getAuth(req);
  if (claims.role !== role) throw new ForbiddenError();
  return claims;
}

/** Returns claims if a valid Bearer token is present, otherwise null (no throw). */
export async function getOptionalAuth(req: Request): Promise<AccessClaims | null> {
  try {
    return await getAuth(req);
  } catch {
    return null;
  }
}
