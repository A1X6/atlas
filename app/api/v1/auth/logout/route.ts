import { handle, ok } from "@/src/server/http/respond";
import { logout } from "@/src/server/services/auth-service";
import { readRefreshCookie, clearRefreshCookie, clearSessionCookie } from "@/src/server/auth/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  const current = await readRefreshCookie();
  await logout(current);
  await clearRefreshCookie();
  await clearSessionCookie();
  return ok({ success: true });
});
