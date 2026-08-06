import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import { DrinkPosStationPortalClient } from "@/systems/drink-pos/components/DrinkPosStationPortalClient";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

export const metadata: Metadata = {
  title: "แผนกทำ | POS เครื่องดื่ม",
};

export default async function DrinkPosKitchenStationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { ownerId } = await params;
  const sp = await searchParams;
  if (!ownerId || ownerId.length < 10) notFound();

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) notFound();

  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId = sp.t?.trim() || scope.trialSessionId;
  const profile = await ensureDrinkPosShopProfile(prisma, ownerId, trialSessionId);
  const shopName = profile.displayName?.trim() || "ร้านเครื่องดื่ม";

  return (
    <DrinkPosStationPortalClient
      ownerId={ownerId}
      role="kitchen"
      trialParam={sp.t?.trim() || null}
      shopName={shopName}
    />
  );
}
