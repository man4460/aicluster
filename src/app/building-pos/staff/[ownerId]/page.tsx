import { notFound } from "next/navigation";
import { BuildingPosStaffClient } from "@/systems/building-pos/BuildingPosStaffClient";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";

export default async function BuildingPosStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; k?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  const staffKey = sp.k?.trim() ?? "";
  if (!ownerId || !staffKey) notFound();
  const trialParam = sp.t?.trim() ?? "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);
  return <BuildingPosStaffClient ownerId={ownerId} trialSessionId={trialSessionId} staffKey={staffKey} />;
}
