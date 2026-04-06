import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberQrPosterClient } from "@/systems/barber/components/BarberQrPosterClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default async function BarberQrPosterPage() {
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
      <BarberQrPosterClient
        ownerId={session.sub}
        shopLabel={shopLabel}
        logoUrl={logoUrl}
        baseUrl={baseUrl}
        trialExportBlocked={scope.isTrialSandbox}
      />
    </div>
  );
}
