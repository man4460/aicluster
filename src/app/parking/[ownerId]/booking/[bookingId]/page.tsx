import { notFound } from "next/navigation";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { ParkingPortalBookingClient } from "@/systems/parking/components/ParkingPortalBookingClient";

export default async function ParkingPublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string; bookingId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
}) {
  const { ownerId, bookingId } = await params;
  const sp = await searchParams;
  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");
  if (!ownerId || ownerId.length < 10 || !/^\d+$/.test(bookingId) || phone.length < 4) notFound();
  if (!(await isParkingPortalOpenForOwner(ownerId))) notFound();
  const scope = await resolveDataScopeBySlug(ownerId, PARKING_MODULE_SLUG);
  return <ParkingPortalBookingClient ownerId={ownerId} bookingId={bookingId} phone={phone} trialSessionId={sp.t?.trim() || scope.trialSessionId} />;
}
