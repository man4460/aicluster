import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "LINE | MAWELL Buffet",
};

export default function LineIntegrationDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="📱"
      title="เชื่อมต่อ LINE"
      description="LINE OA Webhook แจ้งเตือน และเมนูลัด — วางโครง route แล้ว"
    />
  );
}
