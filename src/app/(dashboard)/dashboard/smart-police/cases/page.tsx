import { Suspense } from "react";
import { SmartPoliceCasesClient } from "@/systems/smart-police/components/SmartPoliceCasesClient";

export default function SmartPoliceCasesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <SmartPoliceCasesClient />
    </Suspense>
  );
}
