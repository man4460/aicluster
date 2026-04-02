import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "สปา / นวด | MAWELL Buffet",
};

export default function SpaDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="🧖‍♀️"
      title="ระบบนวด / สปา"
      description="ห้อง แพ็กเกจบริการ คิว และบิล — วางโครง route แล้ว"
    />
  );
}
