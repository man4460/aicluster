import { NextResponse } from "next/server";
import { getCommunityCoopOwnerContext } from "@/systems/community-coop/lib/community-coop-api-auth";
import { buildCommunityCoopDashboardDto } from "@/systems/community-coop/lib/load-community-coop-dashboard";

export async function GET() {
  const ctx = await getCommunityCoopOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dto = await buildCommunityCoopDashboardDto(ctx.settings, ctx.userId, ctx.scope.trialSessionId);
  return NextResponse.json(dto);
}
