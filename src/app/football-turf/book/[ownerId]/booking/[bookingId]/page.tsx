import { notFound } from "next/navigation";
import { FOOTBALL_TURF_MODULE_SLUG } from "@/lib/modules/config";
import { isFootballTurfPortalOpenForOwner } from "@/lib/football-turf/portal-access";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { FootballTurfPortalBookingClient } from "@/systems/football-turf/FootballTurfPortalBookingClient";

type Props = {
  params: Promise<{ ownerId: string; bookingId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
};

export default async function FootballTurfPublicBookingPage({ params, searchParams }: Props) {
  const { ownerId, bookingId } = await params;
  const sp = await searchParams;
  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");
  const bookingIdNum = Number(bookingId);

  if (!ownerId || ownerId.length < 10 || !Number.isFinite(bookingIdNum) || bookingIdNum < 1) {
    notFound();
  }
  if (phone.length < 4) notFound();

  const open = await isFootballTurfPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, FOOTBALL_TURF_MODULE_SLUG);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;

  return (
    <FootballTurfPortalBookingClient
      ownerId={ownerId}
      bookingId={String(bookingIdNum)}
      phone={phone}
      trialSessionId={trialSessionId}
    />
  );
}
