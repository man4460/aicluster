import { Suspense } from "react";
import { LmsFinanceClient } from "@/systems/lms/components/LmsFinanceClient";

export default function LmsFinancePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <LmsFinanceClient />
    </Suspense>
  );
}
