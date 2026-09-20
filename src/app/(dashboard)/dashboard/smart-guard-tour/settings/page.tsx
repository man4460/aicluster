import { Suspense } from "react";
import { loadSmartGuardTourPage } from "@/systems/smart-guard-tour/lib/load-page";
import { SmartGuardTourSettingsClient } from "@/systems/smart-guard-tour/components/SmartGuardTourSettingsClient";

export default async function SmartGuardTourSettingsPage() {
  const { shop } = await loadSmartGuardTourPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <SmartGuardTourSettingsClient initialShop={shop} />
    </Suspense>
  );
}
