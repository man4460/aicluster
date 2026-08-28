"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { DormDashboardRoomGrid } from "@/systems/dormitory/components/DormDashboardRoomGrid";
import { DormStatCard } from "@/systems/dormitory/components/DormStatCard";
import type { RoomBillingUiStatus } from "@/systems/dormitory/lib/compute";
import { dormMainPaddingBottomClass, dormNavActiveClass, dormNavIdleClass } from "@/systems/dormitory/lib/ui-tokens";

type StaffView = "dashboard" | "rooms";

type OverviewRoom = {
  id: number;
  roomNumber: string;
  floor: number;
  roomType: string;
  basePrice: number;
  occupancyLabel: string;
  billingStatus: RoomBillingUiStatus;
  showOverdueDot: boolean;
};

export function DormStaffClient({
  ownerId,
  trialSessionId,
  staffKey,
}: {
  ownerId: string;
  trialSessionId: string;
  staffKey: string;
}) {
  const staffQs = useMemo(
    () => new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey }).toString(),
    [ownerId, trialSessionId, staffKey],
  );

  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [dormLabel, setDormLabel] = useState("หอพัก");
  const [view, setView] = useState<StaffView>("dashboard");
  const [stats, setStats] = useState({
    roomCount: 0,
    occupiedCount: 0,
    vacantCount: 0,
    overdueCount: 0,
    overdueTotalBaht: 0,
  });
  const [rooms, setRooms] = useState<OverviewRoom[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const runBootstrap = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("dormitory", ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/dorm/staff/bootstrap?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("dormitory", ownerId),
    });
    if (!r.ok) {
      setBootOk(false);
      setNeedsPin(false);
      return false;
    }
    const d = (await r.json()) as {
      ok?: boolean;
      requiresDailyPin?: boolean;
      unlocked?: boolean;
      dormLabel?: string;
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    setDormLabel(d.dormLabel?.trim() || "หอพัก");
    if (d.requiresDailyPin && d.unlocked === false) {
      setNeedsPin(true);
      setBootOk(true);
      return false;
    }
    setNeedsPin(false);
    setBootOk(true);
    return true;
  }, [ownerId, trialSessionId, staffKey]);

  const loadOverview = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("dormitory", ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/dorm/staff/overview?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("dormitory", ownerId),
    });
    if (!r.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
    const d = (await r.json()) as {
      stats: typeof stats;
      rooms: OverviewRoom[];
    };
    setStats(d.stats);
    setRooms(d.rooms);
  }, [ownerId, trialSessionId, staffKey]);

  useEffect(() => {
    void runBootstrap().catch(() => setBootOk(false));
  }, [runBootstrap]);

  useEffect(() => {
    if (!bootOk || needsPin) return;
    void loadOverview().catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"));
  }, [bootOk, needsPin, loadOverview]);

  const tabBtn = (active: boolean) =>
    cn(
      "min-h-[44px] flex-1 rounded-2xl px-2 py-2 text-xs font-black sm:text-sm",
      active ? cn(dormNavActiveClass, "ring-1 ring-white/55") : cn("bg-white/50 ring-1 ring-white/60", dormNavIdleClass),
    );

  if (bootOk === false) {
    return (
      <div className={cn(shopQrTemplatePageBgClass, "flex min-h-dvh items-center justify-center p-6")}>
        <p className="text-center text-sm font-bold text-rose-700">ลิงก์ไม่ถูกต้องหรือถูกยกเลิก</p>
      </div>
    );
  }

  if (bootOk === null) {
    return <div className={cn(shopQrTemplatePageBgClass, "min-h-dvh animate-pulse")} aria-busy />;
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="dormitory"
        ownerId={ownerId}
        shopLabel={dormLabel}
        unlockApiPath="/api/dorm/staff/unlock"
        staffQuery={staffQs}
        onUnlocked={() => {
          setNeedsPin(false);
          void runBootstrap();
        }}
      />
    );
  }

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
    <div className={cn(shopQrTemplatePageBgClass, "min-h-dvh", dormMainPaddingBottomClass)}>
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
        <header className="mb-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#5b61ff]">พนักงานหอพัก</p>
          <h1 className="mt-1 text-xl font-black text-[#1e1b4b] sm:text-2xl">{dormLabel}</h1>
        </header>

        <nav className="mb-4 flex gap-2" aria-label="เมนูพนักงาน">
          <button type="button" className={tabBtn(view === "dashboard")} onClick={() => setView("dashboard")}>
            ภาพรวม
          </button>
          <button type="button" className={tabBtn(view === "rooms")} onClick={() => setView("rooms")}>
            จัดการห้อง
          </button>
        </nav>

        {loadErr ? <p className="mb-3 text-sm font-semibold text-rose-600">{loadErr}</p> : null}

        {view === "dashboard" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DormStatCard title="ห้องทั้งหมด" value={stats.roomCount} tone="slate" />
              <DormStatCard title="มีผู้พัก" value={stats.occupiedCount} tone="blue" subtitle={stats.vacantCount > 0 ? `ว่าง ${stats.vacantCount}` : undefined} />
              <DormStatCard title="ค้างชำระ" value={stats.overdueCount} tone={stats.overdueCount > 0 ? "rose" : "green"} />
              <DormStatCard title="ยอดค้าง" value={stats.overdueTotalBaht.toLocaleString("th-TH")} tone="violet" subtitle="บาท" />
            </div>
            <DormDashboardRoomGrid rooms={gridRooms} staffMode />
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((r) => (
              <div
                key={r.id}
                className="rounded-[1.25rem] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-black text-[#1e1b4b]">ห้อง {r.roomNumber}</p>
                    <p className="text-xs font-semibold text-[#66638c]">
                      ชั้น {r.floor} · {r.roomType} · {r.occupancyLabel}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#4d47b6]">
                    {r.basePrice.toLocaleString("th-TH")} ฿/เดือน
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
