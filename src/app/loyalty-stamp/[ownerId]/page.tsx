import { notFound } from "next/navigation";
import { isLoyaltyStampPortalOpenForOwner } from "@/lib/loyalty-stamp/portal-access";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { LoyaltyStampPortalClient } from "@/systems/loyalty-stamp/components/LoyaltyStampPortalClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function LoyaltyStampPublicCardPage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const { t } = await searchParams;

  if (!ownerId || ownerId.length < 10) notFound();

  const open = await isLoyaltyStampPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await resolveDataScopeBySlug(ownerId, LOYALTY_STAMP_MODULE_SLUG);
  const trialSessionId = t?.trim() || scope.trialSessionId;

  return <LoyaltyStampPortalClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
