"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { DormDashboardRoomGrid } from "@/systems/dormitory/components/DormDashboardRoomGrid";
import { DormEmptyDashed, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import {
  DormOverdueDashboardPanel,
  type DormOverdueDashboardRow,
} from "@/systems/dormitory/components/DormOverdueDashboardPanel";
import { DormStatCard } from "@/systems/dormitory/components/DormStatCard";
import type { RoomBillingUiStatus } from "@/systems/dormitory/lib/compute";
import { useDormitoryStaffAuth } from "@/systems/dormitory/lib/staff-api-fetch";

type OverviewRoom = {
  id: number;
  roomNumber: string;
  floor: number;
  roomType: string;
  occupancyLabel: string;
  billingStatus: RoomBillingUiStatus;
  showOverdueDot: boolean;
};

export function DormStaffDashboardClient({
  refreshNonce,
  onOpenManage,
  onOpenRoom,
}: {
  refreshNonce: number;
  onOpenManage?: () => void;
  onOpenRoom?: (roomId: number, opts?: { month?: string; section?: string }) => void;
}) {
  const staff = useDormitoryStaffAuth();
  const [stats, setStats] = useState({
    roomCount: 0,
    occupiedCount: 0,
    vacantCount: 0,
    overdueCount: 0,
    overdueTotalBaht: 0,
  });
  const [rooms, setRooms] = useState<OverviewRoom[]>([]);
  const [overdueRows, setOverdueRows] = useState<DormOverdueDashboardRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const handleRoomOpen = useCallback(
    (roomId: number, opts?: { month?: string; section?: string }) => {
      onOpenRoom?.(roomId, opts);
    },
    [onOpenRoom],
  );

  const loadOverview = useCallback(async () => {
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
    const d = (await r.json()) as {
      stats: typeof stats;
      rooms: OverviewRoom[];
      overdueRows: DormOverdueDashboardRow[];
    };
    setStats(d.stats);
    setRooms(d.rooms);
    setOverdueRows(d.overdueRows ?? []);
  }, [staff]);

  useEffect(() => {
    void loadOverview().catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
  }, [loadOverview, refreshNonce]);

  const gridRooms = rooms.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    floor: r.floor,
    roomType: r.roomType,
    occupancyLabel: r.occupancyLabel,
    billingStatus: r.billingStatus,
    showOverdueDot: r.showOverdueDot,
  }));

  return (
    <div className="space-y-4">
      {loadErr ? <p className="text-sm font-semibold text-rose-600">{loadErr}</p> : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DormStatCard title="ห้องทั้งหมด" value={stats.roomCount} tone="slate" />
        <DormStatCard
          title="มีผู้พัก"
          value={stats.occupiedCount}
          tone="blue"
          subtitle={stats.vacantCount > 0 ? `ว่าง ${stats.vacantCount} ห้อง` : undefined}
        />
        <DormStatCard
          title="ค้างชำระงวดก่อน"
          value={stats.overdueCount}
          tone={stats.overdueCount > 0 ? "rose" : "green"}
          subtitle={stats.overdueCount > 0 ? "รายการที่ต้องติดตาม" : "ไม่มีค้างจากงวดเก่า"}
        />
        <DormStatCard
          title="รายการค้างรวม"
          value={stats.overdueTotalBaht.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
          tone="violet"
          subtitle="บาท (ประมาณ)"
        />
      </div>

      <DormPanelCard
        title="ผังห้องพัก"
        description="คลิกห้องเพื่อมิเตอร์ แบ่งบิล และแนบสลิป — สถานะการเงินอิงงวดเดือนปัจจุบัน (เวลาไทย)"
        action={
          onOpenManage ? (
            <button
              type="button"
              onClick={onOpenManage}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-bold text-white shadow-sm sm:w-auto"
            >
              การจัดการ
            </button>
          ) : undefined
        }
      >
        {rooms.length === 0 ? (
          <DormEmptyDashed>ยังไม่มีห้อง</DormEmptyDashed>
        ) : (
          <DormDashboardRoomGrid rooms={gridRooms} onRoomClick={onOpenRoom ? handleRoomOpen : undefined} />
        )}
      </DormPanelCard>

      <DormPanelCard
        title="ค้างชำระ (งวดก่อน)"
        description="งวดก่อนเดือนปัจจุบัน (ไทย) — เลือกแถบเดือน · แยกรายคน · แตะ «ดำเนินการ»เพื่อเปิดห้อง"
      >
        <DormOverdueDashboardPanel
          rows={overdueRows}
          onRoomAction={
            onOpenRoom
              ? (roomId, month) => handleRoomOpen(Number(roomId), { month })
              : undefined
          }
          hideFinanceLink
        />
      </DormPanelCard>
    </div>
  );
}
