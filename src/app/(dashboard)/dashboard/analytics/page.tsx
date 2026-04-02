import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "วิเคราะห์ | MAWELL Buffet",
};

export default function AnalyticsDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="📊"
      title="วิเคราะห์และรายงาน"
      description="แดชบอร์ดสรุป KPI รายได้ การใช้งานโมดูล และรายงานเชิงลึก — วางโครง route แล้ว"
    />
  );
}
