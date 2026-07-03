import { redirect } from "next/navigation";
import { StaffQrLandingShell } from "@/components/qr/staff-qr-landing-shell";
import { getSession } from "@/lib/auth/session";
import { getQrMassageBranding } from "@/lib/profile/qr-branding";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { MassageBookingsClient } from "@/systems/massage/components/MassageBookingsClient";
import { MassageCheckInClient } from "@/systems/massage/components/MassageCheckInClient";

/** เป้าหมายของ QR พนักงาน — คิว + เช็กอิน (ต้องล็อกอินร้าน) · โครงหน้าเดียวกับคาร์แคร์ staff lane */
export default async function MassageStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getMassageDataScope(session.sub);
  const branding = await getQrMassageBranding(session.sub, scope.trialSessionId);
  const shopLabel = branding.label;

  return (
    <StaffQrLandingShell variant="massage" title="ร้านนวดพนักงาน" shopLabel={shopLabel}>
      <div className="space-y-5">
        <MassageBookingsClient
          initialDateKey={bangkokDateKey()}
          showDashboardBackLink={false}
          staffQrLanding
        />
        <MassageCheckInClient staffQrLanding />
      </div>
    </StaffQrLandingShell>
  );
}
