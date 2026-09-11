import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { UsedCarShowroomModuleShell } from "@/systems/used-car-showroom/components/UsedCarShowroomModuleShell";
import { requireUsedCarShowroomSection } from "@/systems/used-car-showroom/lib/guard";
import { loadUsedCarShowroomPage } from "@/systems/used-car-showroom/lib/load-page";

export default async function UsedCarShowroomLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUsedCarShowroomSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[used-car-showroom layout] require", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลโชว์รูมรถมือสองไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let trialExpiresLabel: string | null = null;
  try {
    const trial = await getActiveTrialBanner(session.sub, USED_CAR_SHOWROOM_MODULE_SLUG);
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
    console.error("[used-car-showroom layout] trial", e);
  }

  let shopName = "โชว์รูมรถมือสอง";
  try {
    const { shop } = await loadUsedCarShowroomPage();
    shopName = shop.displayName;
  } catch (e) {
    unstable_rethrow(e);
    console.error("[used-car-showroom layout] load", e);
    return <DashboardDataLoadError message="โหลดโปรไฟล์เต็นท์ไม่สำเร็จ — ลองรีเฟรชอีกครั้ง" />;
  }

  return (
    <UsedCarShowroomModuleShell shopName={shopName} trialExpiresLabel={trialExpiresLabel}>
      {children}
    </UsedCarShowroomModuleShell>
  );
}
