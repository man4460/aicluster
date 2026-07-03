import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getQrMassageBranding } from "@/lib/profile/qr-branding";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { MassageQrHubClient } from "@/systems/massage/components/MassageQrHubClient";
import { massagePageStackClass } from "@/systems/massage/components/massage-ui-tokens";

export default async function MassageQrHubPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getMassageDataScope(session.sub);
  const [branding, baseUrl] = await Promise.all([
    getQrMassageBranding(session.sub, scope.trialSessionId),
    getRequestBaseUrl(),
  ]);
  const shopLabel = branding.label;
  const logoUrl = branding.logoUrl;

  return (
    <div className={massagePageStackClass}>
      <MassageQrHubClient
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
