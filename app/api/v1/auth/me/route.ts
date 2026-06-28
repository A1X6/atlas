import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { NotFoundError } from "@/src/server/http/errors";
import { getAuth } from "@/src/server/auth/guards";
import { getMe } from "@/src/server/services/auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const { sub } = await getAuth(req);
  const user = await getMe(sub);
  if (!user) throw new NotFoundError("User not found");
  return ok({ user });
});
