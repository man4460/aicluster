import { prisma } from "@/lib/prisma";
import { getUsedCarShowroomDataScope } from "@/lib/trial/module-scopes";
import { ensureUsedCarShowroomShop } from "@/systems/used-car-showroom/lib/ensure-shop";

export async function usedCarShowroomSessionContext(ownerId: string) {
  const scope = await getUsedCarShowroomDataScope(ownerId);
  const shop = await ensureUsedCarShowroomShop(prisma, ownerId, scope.trialSessionId);
  return { scope, shop };
}

export function usedCarShowroomOwnerWhere(ownerId: string, trialSessionId: string) {
  return { ownerUserId: ownerId, trialSessionId };
}
