import { Suspense } from "react";
import { loadSmartGuardTourPage } from "@/systems/smart-guard-tour/lib/load-page";
import { SmartGuardTourManageClient } from "@/systems/smart-guard-tour/components/SmartGuardTourManageClient";

export default async function SmartGuardTourManagePage() {
  const { shop } = await loadSmartGuardTourPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <SmartGuardTourManageClient initialShop={shop} />
    </Suspense>
  );
}
