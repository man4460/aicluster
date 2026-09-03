import { prisma } from "@/lib/prisma";
import { getLmsDataScope } from "@/lib/trial/module-scopes";
import { ensureLmsProfile } from "@/systems/lms/lib/ensure-lms-profile";

export async function lmsSessionContext(ownerId: string) {
  const scope = await getLmsDataScope(ownerId);
  const profile = await ensureLmsProfile(prisma, ownerId, scope.trialSessionId);
  return { scope, profile };
}

export function lmsOwnerWhere(ownerId: string, trialSessionId: string) {
  return { ownerUserId: ownerId, trialSessionId };
}
