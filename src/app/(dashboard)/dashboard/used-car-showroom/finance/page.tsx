import { Suspense } from "react";
import { loadUsedCarShowroomPage } from "@/systems/used-car-showroom/lib/load-page";
import { UsedCarShowroomFinanceClient } from "@/systems/used-car-showroom/components/UsedCarShowroomFinanceClient";

export default async function UsedCarShowroomFinancePage() {
  const { shop } = await loadUsedCarShowroomPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <UsedCarShowroomFinanceClient initialShop={shop} />
    </Suspense>
  );
}
