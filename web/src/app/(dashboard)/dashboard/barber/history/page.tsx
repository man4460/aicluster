import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { BarberHistoryClient } from "@/systems/barber/components/BarberHistoryClient";

export default function BarberHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ประวัติการใช้งาน"
        description="เลือกเดือน/ปี (เวลาไทย) ดูสรุปรวม — กรองเบอร์หรือชื่อได้"
        action={
          <Link href="/dashboard/barber" className="text-sm font-medium text-[#0000BF] hover:underline">
            ← แดชบอร์ด
          </Link>
        }
      />
      <BarberHistoryClient />
    </div>
  );
}
