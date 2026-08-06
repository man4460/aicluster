import { getSession } from "@/lib/auth/session";
import { seedFootballTurfSampleActivity } from "@/lib/trial/seed-football-turf";
import { getFootballTurfDataScope } from "@/lib/trial/module-scopes";
import { prisma } from "@/lib/prisma";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";

export async function getFootballTurfOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const scope = await getFootballTurfDataScope(session.sub);
  const profile = await ensureFootballTurfProfile(session.sub, scope.trialSessionId);
  await seedFootballTurfSampleActivity(prisma, session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, profile };
}
