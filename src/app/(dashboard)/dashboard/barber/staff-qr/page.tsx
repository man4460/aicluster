import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberStaffQrDashboardSection } from "@/systems/barber/components/BarberStaffQrDashboardSection";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default async function BarberStaffQrPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const [profile, baseUrl] = await Promise.all([
    getBusinessProfile(session.sub, { barberTrialSessionId: scope.trialSessionId }),
    getRequestBaseUrl(),
  ]);

  return (
    <div className={barberPageStackClass}>
      <BarberStaffQrDashboardSection
        ownerId={session.sub}
        shopLabel={profile?.name?.trim() || "ร้านตัดผม"}
        logoUrl={profile?.logoUrl?.trim() ?? null}
        baseUrl={baseUrl}
        trialExportBlocked={scope.isTrialSandbox}
        isTrialSandbox={scope.isTrialSandbox}
        trialSessionId={scope.trialSessionId}
      />
    </div>
  );
}
