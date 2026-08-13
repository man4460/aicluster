"use client";

import { useCallback, useEffect, useState } from "react";
import { AppTime24Input } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/use-mounted";
import { normalizeTimeHHmm } from "@/lib/car-wash/slot-times";

type SchedulePayload = {
  date: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  isClosed: boolean;
  slots: string[];
  error?: string;
};

function ScheduleFormSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("space-y-3", !compact && "px-5 py-5 sm:px-6")} aria-hidden>
      <div className="h-11 animate-pulse rounded-xl bg-white/40" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 animate-pulse rounded-xl bg-white/40" />
        <div className="h-14 animate-pulse rounded-xl bg-white/40" />
      </div>
      <div className="h-11 w-32 animate-pulse rounded-xl bg-white/40" />
    </div>
  );
}

export function CarWashDayScheduleClient({
  compact = false,
  embedded = false,
  initialDateKey,
  defaultSlotMinutes = 30,
}: {
  /** โหมดย่อในหน้าตั้งค่า — ไม่แสดงตารางสล็อต / ปุ่มรีเฟรช */
  compact?: boolean;
  embedded?: boolean;
  /** จากเซิร์ฟเวอร์ — กัน hydration mismatch กับ bangkokDateKey() บน client */
  initialDateKey: string;
  /** ใช้ระยะคิวจากเวลาเปิดปกติ (โหมด compact) */
  defaultSlotMinutes?: number;
}) {
  const mounted = useMounted();
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [slotMinutes, setSlotMinutes] = useState(defaultSlotMinutes);
  const [isClosed, setIsClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/car-wash/day-schedules?date=${encodeURIComponent(d)}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as SchedulePayload;
      if (!res.ok) {
        setMsg(data.error ?? "โหลดไม่สำเร็จ");
        return;
      }
      setOpenTime(data.openTime);
      setCloseTime(data.closeTime);
      setSlotMinutes(data.slotMinutes);
      setIsClosed(data.isClosed);
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
    const slot = compact ? defaultSlotMinutes : slotMinutes;
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
          slotMinutes: slot,
          isClosed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as SchedulePayload;
      if (!res.ok) {
        setMsg(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setOpenTime(data.openTime ?? openNorm ?? openTime);
      setCloseTime(data.closeTime ?? closeNorm ?? closeTime);
      setSlotMinutes(data.slotMinutes ?? slot);
      setIsClosed(data.isClosed ?? isClosed);
      setMsg(compact ? "บันทึกวันนี้แล้ว" : "บันทึกตารางวันนี้แล้ว");
    } finally {
      setBusy(false);
    }
  }

  const inner = !mounted ? (
    <ScheduleFormSkeleton compact={compact} />
  ) : (
    <div className={cn("space-y-3", !compact && !embedded && "px-5 py-5 sm:px-6")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="font-semibold text-[#2e2a58]">วันที่</span>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5 text-sm"
            aria-label="เลือกวันที่"
          />
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 px-3 py-2.5 text-sm">
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
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="font-semibold text-[#2e2a58]">เปิด</span>
            <div className="mt-1">
              <AppTime24Input value={openTime} onChange={setOpenTime} aria-label="เวลาเปิดวันนี้" />
            </div>
          </label>
          <label className="text-sm">
            <span className="font-semibold text-[#2e2a58]">ปิด</span>
            <div className="mt-1">
              <AppTime24Input value={closeTime} onChange={setCloseTime} aria-label="เวลาปิดวันนี้" />
            </div>
          </label>
        </div>
      ) : null}

      {compact && !isClosed ? (
        <p className="text-[11px] font-medium text-[#8b87b8]">
          ใช้ระยะคิว {defaultSlotMinutes} นาที (ตามเวลาเปิดปกติ)
        </p>
      ) : null}

      {!compact && !isClosed ? (
        <label className="block text-sm">
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
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
      >
        {busy ? "กำลังบันทึก…" : compact ? "บันทึกวันนี้" : "บันทึกตาราง"}
      </button>

      {msg ? (
        <p className={cn("text-sm", msg.includes("ไม่") ? "text-rose-600" : "font-semibold text-emerald-700")}>
          {msg}
        </p>
      ) : null}
    </div>
  );

  if (compact || embedded) {
    return inner;
  }

  return (
    <div className="rounded-[1.25rem] border border-white/60 bg-white/50">
      <div className="border-b border-white/60 px-5 py-4">
        <p className="text-sm font-black text-[#1e1b4b]">ตั้งช่วงเวลารับจองรายวัน</p>
      </div>
      {inner}
    </div>
  );
}
