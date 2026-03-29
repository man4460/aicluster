import { PageHeader } from "@/components/ui/page-container";
import { HomeFinanceClient } from "@/systems/home-finance/components/HomeFinanceClient";

export default function HomeFinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="รายรับ-รายจ่ายบ้าน"
        description="บันทึกค่าน้ำค่าไฟ บิลรถ รายรับรายจ่ายทั่วไป และหมวดอื่นๆ พร้อมสรุปตามช่วงวันที่"
      />
      <HomeFinanceClient />
    </div>
  );
}
