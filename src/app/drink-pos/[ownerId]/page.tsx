import { notFound } from "next/navigation";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { DrinkPosCustomerOrderClient } from "@/systems/drink-pos/DrinkPosCustomerOrderClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function DrinkPosPublicOrderPage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const { t } = await searchParams;

  if (!ownerId || ownerId.length < 10) notFound();

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId = t?.trim() || scope.trialSessionId;

  return <DrinkPosCustomerOrderClient ownerId={ownerId} trialSessionId={trialSessionId} />;
}
