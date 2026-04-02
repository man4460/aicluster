import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "ซักรีด | MAWELL Buffet",
};

export default function LaundryDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="🧺"
      title="ระบบซักรีด"
      description="รับงาน แท็กผ้า สถานะซัก และคิดค่าบริการ — วางโครง route แล้ว"
    />
  );
}
