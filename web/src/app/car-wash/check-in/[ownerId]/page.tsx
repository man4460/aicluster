import { CarWashCustomerPortalClient } from "@/systems/car-wash/CarWashCustomerPortalClient";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { notFound } from "next/navigation";

export default async function CarWashOwnerCheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
}) {
  const p = await params;
  const sp = await searchParams;
  const ownerId = p.ownerId?.trim() ?? "";
  if (!ownerId) notFound();
  const trialParam = sp.t?.trim() ?? sp.trialSessionId?.trim() ?? "";
  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(ownerId, trialParam || null);
  return <CarWashCustomerPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
