import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "สต็อก | MAWELL Buffet",
};

export default function InventoryDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="📦"
      title="ระบบคลังสินค้า"
      description="รับ-จ่าย สต็อก หมวดหมู่ และใบโอน — วางโครง route แล้ว (แยกจากโมดูลกลุ่ม 2 ในแพ็กเกจ)"
    />
  );
}
