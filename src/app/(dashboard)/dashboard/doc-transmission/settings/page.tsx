import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getDocTransmissionDataScope } from "@/lib/trial/module-scopes";
import { DocSettingsClient } from "@/systems/doc-transmission/components/DocSettingsClient";

export const dynamic = "force-dynamic";

export default async function DocSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDocTransmissionDataScope(session.sub);

  const setting = await prisma.docTransmissionSettings.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
    update: {},
    create: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
  });

  return (
    <DocSettingsClient
      initial={{
        orgName: setting.orgName,
        orgAddress: setting.orgAddress,
        orgPhone: setting.orgPhone,
        defaultYear: setting.defaultYear,
        ordersPrefix: setting.ordersPrefix,
        memosPrefix: setting.memosPrefix,
        incomingPrefix: setting.incomingPrefix,
        outgoingPrefix: setting.outgoingPrefix,
        circularsPrefix: setting.circularsPrefix,
        trackPrefix: setting.trackPrefix,
        publicShareEnabled: setting.publicShareEnabled,
      }}
    />
  );
}
