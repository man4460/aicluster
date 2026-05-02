import { redirect } from "next/navigation";
import { AppPublicCheckInGlassPage } from "@/components/app-templates";
import { getSession } from "@/lib/auth/session";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";
import { BarberStaffKioskHeader } from "@/systems/barber/components/BarberStaffKioskHeader";

/** เป้าหมายของ QR พนักงาน — คิว + เช็กอิน (ต้องล็อกอินร้าน) · โทนเดียวพอร์ทัลลูกค้า */
export default async function BarberStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppPublicCheckInGlassPage className="flex min-h-[100dvh] flex-1 flex-col">
      <div className="relative mx-auto w-full max-w-md flex-1 space-y-5">
        <BarberStaffKioskHeader />
        <BarberBookingsClient initialDateKey={bangkokDateKey()} showDashboardBackLink={false} />
        <BarberCheckInClient />
      </div>
    </AppPublicCheckInGlassPage>
  );
}
