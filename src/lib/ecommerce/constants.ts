import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";

export { ECOMMERCE_STORE_MODULE_SLUG };

/** เส้นทางหน้าร้องสาธารณะ — `/shop/[storeId]` */
export const ECOMMERCE_PUBLIC_SHOP_PATH = "/shop" as const;

export const ECOMMERCE_ORDER_STATUS_LABELS: Record<
  "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED",
  string
> = {
  PENDING_SLIP: "รอแนบสลิป",
  VERIFYING: "กำลังตรวจสอบ",
  PREPARING: "กำลังจัดเตรียม",
  SHIPPED: "จัดส่งแล้ว",
};

export function ecommercePublicShopUrl(storeId: string, origin?: string): string {
  const path = `${ECOMMERCE_PUBLIC_SHOP_PATH}/${encodeURIComponent(storeId)}`;
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  return path;
}
