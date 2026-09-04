import { Suspense } from "react";
import { loadLmsPage } from "@/systems/lms/lib/load-lms-page";
import { LmsSettingsClient } from "@/systems/lms/components/LmsSettingsClient";

export default async function LmsSettingsPage() {
  const { profile, trialSessionId } = await loadLmsPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <LmsSettingsClient initialProfile={profile} trialSessionId={trialSessionId} />
    </Suspense>
  );
}
