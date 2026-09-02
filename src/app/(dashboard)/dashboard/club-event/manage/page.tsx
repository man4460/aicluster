import { Suspense } from "react";
import { ClubEventManageClient } from "@/systems/club-event/components/ClubEventManageClient";

export default function ClubEventManagePage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventManageClient />
    </Suspense>
  );
}
