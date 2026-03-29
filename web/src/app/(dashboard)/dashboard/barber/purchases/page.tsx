import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { BarberPurchasesClient } from "@/systems/barber/components/BarberPurchasesClient";

export default function BarberPurchasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ผู้ซื้อแพ็กเกจ"
        description="รายการสมาชิกแพ็กทั้งหมด — ลูกค้า แพ็กที่ซื้อ วันที่ และช่างที่บันทึกการขาย"
        action={
          <Link href="/dashboard/barber" className="text-sm font-medium text-[#0000BF] hover:underline">
            ← แดชบอร์ด
          </Link>
        }
      />
      <BarberPurchasesClient />
    </div>
  );
}
