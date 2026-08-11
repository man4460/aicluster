import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getQrBarberBranding } from "@/lib/profile/qr-branding";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberDashboardHome } from "@/systems/barber/components/BarberDashboardHome";
import { BarberStaffClient } from "@/systems/barber/components/BarberStaffClient";

/** เป้าหมายของ QR พนักงาน — แท็บแดชบอร์ดเต็มชุด / แพ็กเกจ · รหัสรายวันถ้าตั้งไว้ */
export default async function BarberStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const branding = await getQrBarberBranding(session.sub, scope.trialSessionId);

  return (
    <BarberStaffClient
      shopLabel={branding.label}
      ownerId={session.sub}
      dashboard={<BarberDashboardHome />}
    />
  );
}
