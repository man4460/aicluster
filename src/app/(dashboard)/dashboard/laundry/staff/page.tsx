import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { LaundryDashboard } from "@/systems/laundry/LaundryDashboard";

export default async function LaundryStaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [profile, baseUrl, userRow, scope] = await Promise.all([
    getBusinessProfile(session.sub),
    getRequestBaseUrl(),
    prisma.user.findUnique({
      where: { id: session.sub },
      select: { fullName: true, username: true },
    }),
    getLaundryDataScope(session.sub),
  ]);
  const recorderDisplayName = userRow?.fullName?.trim() || userRow?.username || session.username;
  return (
    <div className="space-y-6">
      <LaundryDashboard
        shopLabel={profile?.name?.trim() || "ระบบซักผ้า"}
        logoUrl={profile?.logoUrl?.trim() || null}
        baseUrl={baseUrl}
        recorderDisplayName={recorderDisplayName}
        trialSessionId={scope.trialSessionId}
        isTrialSandbox={scope.isTrialSandbox}
        layoutVariant="staff_lane"
      />
    </div>
  );
}
