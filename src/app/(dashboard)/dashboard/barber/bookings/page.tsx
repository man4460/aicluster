import { bangkokDateKey } from "@/lib/time/bangkok";
import { PageHeader } from "@/components/ui/page-container";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";

export default function BarberBookingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="จองคิว"
        description="ค้นหาเบอร์จากลูกค้าในระบบ ตั้งวันเวลานัด แล้วบันทึก — ดูรายการตามวัน เรียงตามเวลา — ถ้าเลยเวลาแล้วยังไม่มา ระบบแสดงสถานะให้"
      />
      <BarberBookingsClient initialDateKey={bangkokDateKey()} />
    </div>
  );
}
