import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getQrLaundryBranding } from "@/lib/profile/qr-branding";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { LaundryDashboard } from "@/systems/laundry/LaundryDashboard";
import { LaundryStaffClient } from "@/systems/laundry/components/LaundryStaffClient";

/** เป้าหมายของ QR พนักงาน — เมนูแดชบอร์ดย่อยเท่านั้น (ภาพรวม · ออเดอร์ · คิวสั่งออนไลน์) · รหัสรายวันถ้าตั้งไว้ */
export default async function LaundryStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getLaundryDataScope(session.sub);
  const [branding, baseUrl, userRow] = await Promise.all([
    getQrLaundryBranding(session.sub, scope.trialSessionId),
    getRequestBaseUrl(),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { fullName: true, username: true },
    }),
  ]);
  const recorderDisplayName = userRow?.fullName?.trim() || userRow?.username || session.username;
  return (
    <LaundryStaffClient
      shopLabel={branding.label}
      ownerId={session.sub}
      dashboard={
        <LaundryDashboard
          shopLabel={branding.label}
          logoUrl={branding.logoUrl}
          baseUrl={baseUrl}
          ownerUserId={session.sub}
          recorderDisplayName={recorderDisplayName}
          trialSessionId={scope.trialSessionId}
          isTrialSandbox={scope.isTrialSandbox}
          layoutVariant="staff_lane"
        />
      }
    />
  );
}
