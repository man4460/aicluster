import { NextResponse } from "next/server";
import { getFootballTurfOwnerContext } from "@/systems/football-turf/lib/api-auth";
import { getFootballTurfCustomerUsageStats } from "@/systems/football-turf/lib/loyalty";

export async function GET(req: Request) {
  const ctx = await getFootballTurfOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  const stats = await getFootballTurfCustomerUsageStats(ctx.userId, ctx.scope.trialSessionId, phone);
  if (!stats) return NextResponse.json({ error: "เบอร์ไม่ถูกต้อง" }, { status: 400 });
  return NextResponse.json({ stats });
}
