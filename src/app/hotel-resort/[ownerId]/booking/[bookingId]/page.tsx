import { notFound } from "next/navigation";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { HotelResortPortalBookingClient } from "@/systems/hotel-resort/components/HotelResortPortalBookingClient";

type Props = {
  params: Promise<{ ownerId: string; bookingId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
};

export default async function HotelResortPublicBookingPage({ params, searchParams }: Props) {
  const { ownerId, bookingId } = await params;
  const sp = await searchParams;
  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");

  if (!ownerId || ownerId.length < 10 || !bookingId || bookingId.length < 10) notFound();
  if (phone.length < 4) notFound();

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, HOTEL_RESORT_MODULE_SLUG);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;

  return (
    <HotelResortPortalBookingClient
      ownerId={ownerId}
      bookingId={bookingId}
      phone={phone}
      trialSessionId={trialSessionId}
    />
  );
}
