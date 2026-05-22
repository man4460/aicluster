import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";
import { requireModulePage } from "@/lib/modules/guard";
import { LoyaltyStampModuleShell } from "@/systems/loyalty-stamp/components/LoyaltyStampModuleShell";

export default async function LoyaltyStampLayout({ children }: { children: React.ReactNode }) {
  await requireModulePage(LOYALTY_STAMP_MODULE_SLUG);
  return <LoyaltyStampModuleShell>{children}</LoyaltyStampModuleShell>;
}
