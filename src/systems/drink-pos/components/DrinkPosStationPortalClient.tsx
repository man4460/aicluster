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
    <div className="min-h-dvh bg-gradient-to-b from-[#f5f3ff] via-white to-[#fdf2f8] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-6xl">
        <DrinkPosOrderBoardClient
          mode="station"
          role={role}
          ownerId={ownerId}
          trialParam={trialParam}
          shopName={shopName}
        />
      </div>
    </div>
  );
}
