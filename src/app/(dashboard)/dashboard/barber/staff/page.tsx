import { redirect } from "next/navigation";
import { StaffQrLandingShell } from "@/components/qr/staff-qr-landing-shell";
import { getSession } from "@/lib/auth/session";
import { getQrBarberBranding } from "@/lib/profile/qr-branding";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";

/** เป้าหมายของ QR พนักงาน — คิว + เช็กอิน (ต้องล็อกอินร้าน) · โครงหน้าเดียวกับคาร์แคร์ staff lane */
export default async function BarberStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const branding = await getQrBarberBranding(session.sub, scope.trialSessionId);
  const shopLabel = branding.label;

  return (
    <StaffQrLandingShell variant="barber" title="ร้านตัดผมพนักงาน" shopLabel={shopLabel}>
      <div className="space-y-5">
        <BarberBookingsClient
          initialDateKey={bangkokDateKey()}
          showDashboardBackLink={false}
          staffQrLanding
        />
        <BarberCheckInClient staffQrLanding />
      </div>
    </StaffQrLandingShell>
  );
}
