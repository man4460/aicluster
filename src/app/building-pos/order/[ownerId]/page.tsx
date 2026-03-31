import { notFound } from "next/navigation";
import { BuildingPosCustomerOrderClient } from "@/systems/building-pos/BuildingPosCustomerOrderClient";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";

export default async function BuildingPosOwnerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string; table?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  if (!ownerId) notFound();
  const trialParam = sp.t?.trim() ?? sp.trialSessionId?.trim() ?? "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);
  const initialTableNo = sp.table?.trim() ?? "";
  return (
    <BuildingPosCustomerOrderClient ownerId={ownerId} trialSessionId={trialSessionId} initialTableNo={initialTableNo} />
  );
}
