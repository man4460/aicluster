import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberQrHubClient } from "@/systems/barber/components/BarberQrHubClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default async function BarberQrHubPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const [profile, baseUrl] = await Promise.all([
    getBusinessProfile(session.sub, { barberTrialSessionId: scope.trialSessionId }),
    getRequestBaseUrl(),
  ]);
  const shopLabel = profile?.name?.trim() || "ร้านตัดผม";
  const logoUrl = profile?.logoUrl?.trim() || null;

  return (
    <div className={barberPageStackClass}>
      <BarberQrHubClient
        ownerId={session.sub}
        shopLabel={shopLabel}
        logoUrl={logoUrl}
        baseUrl={baseUrl}
        trialExportBlocked={scope.isTrialSandbox}
        isTrialSandbox={scope.isTrialSandbox}
        trialSessionId={scope.trialSessionId ?? ""}
      />
    </div>
  );
}
