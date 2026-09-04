import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { PRO_RESUME_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { ProResumeModuleShell } from "@/systems/pro-resume/components/ProResumeModuleShell";
import { requireProResumeSection } from "@/systems/pro-resume/lib/guard";
import { loadProResumePage } from "@/systems/pro-resume/lib/load-pro-resume-page";

export default async function ProResumeLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireProResumeSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[pro-resume layout] requireProResumeSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูล Pro Resume ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, PRO_RESUME_MODULE_SLUG);
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
    console.error("[pro-resume layout] getActiveTrialBanner", e);
  }

  const { profile } = await loadProResumePage();

  return (
    <ProResumeModuleShell displayName={profile.fullName} trialExpiresLabel={trialExpiresLabel}>
      {children}
    </ProResumeModuleShell>
  );
}
