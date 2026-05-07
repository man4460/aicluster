import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { LaundryModuleShell } from "@/systems/laundry/components/LaundryModuleShell";
import { requireLaundrySection } from "@/systems/laundry/lib/guard";

export default async function LaundryLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireLaundrySection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[laundry layout] requireLaundrySection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลรับฝากซักผ้าไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, LAUNDRY_MODULE_SLUG);
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
    console.error("[laundry layout] getActiveTrialBanner", e);
  }

  return <LaundryModuleShell trialExpiresLabel={trialExpiresLabel}>{children}</LaundryModuleShell>;
}
