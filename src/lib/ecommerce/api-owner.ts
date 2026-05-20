import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
const PROD_TRIAL = "prod";

export async function getEcommerceOwnerFromAuth(sessionSub: string) {
  const ctx = await getModuleBillingContext(sessionSub);
  if (!ctx) return null;
  return { ownerUserId: ctx.billingUserId, access: ctx.access };
}

export async function getOrCreateEcommerceStore(ownerUserId: string, trialSessionId = PROD_TRIAL) {
  const existing = await prisma.ecommerceStore.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;

  return prisma.ecommerceStore.create({
    data: {
      ownerUserId,
      trialSessionId,
      storeName: "ร้านค้าของฉัน",
    },
  });
}
