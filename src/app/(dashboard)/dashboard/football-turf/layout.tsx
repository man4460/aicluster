import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { FootballTurfShell } from "@/systems/football-turf/components/FootballTurfShell";
import { requireFootballTurfSection } from "@/systems/football-turf/lib/guard";

export default async function FootballTurfLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireFootballTurfSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[football-turf layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลสนามฟุตบอลไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FootballTurfShell>{children}</FootballTurfShell>
    </div>
  );
}
