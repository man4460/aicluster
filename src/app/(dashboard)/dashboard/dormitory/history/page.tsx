import { PageHeader } from "@/components/ui/page-container";
import { DormPaymentHistoryClient } from "@/systems/dormitory/components/DormPaymentHistoryClient";

export default function DormitoryHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="รายการประวัติ"
        description="ประวัติการชำระเงินรายคนตามบิลห้อง — แก้ไขหรือลบรายการได้เมื่อจำเป็น"
      />
      <DormPaymentHistoryClient />
    </div>
  );
}
