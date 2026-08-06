import { NextResponse } from "next/server";
import { getFootballTurfOwnerContext } from "@/systems/football-turf/lib/api-auth";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

export async function GET() {
  const ctx = await getFootballTurfOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = createFootballTurfServerRepo(ctx.userId, ctx.scope.trialSessionId);
  const state = await repo.loadFullState();
  return NextResponse.json(state);
}
