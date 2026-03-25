import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { BarberStylistsClient } from "@/systems/barber/components/BarberStylistsClient";

export default function BarberStylistsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ช่างตัดผม"
        description="เพิ่มช่างในร้าน — ใช้เลือกตอนเช็คอินและบันทึกการขายแพ็กเกจ"
        action={
          <Link href="/dashboard/barber" className="text-sm font-medium text-[#0000BF] hover:underline">
            ← แดชบอร์ด
          </Link>
        }
      />
      <BarberStylistsClient />
    </div>
  );
}
