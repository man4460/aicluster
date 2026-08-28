"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import {
  DormRoomManagePanel,
  type DormRoomManageRow,
} from "@/systems/dormitory/components/DormRoomManagePanel";
import { useDormitoryStaffAuth } from "@/systems/dormitory/lib/staff-api-fetch";

export function DormStaffManageClient({
  refreshNonce,
  onOpenRoom,
}: {
  refreshNonce: number;
  onOpenRoom?: (roomId: number) => void;
}) {
  const staff = useDormitoryStaffAuth();
  const [rooms, setRooms] = useState<DormRoomManageRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    if (!staff) return;
    const qs = new URLSearchParams({
      ownerId: staff.ownerId,
      t: staff.trialSessionId,
      k: staff.k,
    });
    const unlock = readStoredStaffDailyUnlock("dormitory", staff.ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/dorm/staff/overview?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("dormitory", staff.ownerId),
    });
    if (!r.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
    const d = (await r.json()) as { manageRows: DormRoomManageRow[] };
    setRooms(d.manageRows ?? []);
  }, [staff]);

  useEffect(() => {
    void loadRooms().catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
  }, [loadRooms, refreshNonce]);

  return (
    <DormPanelCard
      title="การจัดการ"
      description="จัดการห้องพัก มิเตอร์ และการชำระ"
    >
      {loadErr ? <p className="mb-3 text-sm font-semibold text-rose-600">{loadErr}</p> : null}
      <DormRoomManagePanel rooms={rooms} onRoomClick={onOpenRoom} />
    </DormPanelCard>
  );
}
