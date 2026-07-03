import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getQrBarberBranding } from "@/lib/profile/qr-branding";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberQrHubClient } from "@/systems/barber/components/BarberQrHubClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default async function BarberQrHubPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const [branding, baseUrl] = await Promise.all([
    getQrBarberBranding(session.sub, scope.trialSessionId),
    getRequestBaseUrl(),
  ]);
  const shopLabel = branding.label;
  const logoUrl = branding.logoUrl;

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
