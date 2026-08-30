"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { readStoredStaffDailyUnlock, staffDailyUnlockHeaders } from "@/lib/modules/staff-daily-pin";
import { cn } from "@/lib/cn";
import { ParkingBookingsClient } from "@/systems/parking/components/ParkingBookingsClient";
import { ParkingCheckoutClient } from "@/systems/parking/components/ParkingCheckoutClient";
import {
  ParkingStaffCheckInClient,
  type ParkingCheckInLotRow,
  type ParkingCheckInSpotRow,
} from "@/systems/parking/components/ParkingStaffCheckInClient";
import { ParkingStaffApiProvider } from "@/systems/parking/lib/staff-api-fetch";
import { parkingStatCardClass } from "@/systems/parking/parking-ui-tokens";

type StaffView = "overview" | "checkin" | "checkout" | "booking";
type Bootstrap = {
  ok?: boolean;
  requiresDailyPin?: boolean;
  unlocked?: boolean;
  shopLabel?: string;
  logoUrl?: string | null;
  stats?: { spots: number; active: number; available: number };
  lots?: ParkingCheckInLotRow[];
  spots?: ParkingCheckInSpotRow[];
};

const tabs: { key: StaffView; label: string }[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "checkin", label: "เช็คอิน" },
  { key: "checkout", label: "เช็คเอาต์" },
  { key: "booking", label: "การจอง" },
];

export function ParkingStaffClient({
  ownerId,
  trialSessionId,
  staffKey,
}: {
  ownerId: string;
  trialSessionId: string;
  staffKey: string;
}) {
  const staffAuth = useMemo(() => ({ ownerId, trialSessionId, k: staffKey }), [ownerId, trialSessionId, staffKey]);
  const staffQuery = useMemo(
    () => new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey }).toString(),
    [ownerId, trialSessionId, staffKey],
  );
  const [data, setData] = useState<Bootstrap | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [view, setView] = useState<StaffView>("overview");

  const bootstrap = useCallback(async () => {
    const query = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("parking", ownerId);
    if (unlock) query.set("du", unlock);
    const response = await fetch(`/api/parking/staff/bootstrap?${query}`, {
      cache: "no-store",
      credentials: "omit",
      headers: staffDailyUnlockHeaders("parking", ownerId),
    });
    if (!response.ok) {
      setInvalid(true);
      return false;
    }
    const next = (await response.json()) as Bootstrap;
    if (!next.ok) {
      setInvalid(true);
      return false;
    }
    setInvalid(false);
    setData(next);
    return !(next.requiresDailyPin && next.unlocked === false);
  }, [ownerId, staffKey, trialSessionId]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  async function refresh() {
    setRefreshing(true);
    try {
      if (await bootstrap()) setRefreshNonce((value) => value + 1);
    } finally {
      setRefreshing(false);
    }
  }

  if (invalid) {
    return (
      <div className={cn(shopQrTemplatePageBgClass, "fixed inset-0 z-[250] flex items-center justify-center p-6")}>
        <p className="rounded-2xl bg-white/85 p-6 text-lg font-black text-[#1e1b4b]">ลิงก์ไม่ถูกต้องหรือถูกยกเลิก</p>
      </div>
    );
  }
  if (!data) {
    return <div className={cn(shopQrTemplatePageBgClass, "fixed inset-0 z-[250] flex items-center justify-center")}>กำลังตรวจสอบลิงก์…</div>;
  }
  if (data.requiresDailyPin && data.unlocked === false) {
    return (
      <div className="fixed inset-0 z-[250]">
        <StaffDailyPinGate
          module="parking"
          ownerId={ownerId}
          shopLabel={data.shopLabel || "ลานจอดรถ"}
          unlockApiPath="/api/parking/staff/unlock"
          staffQuery={staffQuery}
          onUnlocked={() => void bootstrap().then((ok) => ok && setRefreshNonce((value) => value + 1))}
        />
      </div>
    );
  }

  const tabBar = (
    <div className="grid w-full grid-cols-4 gap-1.5" role="tablist" aria-label="เมนูพนักงาน">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={view === tab.key}
          onClick={() => setView(tab.key)}
          className={cn(
            "min-h-[44px] rounded-xl px-1.5 text-[11px] font-black transition sm:px-3 sm:text-sm",
            view === tab.key ? "bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] text-white shadow-md" : "bg-white/70 text-[#5f5a8a]",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <ParkingStaffApiProvider staffAuth={staffAuth}>
      <div className={cn(shopQrTemplatePageBgClass, "fixed inset-0 z-[250] h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/75 shadow-2xl backdrop-blur-2xl sm:rounded-[2rem]">
          <header className="shrink-0 border-b border-white/70 bg-white/75 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">พนักงาน · ลานจอดรถ</p>
                <h1 className="truncate text-lg font-black text-[#1e1b4b] sm:text-xl">{data.shopLabel || "ลานจอดรถ"}</h1>
              </div>
              <div className="hidden min-w-[420px] lg:block">{tabBar}</div>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={refreshing}
                aria-label="รีเฟรชข้อมูล"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-white/70 bg-white/80 px-2 text-xs font-black text-[#4d47b6]"
              >
                {refreshing ? "…" : "รีเฟรช"}
              </button>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-2 py-3 pb-24 sm:px-3 lg:pb-3">
            {view === "overview" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className={parkingStatCardClass("indigo")}><p className="text-xs font-bold">ช่องทั้งหมด</p><p className="mt-2 text-2xl font-black">{data.stats?.spots ?? 0}</p></div>
                  <div className={parkingStatCardClass("amber")}><p className="text-xs font-bold">กำลังจอด</p><p className="mt-2 text-2xl font-black">{data.stats?.active ?? 0}</p></div>
                  <div className={cn(parkingStatCardClass("emerald"), "col-span-2 sm:col-span-1")}><p className="text-xs font-bold">ว่าง</p><p className="mt-2 text-2xl font-black">{data.stats?.available ?? 0}</p></div>
                </div>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {(data.spots ?? []).map((spot) => (
                    <li key={spot.id} className="rounded-2xl border border-white/70 bg-white/65 p-3 text-center">
                      <p className="font-black text-[#1e1b4b]">{spot.spotCode}</p>
                      <p className={cn("mt-1 text-xs font-bold", spot.activeSession ? "text-amber-700" : "text-emerald-700")}>
                        {spot.activeSession ? spot.activeSession.licensePlate : "ว่าง"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {view === "checkin" ? <ParkingStaffCheckInClient lots={data.lots ?? []} spots={data.spots ?? []} /> : null}
            {view === "checkout" ? <ParkingCheckoutClient refreshNonce={refreshNonce} /> : null}
            {view === "booking" ? <ParkingBookingsClient /> : null}
          </main>
          <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 rounded-[2rem] border border-white/60 bg-white/80 p-2 shadow-xl backdrop-blur-xl lg:hidden">
            {tabBar}
          </div>
        </div>
      </div>
    </ParkingStaffApiProvider>
  );
}
