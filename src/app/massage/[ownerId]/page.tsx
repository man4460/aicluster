import { notFound } from "next/navigation";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { MassageBookingPortalClient } from "@/systems/massage/components/MassageBookingPortalClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; trialSessionId?: string }>;
};

export default async function MassagePublicPortalPage({ params, searchParams }: Props) {
  const { ownerId: rawOwnerId } = await params;
  const sp = await searchParams;
  const ownerId = rawOwnerId?.trim() ?? "";

  if (!ownerId || ownerId.length < 10) notFound();
  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, MASSAGE_MODULE_SLUG);
  const trialSessionId = sp.t?.trim() || sp.trialSessionId?.trim() || scope.trialSessionId;

  return <MassageBookingPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
