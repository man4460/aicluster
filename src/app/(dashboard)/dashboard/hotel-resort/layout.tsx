import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { HotelResortShell } from "@/systems/hotel-resort/components/HotelResortShell";
import { requireHotelResortSection } from "@/systems/hotel-resort/lib/guard";

export default async function HotelResortLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireHotelResortSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[hotel-resort layout]", e);
    return <DashboardDataLoadError message="โหลดโมดูลโรงแรม / รีสอร์ทไม่สำเร็จ" />;
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HotelResortShell>{children}</HotelResortShell>
    </div>
  );
}
