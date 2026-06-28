import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/src/server/http/respond";
import { requireRole } from "@/src/server/auth/guards";
import { listUsers } from "@/src/server/repositories/user-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(120).optional(),
});

// GET /api/v1/users — admin only. Returns DTO profiles (never password hashes).
export const GET = handle(async (req: NextRequest) => {
  await requireRole(req, "ADMIN");
  const query = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const { items, total } = await listUsers({
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
    q: query.q,
  });
  return ok({
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  });
});
