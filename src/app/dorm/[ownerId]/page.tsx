import { notFound } from "next/navigation";
import { DormPortalClient } from "@/systems/dormitory/DormPortalClient";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

export default async function DormPublicPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  if (!ownerId || ownerId.length < 10) notFound();
  const scope = await getDormitoryDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return <DormPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
