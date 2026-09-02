import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { ClubEventModuleShell } from "@/systems/club-event/components/ClubEventModuleShell";
import { requireClubEventSection } from "@/systems/club-event/lib/guard";
import { loadClubEventPage } from "@/systems/club-event/lib/load-club-event-page";

export default async function ClubEventLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireClubEventSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[club-event layout] requireClubEventSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลบริหารชมรมไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, CLUB_EVENT_MODULE_SLUG);
    trialExpiresLabel =
      trial == null
        ? null
        : trial.expiresAt.toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            dateStyle: "medium",
            timeStyle: "short",
          });
  } catch (e) {
    unstable_rethrow(e);
    console.error("[club-event layout] getActiveTrialBanner", e);
  }

  const { profile } = await loadClubEventPage();

  return (
    <ClubEventModuleShell clubName={profile.displayName} trialExpiresLabel={trialExpiresLabel}>
      {children}
    </ClubEventModuleShell>
  );
}
