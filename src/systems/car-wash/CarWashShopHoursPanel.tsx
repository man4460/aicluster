"use client";

import { useCallback, useEffect, useState } from "react";
import { AppTime24Input } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DEFAULT_CAR_WASH_DAY, normalizeTimeHHmm } from "@/lib/car-wash/slot-times";
import {
  CAR_WASH_ALL_WEEKDAYS,
  CAR_WASH_WEEKDAY_LABELS_TH,
  carWashFormatOpenWeekdaysLabel,
  carWashNormalizeOpenWeekdays,
} from "@/lib/car-wash/shop-hours";
import { CarWashDayScheduleClient } from "@/systems/car-wash/CarWashDayScheduleClient";
import { carWashFilterChipClass, carWashFinanceFieldClass } from "@/systems/car-wash/car-wash-ui-tokens";

const SLOT_MINUTE_OPTIONS = [15, 30, 45, 60] as const;

type HoursState = {
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  openWeekdays: number[];
};

function formatHoursSummary(h: HoursState): string {
  const days = carWashFormatOpenWeekdaysLabel(h.openWeekdays);
  return `${h.openTime}–${h.closeTime} · คิวทุก ${h.slotMinutes} นาที · ${days}`;
}

export function CarWashShopHoursPanel({ initialDateKey }: { initialDateKey: string }) {
  const [hours, setHours] = useState<HoursState>({
    openTime: DEFAULT_CAR_WASH_DAY.openTime,
    closeTime: DEFAULT_CAR_WASH_DAY.closeTime,
    slotMinutes: DEFAULT_CAR_WASH_DAY.slotMinutes,
    openWeekdays: [...CAR_WASH_ALL_WEEKDAYS],
  });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/car-wash/session/shop-hours", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        hours?: HoursState;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดเวลาเปิดร้านไม่สำเร็จ");
      if (data.hours) {
        setHours({
          openTime: data.hours.openTime || DEFAULT_CAR_WASH_DAY.openTime,
          closeTime: data.hours.closeTime || DEFAULT_CAR_WASH_DAY.closeTime,
          slotMinutes: Math.max(15, data.hours.slotMinutes || DEFAULT_CAR_WASH_DAY.slotMinutes),
          openWeekdays: carWashNormalizeOpenWeekdays(data.hours.openWeekdays),
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleWeekday = (day: number) => {
    setHours((prev) => {
      const set = new Set(prev.openWeekdays);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, openWeekdays: [...set].sort((a, b) => a - b) };
    });
  };

  const saveDefaults = async () => {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const openNorm = normalizeTimeHHmm(hours.openTime);
    const closeNorm = normalizeTimeHHmm(hours.closeTime);
    if (!openNorm || !closeNorm) {
      setErr("รูปแบบเวลาเปิด–ปิดไม่ถูกต้อง");
      setBusy(false);
      return;
    }
    if (openNorm >= closeNorm) {
      setErr("เวลาปิดต้องหลังเวลาเปิด");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/car-wash/session/shop-hours", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openTime: openNorm,
          closeTime: closeNorm,
          slotMinutes: hours.slotMinutes,
          openWeekdays: hours.openWeekdays,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        hours?: HoursState;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.hours) {
        setHours({
          openTime: data.hours.openTime,
          closeTime: data.hours.closeTime,
          slotMinutes: data.hours.slotMinutes,
          openWeekdays: carWashNormalizeOpenWeekdays(data.hours.openWeekdays),
        });
      }
      setMsg("บันทึกเวลาเปิดร้านแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] border border-white/60 bg-white/50 p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-sm font-black text-[#1e1b4b]">เวลาเปิดร้าน</p>
          <p className="text-xs text-[#66638c]">ตั้งครั้งเดียวใช้ทุกวัน · เวลาไทย</p>
        </div>

        {loading ? (
          <div className="mt-4 h-28 animate-pulse rounded-xl bg-white/40" aria-hidden />
        ) : (
          <div className="mt-4 space-y-4">
            {!loading && !err ? (
              <p className="rounded-xl border border-[#ecebff] bg-[#faf9ff]/90 px-3 py-2.5 text-xs font-semibold text-[#4d47b6]">
                ตอนนี้: {formatHoursSummary(hours)}
              </p>
            ) : null}
            {err ? <p className="text-sm text-rose-600">{err}</p> : null}
            {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="font-semibold text-[#2e2a58]">เปิด</span>
                <div className="mt-1">
                  <AppTime24Input
                    value={hours.openTime}
                    onChange={(openTime) => setHours((h) => ({ ...h, openTime }))}
                    aria-label="เวลาเปิดร้าน"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="font-semibold text-[#2e2a58]">ปิด</span>
                <div className="mt-1">
                  <AppTime24Input
                    value={hours.closeTime}
                    onChange={(closeTime) => setHours((h) => ({ ...h, closeTime }))}
                    aria-label="เวลาปิดร้าน"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="font-semibold text-[#2e2a58]">ระยะคิว</span>
                <select
                  value={hours.slotMinutes}
                  disabled={busy}
                  onChange={(e) =>
                    setHours((h) => ({
                      ...h,
                      slotMinutes: Number(e.target.value) || DEFAULT_CAR_WASH_DAY.slotMinutes,
                    }))
                  }
                  className={cn(carWashFinanceFieldClass, "mt-1")}
                  aria-label="ระยะคิวเป็นนาที"
                >
                  {SLOT_MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} นาที
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-[#4d47b6]">เปิดวันไหน</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="วันเปิดร้าน">
                {CAR_WASH_ALL_WEEKDAYS.map((day) => {
                  const active = hours.openWeekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={cn(carWashFilterChipClass(active), "min-h-9 min-w-10 px-3")}
                      aria-pressed={active}
                      aria-label={`${active ? "ปิด" : "เปิด"}วัน${CAR_WASH_WEEKDAY_LABELS_TH[day]}`}
                    >
                      {CAR_WASH_WEEKDAY_LABELS_TH[day]}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-bold text-[#5b61ff] underline-offset-2 hover:underline"
                  onClick={() => setHours((h) => ({ ...h, openWeekdays: [...CAR_WASH_ALL_WEEKDAYS] }))}
                >
                  ทุกวัน
                </button>
                <span className="text-[#ccc]" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  className="text-xs font-bold text-[#5b61ff] underline-offset-2 hover:underline"
                  onClick={() => setHours((h) => ({ ...h, openWeekdays: [1, 2, 3, 4, 5] }))}
                >
                  จ–ศ
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDefaults()}
              className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-[1.25rem] border border-white/60 bg-white/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          aria-expanded={dailyOpen}
          onClick={() => setDailyOpen((o) => !o)}
        >
          <div>
            <p className="text-sm font-black text-[#1e1b4b]">เฉพาะวัน (ไม่บังคับ)</p>
            <p className="mt-0.5 text-xs text-[#66638c]">ปิดวันหยุด หรือเปลี่ยนเวลาเฉพาะวันนั้น</p>
          </div>
          <svg
            viewBox="0 0 24 24"
            className={cn("h-5 w-5 shrink-0 text-[#8b87b8] transition-transform", dailyOpen && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {dailyOpen ? (
          <div className="border-t border-white/60 px-4 pb-4 pt-3">
            <CarWashDayScheduleClient
              compact
              initialDateKey={initialDateKey}
              defaultSlotMinutes={hours.slotMinutes}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
