import { notFound } from "next/navigation";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { CarWashPortalBookingClient } from "@/systems/car-wash/CarWashPortalBookingClient";

type Props = {
  params: Promise<{ ownerId: string; bookingId: string }>;
  searchParams: Promise<{ t?: string; phone?: string; p?: string }>;
};

export default async function CarWashPublicBookingPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId, bookingId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";
  const phone = (sp.phone ?? sp.p ?? "").replace(/\D/g, "");
  const bookingIdNum = Number(bookingId);

  if (!ownerId || ownerId.length < 10 || !Number.isFinite(bookingIdNum) || bookingIdNum < 1) {
    notFound();
  }
  if (phone.length < 4) notFound();

  const open = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(ownerId, sp.t);

  return (
    <CarWashPortalBookingClient
      ownerId={ownerId}
      bookingId={String(bookingIdNum)}
      phone={phone}
      trialSessionId={trialSessionId}
    />
  );
}
