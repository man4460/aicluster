"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { ParkingCheckoutButton } from "@/systems/parking/components/ParkingCheckoutButton";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingStaffCheckInForm } from "@/systems/parking/components/ParkingStaffCheckInForm";
import { parkingDashboardHref } from "@/systems/parking/parking-module-nav";
import { parkingField } from "@/systems/parking/parking-ui";
import { parkingFilterChipClass } from "@/systems/parking/parking-ui-tokens";

export type ParkingCheckInLotRow = {
  id: number;
  name: string;
  isActive: boolean;
};

export type ParkingCheckInSpotRow = {
  id: number;
  siteId: number;
  siteName: string;
  spotCode: string;
  zoneLabel: string | null;
  pricingMode: "HOURLY" | "DAILY" | "MONTHLY";
  dailyRateBaht: number | null;
  monthlyRateBaht: number | null;
  activeSession: {
    id: number;
    licensePlate: string;
    checkInAt: string;
    customerName: string | null;
    customerPhone: string | null;
    selfCheckIn: boolean;
    shuttleFrom: string | null;
    shuttleTo: string | null;
    shuttleNote: string | null;
  } | null;
};

export function ParkingStaffCheckInClient({
  lots,
  spots: initialSpots,
}: {
  lots: ParkingCheckInLotRow[];
  spots: ParkingCheckInSpotRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lotFilter, setLotFilter] = useState("");
  const [spotId, setSpotId] = useState<number | "">("");

  const activeLots = useMemo(() => lots.filter((l) => l.isActive), [lots]);

  const filteredSpots = useMemo(() => {
    if (!lotFilter) return initialSpots;
    const id = Number(lotFilter);
    return initialSpots.filter((s) => s.siteId === id);
  }, [initialSpots, lotFilter]);

  const syncSpotFromUrl = useCallback(() => {
    const raw = searchParams.get("spot");
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isInteger(parsed) && parsed > 0 && initialSpots.some((s) => s.id === parsed)) {
      setSpotId(parsed);
      const spot = initialSpots.find((s) => s.id === parsed);
      if (spot) setLotFilter(String(spot.siteId));
      return;
    }
    if (filteredSpots.length > 0) {
      setSpotId((current) =>
        typeof current === "number" && filteredSpots.some((s) => s.id === current)
          ? current
          : filteredSpots[0]!.id,
      );
    } else {
      setSpotId("");
    }
  }, [searchParams, initialSpots, filteredSpots]);

  useEffect(() => {
    syncSpotFromUrl();
  }, [syncSpotFromUrl]);

  useEffect(() => {
    if (typeof spotId !== "number") return;
    if (!filteredSpots.some((s) => s.id === spotId)) {
      setSpotId(filteredSpots[0]?.id ?? "");
    }
  }, [filteredSpots, spotId]);

  const selectedSpot = useMemo(
    () => (typeof spotId === "number" ? filteredSpots.find((s) => s.id === spotId) ?? null : null),
    [filteredSpots, spotId],
  );

  function selectLot(id: string) {
    setLotFilter(id);
    const nextSpots = id ? initialSpots.filter((s) => s.siteId === Number(id)) : initialSpots;
    const nextId = nextSpots[0]?.id;
    if (nextId) {
      setSpotId(nextId);
      router.replace(parkingDashboardHref("checkin", { spot: nextId }), { scroll: false });
    } else {
      setSpotId("");
      router.replace(parkingDashboardHref("checkin"), { scroll: false });
    }
  }

  function selectSpot(id: number) {
    setSpotId(id);
    router.replace(parkingDashboardHref("checkin", { spot: id }), { scroll: false });
  }

  if (initialSpots.length === 0) {
    return (
      <ParkingPageStack>
        <ParkingPanelCard title="เช็คอิน (พนักงาน)" description="บันทึกทะเบียนและข้อมูลลูกค้า">
          <AppEmptyState tone="glass">ยังไม่มีช่องจอด — เพิ่มได้ที่เมนูการจัดการ → ลานจอด</AppEmptyState>
        </ParkingPanelCard>
      </ParkingPageStack>
    );
  }

  const active = selectedSpot?.activeSession ?? null;

  return (
    <ParkingPageStack>
      <ParkingPanelCard title="เช็คอิน (พนักงาน)" description="เลือกลาน · เลือกช่อง · บันทึกทะเบียน">
        {activeLots.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="เลือกลานจอด">
            <button
              type="button"
              role="tab"
              aria-selected={!lotFilter}
              className={parkingFilterChipClass(!lotFilter)}
              onClick={() => selectLot("")}
            >
              ทั้งหมด
            </button>
            {activeLots.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={lotFilter === String(l.id)}
                className={parkingFilterChipClass(lotFilter === String(l.id))}
                onClick={() => selectLot(String(l.id))}
              >
                {l.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mb-4">
          <label htmlFor="parking-checkin-spot" className="mb-1.5 block text-xs font-semibold text-[#5f5a8a]">
            ช่องจอด
          </label>
          <select
            id="parking-checkin-spot"
            className={parkingField}
            value={spotId === "" ? "" : String(spotId)}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (Number.isInteger(id) && id > 0) selectSpot(id);
            }}
          >
            {filteredSpots.length === 0 ? (
              <option value="">— ไม่มีช่องในลานนี้ —</option>
            ) : (
              filteredSpots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.spotCode}
                  {s.zoneLabel ? ` · ${s.zoneLabel}` : ""}
                  {s.activeSession ? " · มีรถจอด" : " · ว่าง"}
                  {!lotFilter ? ` · ${s.siteName}` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedSpot && active ? (
          <div className="space-y-4 rounded-[2rem] border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-800/90">กำลังจอดในรอบนี้</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#66638c]">ช่อง</dt>
                <dd className="font-bold tabular-nums">{selectedSpot.spotCode}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#66638c]">ทะเบียน</dt>
                <dd className="font-bold tabular-nums">{active.licensePlate}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#66638c]">เช็คอิน</dt>
                <dd>{formatBangkokDateTimeLong(active.checkInAt)}</dd>
              </div>
              {active.customerName ? (
                <div>
                  <dt className="text-xs text-[#66638c]">ชื่อ</dt>
                  <dd>{active.customerName}</dd>
                </div>
              ) : null}
              {active.customerPhone ? (
                <div>
                  <dt className="text-xs text-[#66638c]">โทร</dt>
                  <dd className="tabular-nums">{active.customerPhone}</dd>
                </div>
              ) : null}
              {active.shuttleFrom || active.shuttleTo || active.shuttleNote ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#66638c]">รับส่ง</dt>
                  <dd className="text-slate-800">
                    {active.shuttleFrom ? `จาก ${active.shuttleFrom}` : ""}
                    {active.shuttleFrom && active.shuttleTo ? " → " : ""}
                    {active.shuttleTo ? `ไป ${active.shuttleTo}` : ""}
                    {active.shuttleNote ? (
                      <span className="mt-1 block text-xs text-[#66638c]">{active.shuttleNote}</span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
            <ParkingCheckoutButton sessionId={active.id} />
          </div>
        ) : selectedSpot ? (
          <div className="rounded-[2rem] border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
            <ParkingStaffCheckInForm
              spotId={selectedSpot.id}
              estimatedAmountBaht={
                selectedSpot.pricingMode === "DAILY"
                  ? selectedSpot.dailyRateBaht
                  : selectedSpot.pricingMode === "MONTHLY"
                    ? selectedSpot.monthlyRateBaht
                    : null
              }
            />
          </div>
        ) : null}
      </ParkingPanelCard>
    </ParkingPageStack>
  );
}
