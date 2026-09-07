import { Suspense } from "react";
import { ClubEventManageClient } from "@/systems/club-event/components/ClubEventManageClient";
import { loadClubEventPage } from "@/systems/club-event/lib/load-club-event-page";

export default async function ClubEventManagePage() {
  const { profile } = await loadClubEventPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventManageClient
        initialCommittee={profile.committee}
        publicUrl={profile.publicUrl}
      />
    </Suspense>
  );
}
