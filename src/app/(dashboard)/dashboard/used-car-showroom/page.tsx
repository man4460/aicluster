import { Suspense } from "react";
import { loadUsedCarShowroomPage } from "@/systems/used-car-showroom/lib/load-page";
import { UsedCarShowroomDashboardClient } from "@/systems/used-car-showroom/components/UsedCarShowroomDashboardClient";

export default async function UsedCarShowroomDashboardPage() {
  const { shop } = await loadUsedCarShowroomPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <UsedCarShowroomDashboardClient initialShop={shop} />
    </Suspense>
  );
}
