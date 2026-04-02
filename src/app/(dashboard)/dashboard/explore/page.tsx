import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/page-container";
import { DashboardSystemShortcutGrid } from "@/components/dashboard/DashboardSystemShortcutGrid";
import {
  DASHBOARD_LIVE_SYSTEMS,
  DASHBOARD_ROADMAP_SYSTEMS,
} from "@/lib/dashboard-system-catalog";

export const metadata: Metadata = {
  title: "แผนผังระบบ | MAWELL Buffet",
};

export default function SystemsExplorePage() {
  return (
    <PageContainer>
      <PageHeader
        title="แผนผังระบบ"
        description="ลิงก์เดียวกับหน้าแดชบอร์ด — โมดูลที่เปิดใช้งานและเส้นทางที่วางโครงไว้"
      />
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#0000BF]">
          เปิดใช้งาน / มีหน้าหลัก
        </h2>
        <DashboardSystemShortcutGrid items={DASHBOARD_LIVE_SYSTEMS} />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          วางโครง route แล้ว (รอพัฒนา)
        </h2>
        <DashboardSystemShortcutGrid items={DASHBOARD_ROADMAP_SYSTEMS} />
      </section>
    </PageContainer>
  );
}
