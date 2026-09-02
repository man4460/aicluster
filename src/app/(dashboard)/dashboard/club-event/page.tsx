import { Suspense } from "react";
import { loadClubEventPage } from "@/systems/club-event/lib/load-club-event-page";
import { ClubEventDashboardClient } from "@/systems/club-event/components/ClubEventDashboardClient";

export default async function ClubEventDashboardPage() {
  const { profile } = await loadClubEventPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventDashboardClient initialProfile={profile} />
    </Suspense>
  );
}
