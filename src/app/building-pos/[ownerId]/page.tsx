import { notFound } from "next/navigation";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { BuildingPosPortalClient } from "@/systems/building-pos/components/BuildingPosPortalClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function BuildingPosPublicPortalPage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const { t } = await searchParams;

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, BUILDING_POS_MODULE_SLUG);
  const trialSessionId = t?.trim() || scope.trialSessionId;

  return <BuildingPosPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
