import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { BuildingPosStationBoardClient } from "@/systems/building-pos/BuildingPosStationBoardClient";

export const metadata: Metadata = {
  title: "แผนกครัว | POS ร้านอาหาร",
};

export default async function BuildingPosKitchenStationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { ownerId } = await params;
  const sp = await searchParams;
  if (!ownerId || ownerId.length < 10) notFound();

  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) notFound();

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-gradient-to-b from-[#f5f3ff] via-white to-[#fdf2f8] px-1.5 py-1.5 sm:px-3 sm:py-3 md:px-4 md:py-4">
      <BuildingPosStationBoardClient
        className="min-h-0 w-full flex-1"
        role="kitchen"
        ownerId={ownerId}
        trialParam={sp.t?.trim() || null}
      />
    </div>
  );
}
