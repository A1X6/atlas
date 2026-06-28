import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe. Returns 200 when the app can reach the database,
 * 503 otherwise — suitable for a load balancer / uptime monitor health check.
 * Never throws; failures are reported in the body.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
