import { Suspense } from "react";
import { LmsManageClient } from "@/systems/lms/components/LmsManageClient";

export default function LmsManagePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <LmsManageClient />
    </Suspense>
  );
}
