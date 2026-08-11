import { notFound } from "next/navigation";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { BarberBookingPortalClient } from "@/systems/barber/components/BarberBookingPortalClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
};

export default async function BarberPublicPortalPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, BARBER_MODULE_SLUG);
  const trialSessionId = sp.t?.trim() || sp.trialSessionId?.trim() || scope.trialSessionId;

  return <BarberBookingPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
