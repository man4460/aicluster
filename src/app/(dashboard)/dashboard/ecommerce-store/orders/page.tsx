import { redirect } from "next/navigation";
import { ECOMMERCE_STORE_BASE } from "@/systems/ecommerce-store/ecommerce-store-module-nav";

/** ออเดอร์ย้ายเป็นเมนูย่อยใต้แดชบอร์ด */
export default function EcommerceStoreOrdersPage() {
  redirect(`${ECOMMERCE_STORE_BASE}?tab=orders`);
}
