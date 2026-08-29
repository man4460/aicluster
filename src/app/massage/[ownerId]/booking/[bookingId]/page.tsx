import { notFound } from "next/navigation";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import { MassagePortalBookingClient } from "@/systems/massage/components/MassagePortalBookingClient";

type Props = {
  params: Promise<{ ownerId: string; bookingId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
};

export default async function MassagePublicBookingPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId, bookingId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";
  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");
  const bookingIdNum = Number(bookingId);

  if (!ownerId || ownerId.length < 10 || !Number.isFinite(bookingIdNum) || bookingIdNum < 1) {
    notFound();
  }
  if (phone.length < 4) notFound();

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(ownerId, sp.t);

  return (
    <MassagePortalBookingClient
      ownerId={ownerId}
      bookingId={String(bookingIdNum)}
      phone={phone}
      trialSessionId={trialSessionId}
    />
  );
}
