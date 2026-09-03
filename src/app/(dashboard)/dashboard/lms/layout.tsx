import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { LMS_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { LmsModuleShell } from "@/systems/lms/components/LmsModuleShell";
import { requireLmsSection } from "@/systems/lms/lib/guard";
import { loadLmsPage } from "@/systems/lms/lib/load-lms-page";

export default async function LmsLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireLmsSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[lms layout] requireLmsSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูล LMS ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, LMS_MODULE_SLUG);
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
    console.error("[lms layout] getActiveTrialBanner", e);
  }

  const { profile } = await loadLmsPage();

  return (
    <LmsModuleShell schoolName={profile.displayName} trialExpiresLabel={trialExpiresLabel}>
      {children}
    </LmsModuleShell>
  );
}
