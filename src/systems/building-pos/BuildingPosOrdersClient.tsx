"use client";

import { BuildingPosStationBoardClient } from "@/systems/building-pos/BuildingPosStationBoardClient";
import { buildingPosContentStackClass } from "@/systems/building-pos/components/building-pos-ui-tokens";
import { cn } from "@/lib/cn";

/** กระดานคิวออเดอร์ในแดชบอร์ด — รับออเดอร์ · ครัวกำลังทำ · กำลังเสิร์ฟ · เสร็จแล้ว */
export function BuildingPosOrdersClient() {
  return (
    <div
      className={cn(
        buildingPosContentStackClass,
        "flex min-h-[min(70dvh,40rem)] flex-1 flex-col xl:min-h-[calc(100dvh-14rem)]",
      )}
    >
      <BuildingPosStationBoardClient mode="dashboard" role="queue" className="min-h-0 flex-1" />
    </div>
  );
}
