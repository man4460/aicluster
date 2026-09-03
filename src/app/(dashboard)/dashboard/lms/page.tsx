import { Suspense } from "react";
import { loadLmsPage } from "@/systems/lms/lib/load-lms-page";
import { LmsDashboardClient } from "@/systems/lms/components/LmsDashboardClient";

export default async function LmsDashboardPage() {
  const { profile } = await loadLmsPage();
  return (
    <Suspense fallback={<p className="p-4 text-sm text-[#66638c]">กำลังโหลด…</p>}>
      <LmsDashboardClient initialProfile={profile} />
    </Suspense>
  );
}
