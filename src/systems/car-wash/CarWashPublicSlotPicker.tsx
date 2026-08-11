"use client";

import { cn } from "@/lib/cn";

export type PublicSlotItem = { time: string; available: boolean; status?: string };

type Props = {
  bookingDateKey: string;
  onDateChange: (dateKey: string) => void;
  selectedSlot: string;
  onSlotChange: (time: string) => void;
  slotAvailability: PublicSlotItem[];
  scheduleLoading: boolean;
  scheduleClosed: boolean;
  scheduleOpen: string;
  scheduleClose: string;
  scheduleSlotMinutes: number;
};

export function CarWashPublicSlotPicker({
  bookingDateKey,
  onDateChange,
  selectedSlot,
  onSlotChange,
  slotAvailability,
  scheduleLoading,
  scheduleClosed,
  scheduleOpen,
  scheduleClose,
  scheduleSlotMinutes,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-widest text-[#9490c0]">
        วันที่จอง
        <input
          type="date"
          value={bookingDateKey}
          onChange={(e) => onDateChange(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] outline-none focus:border-[#5b61ff]/50 focus:ring-2 focus:ring-[#5b61ff]/15"
        />
      </label>
      {scheduleLoading ? (
        <p className="text-center text-xs text-[#6b6894]">กำลังโหลดช่วงเวลา…</p>
      ) : scheduleClosed ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-center text-sm text-amber-900">
          วันนี้ปิดรับจอง — เลือกวันอื่นหรือติดต่อร้าน
        </p>
      ) : slotAvailability.length === 0 ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-center text-sm text-amber-900">
          ยังไม่เปิดช่วงจองในวันนี้ — ติดต่อร้าน
        </p>
      ) : (
        <>
          <p className="text-[11px] font-medium text-[#8b87ad]">
            {scheduleOpen}–{scheduleClose} · ทุก {scheduleSlotMinutes} นาที · เวลาไทย
          </p>
          <ul className="grid grid-cols-1 gap-2" role="listbox" aria-label="เลือกช่วงเวลานัด">
            {slotAvailability.map((s) => {
              const active = selectedSlot === s.time;
              return (
                <li key={s.time}>
                  <button
                    type="button"
                    disabled={!s.available}
                    role="option"
                    aria-selected={active}
                    aria-label={
                      s.available
                        ? `จองเวลา ${s.time}`
                        : s.status === "PAST"
                          ? `เวลา ${s.time} ผ่านไปแล้ว`
                          : `เวลา ${s.time} เต็มแล้ว`
                    }
                    onClick={() => s.available && onSlotChange(s.time)}
                    className={cn(
                      "flex w-full min-h-[48px] items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                      s.available
                        ? active
                          ? "border-[#5b61ff]/40 bg-white/90 ring-2 ring-[#5b61ff]/25"
                          : "border-white/70 bg-white/55 hover:border-[#5b61ff]/35 hover:bg-white/80"
                        : "cursor-not-allowed border-slate-200/70 bg-slate-100/60 opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "text-base font-black tabular-nums",
                        s.available ? "text-[#1e1b4b]" : "text-slate-400 line-through",
                      )}
                    >
                      {s.time}
                    </span>
                    <span className="text-xs font-semibold text-[#6b6894]">
                      {s.available ? (active ? "เลือกแล้ว" : "ว่าง") : s.status === "PAST" ? "เลยเวลา" : "เต็ม"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
