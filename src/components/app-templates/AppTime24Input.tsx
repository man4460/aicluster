"use client";

import { cn } from "@/lib/cn";

const FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800";

/** ตัดเป็น HH:mm (รองรับ HH:mm:ss จาก input type=time เดิม) */
export function normalizeAppTime24(raw: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(raw ?? "").trim());
  if (!m) return "00:00";
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const mi = Math.min(59, Math.max(0, Number(m[2])));
  if (!Number.isFinite(h) || !Number.isFinite(mi)) return "00:00";
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

export type AppTime24InputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** ขั้นนาที (1 | 5 | 15 | 30) — ค่าเริ่ม 1 */
  minuteStep?: 1 | 5 | 15 | 30;
};

/**
 * เลือกเวลาแบบ 24 ชม. (00–23) — ไม่พึ่ง AM/PM ของเบราว์เซอร์
 * ค่าเข้า–ออกเป็นสตริง `HH:mm`
 */
export function AppTime24Input({
  value,
  onChange,
  className,
  selectClassName,
  disabled,
  id,
  "aria-label": ariaLabel,
  minuteStep = 1,
}: AppTime24InputProps) {
  const normalized = normalizeAppTime24(value);
  const [hh, mm] = normalized.split(":") as [string, string];
  const hour = Number(hh);
  let minute = Number(mm);
  // ถ้านาทีไม่อยู่ในขั้น — ปัดลงหา step ที่ใกล้ที่สุด
  if (minuteStep > 1) {
    minute = Math.min(59, Math.floor(minute / minuteStep) * minuteStep);
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) =>
    String(i * minuteStep).padStart(2, "0"),
  );

  function emit(nextH: string, nextM: string) {
    onChange(`${nextH}:${nextM}`);
  }

  return (
    <div
      className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-1.5", className)}
      role="group"
      aria-label={ariaLabel ?? "เวลา 24 ชั่วโมง"}
    >
      <select
        id={id}
        disabled={disabled}
        className={cn(FIELD_CLASS, selectClassName)}
        value={String(hour).padStart(2, "0")}
        aria-label={ariaLabel ? `${ariaLabel} ชั่วโมง` : "ชั่วโมง"}
        onChange={(e) => emit(e.target.value, String(minute).padStart(2, "0"))}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-sm font-black text-slate-500" aria-hidden>
        :
      </span>
      <select
        disabled={disabled}
        className={cn(FIELD_CLASS, selectClassName)}
        value={String(minute).padStart(2, "0")}
        aria-label={ariaLabel ? `${ariaLabel} นาที` : "นาที"}
        onChange={(e) => emit(String(hour).padStart(2, "0"), e.target.value)}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
