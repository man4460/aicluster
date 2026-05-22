import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { SmartPoliceShell } from "@/systems/smart-police/components/SmartPoliceShell";
import { requireSmartPoliceSection } from "@/systems/smart-police/lib/guard";

export default async function SmartPoliceLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSmartPoliceSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[smart-police layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูล Smart Police ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await getActiveTrialBanner(session.sub, SMART_POLICE_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[smart-police layout] trial banner", e);
  }

  return <SmartPoliceShell>{children}</SmartPoliceShell>;
}
