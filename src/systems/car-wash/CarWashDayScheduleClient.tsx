"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/use-mounted";
import { normalizeTimeHHmm } from "@/lib/car-wash/slot-times";
const cardBodyPad = "px-5 py-5 sm:px-6";

type SlotAvailabilityItem = {
  time: string;
  available: boolean;
  bookingId?: number;
};

type SchedulePayload = {
  date: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  isClosed: boolean;
  slots: string[];
  slotAvailability?: SlotAvailabilityItem[];
  availableCount?: number;
};

function ScheduleFormSkeleton() {
  return (
    <div className={cn(cardBodyPad, "space-y-4 pb-2")} aria-hidden>
      <div className="h-12 animate-pulse rounded-xl bg-white/40" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="h-16 animate-pulse rounded-xl bg-white/40" />
        <div className="h-16 animate-pulse rounded-xl bg-white/40" />
        <div className="col-span-2 h-16 animate-pulse rounded-xl bg-white/40 sm:col-span-1" />
      </div>
      <div className="flex gap-2">
        <div className="h-11 w-28 animate-pulse rounded-xl bg-white/40" />
        <div className="h-11 w-20 animate-pulse rounded-xl bg-white/40" />
      </div>
    </div>
  );
}

export function CarWashDayScheduleClient({
  embedded = false,
  initialDateKey,
}: {
  embedded?: boolean;
  /** จากเซิร์ฟเวอร์ — กัน hydration mismatch กับ bangkokDateKey() บน client */
  initialDateKey: string;
}) {
  const mounted = useMounted();
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [isClosed, setIsClosed] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailabilityItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/car-wash/day-schedules?date=${encodeURIComponent(d)}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as SchedulePayload & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "โหลดไม่สำเร็จ");
        return;
      }
      setOpenTime(data.openTime);
      setCloseTime(data.closeTime);
      setSlotMinutes(data.slotMinutes);
      setIsClosed(data.isClosed);
      setSlots(data.slots ?? []);
      setSlotAvailability(data.slotAvailability ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(dateKey);
  }, [dateKey, load]);

  async function save() {
    setBusy(true);
    setMsg(null);
    const openNorm = normalizeTimeHHmm(openTime);
    const closeNorm = normalizeTimeHHmm(closeTime);
    if (!isClosed && (!openNorm || !closeNorm)) {
      setMsg("รูปแบบเวลาเปิด–ปิดไม่ถูกต้อง");
      setBusy(false);
      return;
    }
    if (!isClosed && openNorm! >= closeNorm!) {
      setMsg("เวลาปิดต้องหลังเวลาเปิด");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/car-wash/day-schedules", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          openTime: openNorm ?? openTime,
          closeTime: closeNorm ?? closeTime,
          slotMinutes,
          isClosed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as SchedulePayload & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setOpenTime(data.openTime ?? openNorm ?? openTime);
      setCloseTime(data.closeTime ?? closeNorm ?? closeTime);
      setSlotMinutes(data.slotMinutes ?? slotMinutes);
      setIsClosed(data.isClosed ?? isClosed);
      setSlots(data.slots ?? []);
      setSlotAvailability(data.slotAvailability ?? []);
      setMsg("บันทึกตารางวันนี้แล้ว");
    } finally {
      setBusy(false);
    }
  }

  const inner = !mounted ? (
    <ScheduleFormSkeleton />
  ) : (
    <div className={cn(cardBodyPad, "space-y-4 pb-2")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="font-semibold text-[#2e2a58]">วันที่</span>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5 text-sm"
            aria-label="เลือกวันที่ตั้งตาราง"
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-medium text-rose-800">ปิดรับจองวันนี้</span>
        </label>
      </div>

      {!isClosed ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="font-semibold text-[#2e2a58]">เปิด</span>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5"
            />
          </label>
          <label className="text-sm">
            <span className="font-semibold text-[#2e2a58]">ปิด</span>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5"
            />
          </label>
          <label className="col-span-2 text-sm sm:col-span-1">
            <span className="font-semibold text-[#2e2a58]">ระยะคิว (นาที)</span>
            <input
              type="number"
              min={15}
              max={240}
              step={15}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value) || 60)}
              className="mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5"
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
        >
          บันทึกตาราง
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load(dateKey)}
          className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-4 text-sm")}
          aria-label="รีเฟรชตารางเวลา"
        >
          รีเฟรช
        </button>
      </div>

      {msg ? <p className="text-sm text-[#5b61ff]">{msg}</p> : null}

      {!isClosed && slots.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-[#8b87ad]">
            ช่วงเวลา ({slots.length} ช่วง) · ว่าง{" "}
            {(slotAvailability.length > 0
              ? slotAvailability.filter((s) => s.available).length
              : slots.length)}{" "}
            · จองแล้ว {slotAvailability.filter((s) => !s.available).length}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(slotAvailability.length > 0 ? slotAvailability : slots.map((t) => ({ time: t, available: true }))).map(
              (s) => (
                <span
                  key={s.time}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums",
                    s.available
                      ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-900"
                      : "border-slate-200/80 bg-slate-100/80 text-slate-500 line-through",
                  )}
                  title={s.available ? "ว่าง" : "มีคิวแล้ว"}
                >
                  {s.time}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <AppDashboardSection tone="violet" className="min-w-0">
        <AppSectionHeader title="ตั้งช่วงเวลานวดรายวัน" description="กำหนดเวลาเปิด-ปิดและระยะคิวสำหรับการจอง" />
        {inner}
      </AppDashboardSection>
    );
  }

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader title="ตั้งช่วงเวลานวดรายวัน" description="เจ้าของร้านกำหนดคิวแต่ละวัน" />
      {inner}
    </AppDashboardSection>
  );
}
