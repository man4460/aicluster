"use client";

import { DrinkPosOrderBoardClient } from "@/systems/drink-pos/components/DrinkPosOrderBoardClient";
import type { DrinkPosStationRole } from "@/systems/drink-pos/lib/fulfillment-status";

export function DrinkPosStationPortalClient({
  ownerId,
  role,
  trialParam,
  shopName,
}: {
  ownerId: string;
  role: DrinkPosStationRole;
  trialParam: string | null;
  shopName: string;
}) {
  return (
    <div className="h-dvh max-h-dvh overflow-hidden bg-gradient-to-b from-[#f5f3ff] via-white to-[#fdf2f8] p-1.5 sm:p-2">
      <DrinkPosOrderBoardClient
        mode="station"
        role={role}
        ownerId={ownerId}
        trialParam={trialParam}
        shopName={shopName}
        className="flex h-full min-h-0 flex-col"
      />
    </div>
  );
}
