import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-container";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

/** เป้าหมายของ QR พนักงาน — คิว + เช็กอิน (ต้องล็อกอินร้าน) */
export default async function BarberStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className={barberPageStackClass}>
      <PageHeader
        compact
        title="พนักงาน · คิวและเช็กอิน"
        description="เปิดจาก QR — ล็อกอินร้านแล้วใช้งานได้ทันที"
      />
      <BarberBookingsClient initialDateKey={bangkokDateKey()} showDashboardBackLink={false} />
      <BarberCheckInClient />
    </div>
  );
}
