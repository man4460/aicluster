import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { MassageQrHubClient } from "@/systems/massage/components/MassageQrHubClient";
import { massagePageStackClass } from "@/systems/massage/components/massage-ui-tokens";

export default async function MassageQrHubPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getMassageDataScope(session.sub);
  const [profile, baseUrl] = await Promise.all([
    getBusinessProfile(session.sub, { massageTrialSessionId: scope.trialSessionId }),
    getRequestBaseUrl(),
  ]);
  const shopLabel = profile?.name?.trim() || "ร้านนวด";
  const logoUrl = profile?.logoUrl?.trim() || null;

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
