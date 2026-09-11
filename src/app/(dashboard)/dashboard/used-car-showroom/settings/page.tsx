import { Suspense } from "react";
import { loadUsedCarShowroomPage } from "@/systems/used-car-showroom/lib/load-page";
import { UsedCarShowroomSettingsClient } from "@/systems/used-car-showroom/components/UsedCarShowroomSettingsClient";

export default async function UsedCarShowroomSettingsPage() {
  const { shop } = await loadUsedCarShowroomPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <UsedCarShowroomSettingsClient initialShop={shop} />
    </Suspense>
  );
}
