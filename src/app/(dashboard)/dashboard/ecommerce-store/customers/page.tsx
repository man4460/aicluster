import { redirect } from "next/navigation";
import { ecommerceStoreManageHref } from "@/systems/ecommerce-store/ecommerce-store-module-nav";

export default function EcommerceStoreCustomersPage() {
  redirect(ecommerceStoreManageHref("crm"));
}
