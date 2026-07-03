import { notFound } from "next/navigation";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { HotelResortPortalClient } from "@/systems/hotel-resort/components/HotelResortPortalClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function HotelResortPublicPortalPage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const { t } = await searchParams;

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, HOTEL_RESORT_MODULE_SLUG);
  const trialSessionId = t?.trim() || scope.trialSessionId;

  return <HotelResortPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
