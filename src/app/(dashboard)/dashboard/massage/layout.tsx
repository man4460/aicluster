import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { isDemoSessionUsername } from "@/lib/auth/demo-account";
import { getSession } from "@/lib/auth/session";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { prisma } from "@/lib/prisma";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { ensureMassageDemoDataForScope } from "@/lib/trial/seed-massage";
import { MassageModuleShell } from "@/systems/massage/components/MassageModuleShell";
import { requireMassageSection } from "@/systems/massage/lib/guard";

export default async function MassageLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireMassageSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[massage layout] requireMassageSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลร้านนวดไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, MASSAGE_MODULE_SLUG);
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
    console.error("[massage layout] getActiveTrialBanner", e);
  }

  try {
    const scope = await getMassageDataScope(session.sub);
    if (scope.isTrialSandbox || isDemoSessionUsername(session.username)) {
      await ensureMassageDemoDataForScope(prisma, session.sub, scope.trialSessionId);
    }
  } catch (e) {
    console.error("[massage layout] ensureMassageDemoDataForScope", e);
  }

  return <MassageModuleShell trialExpiresLabel={trialExpiresLabel}>{children}</MassageModuleShell>;
}
