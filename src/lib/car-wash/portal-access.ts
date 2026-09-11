import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";

/**
 * พอร์ทัลลูกค้าคาร์แคร์ — แพ็กรายเดือน (หรือทดลอง ACTIVE) + หัก/บันทึกการใช้ลิงก์ภายนอก
 */
export async function isCarWashCustomerPortalOpenForOwner(ownerId: string): Promise<boolean> {
  const id = ownerId?.trim() ?? "";
  if (!id) return false;
  return isOwnerModulePublicOpenAndCharge(id, CAR_WASH_MODULE_SLUG);
}
