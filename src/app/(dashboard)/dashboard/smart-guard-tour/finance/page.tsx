import { Suspense } from "react";
import { loadSmartGuardTourPage } from "@/systems/smart-guard-tour/lib/load-page";
import { SmartGuardTourFinanceClient } from "@/systems/smart-guard-tour/components/SmartGuardTourFinanceClient";

export default async function SmartGuardTourFinancePage() {
  const { shop } = await loadSmartGuardTourPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <SmartGuardTourFinanceClient initialShop={shop} />
    </Suspense>
  );
}
