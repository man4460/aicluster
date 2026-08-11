"use client";

import { useCallback, useEffect, useState } from "react";
import { AppTime24Input, appTemplateOutlineButtonClass } from "@/components/app-templates";
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

type HoursState = {
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  openWeekdays: number[];
};

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
      setMsg("บันทึกเวลาเปิดร้านประจำแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-[1.25rem] border border-white/60 bg-white/50 p-3 sm:p-4">
        <div>
          <p className="text-sm font-black text-[#1e1b4b]">เวลาเปิดร้านประจำ (เวลาไทย)</p>
          <p className="mt-1 text-xs text-[#66638c]">
            ใช้เป็นค่าเริ่มเมื่อยังไม่ตั้งรายวัน · วันไหนไม่ติ๊ก = ปิดรับจองอัตโนมัติ
          </p>
        </div>

        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-white/40" aria-hidden />
        ) : (
          <>
            {err ? <p className="text-sm text-rose-600">{err}</p> : null}
            {msg ? <p className="text-sm font-semibold text-emerald-700">{msg}</p> : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="font-semibold text-[#2e2a58]">เริ่ม</span>
                <div className="mt-1">
                  <AppTime24Input
                    value={hours.openTime}
                    onChange={(openTime) => setHours((h) => ({ ...h, openTime }))}
                    aria-label="เวลาเริ่มเปิดร้าน"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="font-semibold text-[#2e2a58]">สิ้นสุด</span>
                <div className="mt-1">
                  <AppTime24Input
                    value={hours.closeTime}
                    onChange={(closeTime) => setHours((h) => ({ ...h, closeTime }))}
                    aria-label="เวลาสิ้นสุดเปิดร้าน"
                  />
                </div>
              </label>
              <label className="col-span-2 text-sm sm:col-span-1">
                <span className="font-semibold text-[#2e2a58]">ระยะคิว (นาที)</span>
                <input
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={hours.slotMinutes}
                  onChange={(e) =>
                    setHours((h) => ({
                      ...h,
                      slotMinutes: Math.max(15, Number(e.target.value) || 30),
                    }))
                  }
                  className={cn(carWashFinanceFieldClass, "mt-1")}
                  aria-label="ระยะคิวเป็นนาที"
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#4d47b6]">เปิดวันไหนบ้าง</p>
                <p className="text-[11px] font-semibold text-[#66638c]">
                  {carWashFormatOpenWeekdaysLabel(hours.openWeekdays)}
                </p>
              </div>
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
                  className={cn(appTemplateOutlineButtonClass, "min-h-9 rounded-xl px-3 text-xs font-bold")}
                  onClick={() => setHours((h) => ({ ...h, openWeekdays: [...CAR_WASH_ALL_WEEKDAYS] }))}
                >
                  ทุกวัน
                </button>
                <button
                  type="button"
                  className={cn(appTemplateOutlineButtonClass, "min-h-9 rounded-xl px-3 text-xs font-bold")}
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
              {busy ? "กำลังบันทึก…" : "บันทึกเวลาเปิดร้านประจำ"}
            </button>
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-black text-[#1e1b4b]">ปรับรายวัน (ถ้าต้องการ)</p>
        <p className="text-xs text-[#66638c]">
          ตั้งปิดชั่วคราวหรือเปลี่ยนเวลาเฉพาะวัน — ทับค่าประจำของวันนั้น
        </p>
        <CarWashDayScheduleClient embedded initialDateKey={initialDateKey} />
      </div>
    </div>
  );
}
