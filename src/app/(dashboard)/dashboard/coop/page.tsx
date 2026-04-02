import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "สหกรณ์ | MAWELL Buffet",
};

export default function CoopDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="🏦"
      title="ระบบสหกรณ์"
      description="สมาชิก เงินกู้ เงินฝาก และรายงานกองทุน — วางโครง route แล้ว"
    />
  );
}
