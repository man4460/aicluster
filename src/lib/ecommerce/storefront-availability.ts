import { prisma } from "@/lib/prisma";
import { canAccessAppModule } from "@/lib/modules/access";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { listModuleSlugsChargedToday } from "@/lib/tokens/module-daily-deduction";

export type StorefrontAvailability =
  | { ok: true }
  | { ok: false; reason: "not_found" | "paused" | "unavailable" };

/**
 * หน้าร้องสาธารณะเปิดได้เมื่อ:
 * - มีร้านและ Merchant ไม่ pause
 * - เจ้าของร้านยังมีสิทธิ์โมดูล (โทเคน/Buffet/หักวันนี้แล้ว)
 */
export async function getEcommerceStorefrontAvailability(
  storeId: string,
): Promise<StorefrontAvailability> {
  const store = await prisma.ecommerceStore.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      merchantPaused: true,
      ownerUserId: true,
      owner: {
        select: {
          role: true,
          subscriptionType: true,
          subscriptionTier: true,
          tokens: true,
        },
      },
    },
  });
  if (!store) return { ok: false, reason: "not_found" };
  if (store.merchantPaused) return { ok: false, reason: "paused" };

  const mod = await prisma.appModule.findFirst({
    where: { slug: ECOMMERCE_STORE_MODULE_SLUG, isActive: true },
    select: { slug: true, groupId: true },
  });
  if (!mod) return { ok: false, reason: "unavailable" };

  const chargedTodaySlugs = await listModuleSlugsChargedToday(store.ownerUserId);
  const allowed = canAccessAppModule(store.owner, mod, { chargedTodaySlugs });
  if (!allowed) return { ok: false, reason: "unavailable" };

  return { ok: true };
}
