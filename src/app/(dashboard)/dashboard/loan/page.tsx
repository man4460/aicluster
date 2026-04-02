import type { Metadata } from "next";
import { ModuleRoadmapPage } from "@/components/dashboard/ModuleRoadmapPage";

export const metadata: Metadata = {
  title: "สินเชื่อ | MAWELL Buffet",
};

export default function LoanDashboardPage() {
  return (
    <ModuleRoadmapPage
      emoji="💰"
      title="ระบบสินเชื่อ"
      description="สัญญาเงินกู้ งวดชำระ ดอกเบี้ย และทวงถาม — วางโครง route แล้ว"
    />
  );
}
