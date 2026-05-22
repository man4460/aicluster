import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { DrinkPosShell } from "@/systems/drink-pos/components/DrinkPosShell";
import { requireDrinkPosSection } from "@/systems/drink-pos/lib/guard";

export default async function DrinkPosLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireDrinkPosSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[drink-pos layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูล POS ร้านเครื่องดื่มไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrinkPosShell>{children}</DrinkPosShell>
    </div>
  );
}
