"use client";

import { cn } from "@/lib/cn";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryOrderStatus,
} from "@/systems/laundry/laundry-service";

function StatusGlyph({ status }: { status: LaundryOrderStatus }) {
  const cls = "h-3 w-3 sm:h-3.5 sm:w-3.5";
  switch (status) {
    case "PENDING_PICKUP":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l3 2" strokeLinecap="round" />
        </svg>
      );
    case "PICKED_UP":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M20 12 9 21l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m14 10 7-7" strokeLinecap="round" />
        </svg>
      );
    case "SORTING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
        </svg>
      );
    case "WASHING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M12 3s-4 4-4 9a4 4 0 1 0 8 0c0-5-4-9-4-9Z" strokeLinejoin="round" />
          <path d="M9 14h6" strokeLinecap="round" />
        </svg>
      );
    case "DRYING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      );
    case "IRONING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M4 11h16l-1 8H5z" strokeLinejoin="round" />
          <path d="M6 11V9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeLinejoin="round" />
        </svg>
      );
    case "READY_TO_DELIVER":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinejoin="round" />
          <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" strokeLinejoin="round" />
        </svg>
      );
    case "DELIVERING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M14 18H6" strokeLinecap="round" />
          <path d="M10 6v12" strokeLinecap="round" />
          <path d="M14 9h7l3 4v5h-4" strokeLinejoin="round" />
          <circle cx="7.5" cy="18.5" r="2.5" />
          <circle cx="17.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "COMPLETED":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
          <path d="M22 4 12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "CANCELLED":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-6 6M9 9l6 6" strokeLinecap="round" />
        </svg>
      );
  }
}

/** แถบเปลี่ยนสถานะแบบไอคอน — แทน dropdown บนการ์ดคิวซักผ้า */
export function LaundryOrderStatusIconStrip({
  orderId,
  current,
  tone,
  onSelect,
}: {
  orderId: number;
  current: LaundryOrderStatus;
  tone: "violet" | "slate";
  onSelect: (status: LaundryOrderStatus) => void | Promise<void>;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "snap-x snap-mandatory",
      )}
      role="toolbar"
      aria-label={`อัปเดตสถานะรายการ ${orderId}`}
    >
      {LAUNDRY_ORDER_STATUSES.map((s) => {
        const active = s === current;
        const label = laundryOrderStatusLabelTh(s);
        return (
          <button
            key={s}
            type="button"
            title={label}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              if (s === current) return;
              void onSelect(s);
            }}
            className={cn(
              "snap-start flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border text-[#4d47b6] transition-all sm:h-8 sm:min-w-[2rem]",
              active ?
                cn(
                  "cursor-default border-[#5b61ff] bg-white shadow-sm ring-2 ring-[#5b61ff]/30",
                  tone === "slate" && "text-[#4338ca]",
                )
              : cn(
                  "border-transparent bg-white/35 opacity-[0.72] hover:bg-white/75 hover:opacity-100 active:scale-95",
                  tone === "violet" ? "hover:ring-1 hover:ring-white/50" : "hover:ring-1 hover:ring-slate-200/90",
                  s === "CANCELLED" && "text-rose-600 hover:text-rose-700",
                ),
            )}
          >
            <StatusGlyph status={s} />
          </button>
        );
      })}
    </div>
  );
}
