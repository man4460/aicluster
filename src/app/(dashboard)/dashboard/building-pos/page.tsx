import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosDashboardClient } from "@/systems/building-pos/BuildingPosDashboardClient";

async function requestBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env && (env.startsWith("http://") || env.startsWith("https://"))) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function BuildingPosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let profile: Awaited<ReturnType<typeof getBusinessProfile>> = null;
  let baseUrl = "";
  let scope: Awaited<ReturnType<typeof getBuildingPosDataScope>> = {
    trialSessionId: TRIAL_PROD_SCOPE,
    isTrialSandbox: false,
  };
  let dormPay: { paymentChannelsNote: string | null } | null = null;

  try {
    const results = await Promise.all([
      getBusinessProfile(session.sub),
      requestBaseUrl(),
      getBuildingPosDataScope(session.sub),
      prisma.dormitoryProfile.findUnique({
        where: {
          ownerUserId_trialSessionId: { ownerUserId: session.sub, trialSessionId: TRIAL_PROD_SCOPE },
        },
        select: { paymentChannelsNote: true },
      }),
    ]);
    profile = results[0];
    baseUrl = results[1];
    scope = results[2];
    dormPay = results[3];
  } catch (e) {
    console.error("[building-pos/page]", e);
  }

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <BuildingPosDashboardClient
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        isTrialSandbox={scope.isTrialSandbox}
        baseUrl={baseUrl}
        shopLabel={profile?.name?.trim() || "POS ร้านอาหาร"}
        logoUrl={profile?.logoUrl?.trim() || null}
        paymentChannelsNote={dormPay?.paymentChannelsNote?.trim() || null}
      />
    </Suspense>
  );
}
