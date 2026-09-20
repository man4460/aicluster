import { prisma } from "@/lib/prisma";
import { getSmartGuardTourDataScope } from "@/lib/trial/module-scopes";
import { ensureSmartGuardShop } from "@/systems/smart-guard-tour/lib/ensure-shop";

export async function smartGuardTourSessionContext(ownerId: string) {
  const scope = await getSmartGuardTourDataScope(ownerId);
  const shop = await ensureSmartGuardShop(prisma, ownerId, scope.trialSessionId);
  return { scope, shop };
}

export function smartGuardTourOwnerWhere(ownerId: string, trialSessionId: string) {
  return { ownerUserId: ownerId, trialSessionId };
}
