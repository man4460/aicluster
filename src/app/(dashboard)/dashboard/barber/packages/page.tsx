import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { BarberPackagesClient } from "@/systems/barber/components/BarberPackagesClient";

export default function BarberPackagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="แพ็กเกจ & โปรโมชั่น"
        description="สร้าง แก้ไข และลบแพ็กเกจ — ลูกค้าซื้อแพ็กได้จากหน้าเช็คอิน"
        action={
          <Link href="/dashboard/barber" className="text-sm font-medium text-[#0000BF] hover:underline">
            ← แดชบอร์ด
          </Link>
        }
      />
      <BarberPackagesClient />
    </div>
  );
}
