import { requireEcommerceStoreSection } from "@/systems/ecommerce-store/lib/guard";
import { EcommerceStoreShell } from "@/systems/ecommerce-store/components/EcommerceStoreShell";

export default async function EcommerceStoreLayout({ children }: { children: React.ReactNode }) {
  await requireEcommerceStoreSection();
  return <EcommerceStoreShell>{children}</EcommerceStoreShell>;
}
