import { notFound } from "next/navigation";
import { isVillagePortalOpenForOwner } from "@/lib/village/portal-access";
import { VillagePortalClient } from "@/systems/village/VillagePortalClient";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

export default async function VillagePublicPortalPage({
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
  const open = await isVillagePortalOpenForOwner(ownerId);
  if (!open) notFound();
  const scope = await getVillageDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  return <VillagePortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
