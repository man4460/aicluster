import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { prisma } from "@/lib/prisma";
import { getSmartGuardTourDataScope } from "@/lib/trial/module-scopes";
import { ensureSmartGuardShop } from "@/systems/smart-guard-tour/lib/ensure-shop";
import { mapSmartGuardShop } from "@/systems/smart-guard-tour/lib/mappers";
import { requireSmartGuardTourSection } from "@/systems/smart-guard-tour/lib/guard";

export async function loadSmartGuardTourPage() {
  await requireSmartGuardTourSection();
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const billing = await getModuleBillingContext(session.sub);
  const ownerId = billing?.billingUserId ?? session.sub;
  const scope = await getSmartGuardTourDataScope(ownerId);
  const shop = await ensureSmartGuardShop(prisma, ownerId, scope.trialSessionId);
  return {
    shop: mapSmartGuardShop(shop),
    trialSessionId: scope.trialSessionId,
  };
}
