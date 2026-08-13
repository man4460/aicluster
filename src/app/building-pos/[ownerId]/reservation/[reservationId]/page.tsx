import { notFound } from "next/navigation";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { BuildingPosPortalReservationClient } from "@/systems/building-pos/components/BuildingPosPortalReservationClient";

type Props = {
  params: Promise<{ ownerId: string; reservationId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
};

export default async function BuildingPosPublicReservationPage({ params, searchParams }: Props) {
  const { ownerId, reservationId } = await params;
  const sp = await searchParams;

  if (!ownerId || ownerId.length < 10 || !reservationId) notFound();
  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");
  if (phone.length < 4) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, BUILDING_POS_MODULE_SLUG);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;

  return (
    <BuildingPosPortalReservationClient
      ownerId={ownerId}
      reservationId={reservationId}
      phone={phone}
      trialSessionId={trialSessionId}
    />
  );
}
