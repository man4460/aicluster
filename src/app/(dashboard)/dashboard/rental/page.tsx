import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "เช่าสื่อ | MAWELL Buffet",
};

export default function RentalDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="📀"
      title="ระบบเช่าสื่อ / อุปกรณ์"
      description="สัญญาเช่า วันคืน ค่าปรับ และคลังรายการ — วางโครง route แล้ว"
    />
  );
}
