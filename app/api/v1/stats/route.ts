import type { NextRequest } from "next/server";
import { handle, ok } from "@/src/server/http/respond";
import { requireRole } from "@/src/server/auth/guards";
import { getAdminStats } from "@/src/server/services/stats-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/stats — admin dashboard metrics.
export const GET = handle(async (req: NextRequest) => {
  await requireRole(req, "ADMIN");
  const stats = await getAdminStats();
  return ok({ stats });
});
