"use client";

import { bookingUiLabel, type BarberBookingStatusUi } from "@/lib/barber/booking-status";

export function BarberBookingStatusBadge({
  status,
  scheduledAt,
  /** เวลาอ้างอิงจาก request เซิร์ฟเวอร์ — ส่งจาก RSC เพื่อให้ SSR กับ hydration ใช้ค่าเดียวกัน */
  referenceNow,
}: {
  status: string;
  /** จาก Server Component อาจถูกส่งเป็น ISO string หลัง serialize */
  scheduledAt: Date | string;
  referenceNow?: Date | string;
}) {
  const ui = bookingUiLabel(
    status as BarberBookingStatusUi,
    scheduledAt,
    referenceNow !== undefined ? referenceNow : new Date(),
  );
  const toneClass = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-950",
    danger: "bg-red-100 text-red-900",
    muted: "bg-slate-50 text-slate-500",
  }[ui.tone];

  return (
    <div className="text-right">
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}>
        {ui.primary}
      </span>
      {ui.secondary ? <p className="mt-1 text-[11px] text-slate-500">{ui.secondary}</p> : null}
    </div>
  );
}
