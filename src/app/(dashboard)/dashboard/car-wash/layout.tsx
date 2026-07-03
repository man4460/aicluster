import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { requireCarWashSection } from "@/systems/car-wash/lib/guard";
import { CarWashModuleShell } from "@/systems/car-wash/components/CarWashModuleShell";

export default async function CarWashLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireCarWashSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[car-wash layout] requireCarWashSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลคาร์แคร์ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, CAR_WASH_MODULE_SLUG);
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
    console.error("[car-wash layout] getActiveTrialBanner", e);
  }

  return <CarWashModuleShell trialExpiresLabel={trialExpiresLabel}>{children}</CarWashModuleShell>;
}
