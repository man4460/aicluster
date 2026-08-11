import { notFound } from "next/navigation";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { resolvePublicBarberTrialSessionId } from "@/lib/barber/public-trial-scope";
import { BarberPortalBookingClient } from "@/systems/barber/components/BarberPortalBookingClient";

type Props = {
  params: Promise<{ ownerId: string; bookingId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
};

export default async function BarberPublicBookingPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId, bookingId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";
  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");
  const bookingIdNum = Number(bookingId);

  if (!ownerId || ownerId.length < 10 || !Number.isFinite(bookingIdNum) || bookingIdNum < 1) {
    notFound();
  }
  if (phone.length < 4) notFound();

  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const { trialSessionId } = await resolvePublicBarberTrialSessionId(ownerId, sp.t);

  return (
    <BarberPortalBookingClient
      ownerId={ownerId}
      bookingId={String(bookingIdNum)}
      phone={phone}
      trialSessionId={trialSessionId}
    />
  );
}
