import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";

/**
 * พอร์ทัลลูกค้าคาร์แคร์ — เปิดให้ใช้ได้เมื่อเจ้าของยังไม่ล็อคหนี้
 * หักโทเคนรายวันเมื่อลูกค้าเข้าใช้ (แม้เจ้าของไม่เปิดแดชบอร์ด)
 */
export async function isCarWashCustomerPortalOpenForOwner(ownerId: string): Promise<boolean> {
  const id = ownerId?.trim() ?? "";
  if (!id) return false;
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(id, CAR_WASH_MODULE_SLUG);
  return charge.ok;
}
