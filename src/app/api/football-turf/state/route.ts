import { NextResponse } from "next/server";
import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";
import { createFootballTurfServerRepo } from "@/systems/football-turf/lib/server-repo";

export async function GET(req: Request) {
  const gate = await getFootballTurfOwnerOrStaffContext(req);
  if (!gate.ok) return gate.res;

  const repo = createFootballTurfServerRepo(gate.userId, gate.trialSessionId);
  const state = await repo.loadFullState();
  return NextResponse.json(state);
}
