import { Suspense } from "react";
import { loadUsedCarShowroomPage } from "@/systems/used-car-showroom/lib/load-page";
import { UsedCarShowroomManageClient } from "@/systems/used-car-showroom/components/UsedCarShowroomManageClient";

export default async function UsedCarShowroomManagePage() {
  const { shop } = await loadUsedCarShowroomPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <UsedCarShowroomManageClient initialShop={shop} />
    </Suspense>
  );
}
