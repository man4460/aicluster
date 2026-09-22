import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { SMART_GUARD_TOUR_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { SmartGuardTourModuleShell } from "@/systems/smart-guard-tour/components/SmartGuardTourModuleShell";
import { requireSmartGuardTourSection } from "@/systems/smart-guard-tour/lib/guard";
import { loadSmartGuardTourPage } from "@/systems/smart-guard-tour/lib/load-page";

export default async function SmartGuardTourLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSmartGuardTourSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[smart-guard-tour layout] require", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลธุรกิจ รปภ. ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, SMART_GUARD_TOUR_MODULE_SLUG);
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
    console.error("[smart-guard-tour layout] trial", e);
  }

  let shopName = "โมดูล ธุรกิจ รปภ.";
  try {
    const { shop } = await loadSmartGuardTourPage();
    shopName = shop.displayName;
  } catch (e) {
    unstable_rethrow(e);
    console.error("[smart-guard-tour layout] load", e);
    return <DashboardDataLoadError message="โหลดโปรไฟล์ไซต์ไม่สำเร็จ — ลองรีเฟรชอีกครั้ง" />;
  }

  return (
    <SmartGuardTourModuleShell shopName={shopName} trialExpiresLabel={trialExpiresLabel}>
      {children}
    </SmartGuardTourModuleShell>
  );
}
