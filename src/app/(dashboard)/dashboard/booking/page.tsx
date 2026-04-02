import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "จองคิว | MAWELL Buffet",
};

export default function BookingDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="📅"
      title="ระบบจองคิว"
      description="จัดการคิว ปฏิทิน การนัดหมาย และแจ้งเตือน — วางโครง route แล้ว"
    />
  );
}
