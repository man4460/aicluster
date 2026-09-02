import { Suspense } from "react";
import { ClubEventFinanceClient } from "@/systems/club-event/components/ClubEventFinanceClient";

export default function ClubEventFinancePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventFinanceClient />
    </Suspense>
  );
}
