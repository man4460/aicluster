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
    default: "bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-900 ring-1 ring-indigo-200/70",
    success: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-950 ring-1 ring-emerald-200/80",
    warning: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950 ring-1 ring-amber-200/80",
    danger: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-950 ring-1 ring-rose-200/80",
    muted: "bg-gradient-to-r from-slate-50 to-zinc-100 text-slate-600 ring-1 ring-slate-200/70",
  }[ui.tone];

  return (
    <div className="text-right">
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${toneClass}`}>
        {ui.primary}
      </span>
      {ui.secondary ? <p className="mt-1 text-[11px] text-slate-500">{ui.secondary}</p> : null}
    </div>
  );
}
