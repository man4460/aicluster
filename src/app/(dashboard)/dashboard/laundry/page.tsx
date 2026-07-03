import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getQrLaundryBranding } from "@/lib/profile/qr-branding";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { LaundryDashboard } from "@/systems/laundry/LaundryDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รับฝากซักผ้า | MAWELL",
};

export default async function LaundryDashboardPage() {
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
    <LaundryDashboard
      shopLabel={branding.label}
      logoUrl={branding.logoUrl}
      baseUrl={baseUrl}
      ownerUserId={session.sub}
      recorderDisplayName={recorderDisplayName}
      trialSessionId={scope.trialSessionId}
      isTrialSandbox={scope.isTrialSandbox}
    />
  );
}
