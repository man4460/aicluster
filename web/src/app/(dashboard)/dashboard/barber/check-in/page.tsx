import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";

export default function BarberCheckInPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="เช็คอินลูกค้า"
        description="ค้นหาเบอร์ — หักครั้งแพ็กหรือบันทึกเงินสด"
        action={
          <Link href="/dashboard/barber" className="text-sm font-medium text-[#0000BF] hover:underline">
            ← แดชบอร์ด
          </Link>
        }
      />
      <BarberCheckInClient />
    </div>
  );
}
