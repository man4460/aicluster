import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getQrMassageBranding } from "@/lib/profile/qr-branding";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { MassageDashboardHome } from "@/systems/massage/components/MassageDashboardHome";
import { MassageStaffClient } from "@/systems/massage/components/MassageStaffClient";

/** เป้าหมายของ QR พนักงาน — เมนูแดชบอร์ดเท่านั้น (ภาพรวม · คิว · เช็กอิน) · รหัสรายวันถ้าตั้งไว้ */
export default async function MassageStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getMassageDataScope(session.sub);
  const branding = await getQrMassageBranding(session.sub, scope.trialSessionId);

  return (
    <MassageStaffClient
      shopLabel={branding.label}
      ownerId={session.sub}
      dashboard={<MassageDashboardHome staffLane />}
    />
  );
}
