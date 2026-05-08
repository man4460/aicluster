import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { EDUCARE_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { EducareShell } from "@/systems/educare/components/EducareShell";
import { requireEducareSection } from "@/systems/educare/lib/guard";

export default async function EducareLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireEducareSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[educare layout] requireEducareSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูล EduCare ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  // Touch trial banner only to keep banner cache warm — UI ภายนอกของ shell
  try {
    await getActiveTrialBanner(session.sub, EDUCARE_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[educare layout] getActiveTrialBanner", e);
  }

  return <EducareShell>{children}</EducareShell>;
}
