import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { prisma } from "@/lib/prisma";
import { getUsedCarShowroomDataScope } from "@/lib/trial/module-scopes";
import { ensureUsedCarShowroomShop } from "@/systems/used-car-showroom/lib/ensure-shop";
import { mapUsedCarShop } from "@/systems/used-car-showroom/lib/mappers";
import { requireUsedCarShowroomSection } from "@/systems/used-car-showroom/lib/guard";

export async function loadUsedCarShowroomPage() {
  await requireUsedCarShowroomSection();
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const billing = await getModuleBillingContext(session.sub);
  const ownerId = billing?.billingUserId ?? session.sub;
  const scope = await getUsedCarShowroomDataScope(ownerId);
  const shop = await ensureUsedCarShowroomShop(prisma, ownerId, scope.trialSessionId);
  return {
    shop: mapUsedCarShop(shop),
    trialSessionId: scope.trialSessionId,
  };
}
