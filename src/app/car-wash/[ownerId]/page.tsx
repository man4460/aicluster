import { notFound } from "next/navigation";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { CarWashBookingPortalClient } from "@/systems/car-wash/CarWashBookingPortalClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
};

export default async function CarWashPublicPortalPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const trialParam = sp.t?.trim() ?? sp.trialSessionId?.trim() ?? "";
  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(ownerId, trialParam || null);

  return <CarWashBookingPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
