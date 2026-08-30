import { notFound } from "next/navigation";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { ParkingPortalClient } from "@/systems/parking/components/ParkingPortalClient";

export default async function ParkingPublicPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { ownerId } = await params;
  const { t } = await searchParams;
  if (!ownerId || ownerId.length < 10 || !(await isParkingPortalOpenForOwner(ownerId))) notFound();
  const scope = await resolveDataScopeBySlug(ownerId, PARKING_MODULE_SLUG);
  return <ParkingPortalClient ownerId={ownerId} trialSessionId={t?.trim() || scope.trialSessionId} />;
}
