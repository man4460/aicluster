import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { GeneralStorePosShell } from "@/systems/general-store-pos/components/GeneralStorePosShell";
import { requireGeneralStorePosSection } from "@/systems/general-store-pos/lib/guard";

export default async function GeneralStorePosLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireGeneralStorePosSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[general-store-pos layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูล POS ร้านทั่วไปไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GeneralStorePosShell>{children}</GeneralStorePosShell>
    </div>
  );
}
