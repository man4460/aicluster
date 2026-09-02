import { prisma } from "@/lib/prisma";
import { getClubEventDataScope } from "@/lib/trial/module-scopes";
import { ensureClubEventProfile } from "@/systems/club-event/lib/ensure-club-event-profile";

export async function clubEventSessionContext(ownerId: string) {
  const scope = await getClubEventDataScope(ownerId);
  const profile = await ensureClubEventProfile(prisma, ownerId, scope.trialSessionId);
  return { scope, profile };
}

export function clubEventOwnerWhere(ownerId: string, trialSessionId: string) {
  return { ownerUserId: ownerId, trialSessionId };
}
