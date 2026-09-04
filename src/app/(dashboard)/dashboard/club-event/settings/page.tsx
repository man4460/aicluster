import { Suspense } from "react";
import { loadClubEventPage } from "@/systems/club-event/lib/load-club-event-page";
import { ClubEventSettingsClient } from "@/systems/club-event/components/ClubEventSettingsClient";

export default async function ClubEventSettingsPage() {
  const { profile, trialSessionId } = await loadClubEventPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <ClubEventSettingsClient initialProfile={profile} trialSessionId={trialSessionId} />
    </Suspense>
  );
}
