import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { BarberModuleShell } from "@/systems/barber/components/BarberModuleShell";
import { requireBarberSection } from "@/systems/barber/lib/guard";

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireBarberSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[barber layout] requireBarberSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลร้านตัดผมไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, BARBER_MODULE_SLUG);
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
    console.error("[barber layout] getActiveTrialBanner", e);
  }

  return <BarberModuleShell trialExpiresLabel={trialExpiresLabel}>{children}</BarberModuleShell>;
}
