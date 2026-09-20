import { Suspense } from "react";
import { loadSmartGuardTourPage } from "@/systems/smart-guard-tour/lib/load-page";
import { SmartGuardTourDashboardClient } from "@/systems/smart-guard-tour/components/SmartGuardTourDashboardClient";

export default async function SmartGuardTourDashboardPage() {
  const { shop } = await loadSmartGuardTourPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <SmartGuardTourDashboardClient initialShop={shop} />
    </Suspense>
  );
}
