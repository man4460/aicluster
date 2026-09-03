import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/**
 * ปุ่ม / การ์ด / แท็บ โมดูลบริหารชมรม — ชุดเดียวกับแม่แบบซักผ้า (plain panel · h-10 · rounded-lg)
 * หมายเหตุ: `cn` ในโปรเจกต์นี้ไม่ใช้ twMerge — ห้ามซ้อนคลาสชนกัน
 */
export const clubEventBtnRadiusClass = "rounded-lg";
export const clubEventBtnHeightClass = "box-border h-10 min-h-10 max-h-10";
export const clubEventBtnPadXClass = "px-3";
export const clubEventBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  clubEventBtnRadiusClass,
  clubEventBtnHeightClass,
  "text-xs font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
);

export const clubEventOutlineButtonClass = cn(
  clubEventBtnBaseClass,
  clubEventBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const clubEventPrimaryButtonClass = cn(
  clubEventBtnBaseClass,
  clubEventBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const clubEventIconButtonClass = cn(
  clubEventBtnBaseClass,
  "w-10 min-w-10 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const clubEventRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

export const clubEventFieldClass = cn(
  "app-input box-border w-full",
  clubEventBtnHeightClass,
  clubEventBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const clubEventTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  clubEventBtnRadiusClass,
);

/** แผงหลัก — มุมพอดี · ขอบบาง · ไม่ซ้อน glass */
export const clubEventPanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const clubEventPanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const clubEventPanelDividerClass = "border-t border-slate-200/80";

export const clubEventSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

export const clubEventSubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

export const clubEventPageStackClass = "min-w-0 space-y-4";

export const clubEventPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function clubEventPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-9 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-md px-3 text-sm font-bold leading-none sm:min-h-10 sm:grow-0 sm:basis-auto sm:px-4",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

/** เมนูย่อยแถบหัว — แบบซักผ้า (ปุ่ม h-10 คู่กับ action) */
export const clubEventInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5";

export function clubEventInlineSubNavBtnClass(active = false): string {
  return active ? clubEventPrimaryButtonClass : clubEventOutlineButtonClass;
}

export const clubEventMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  clubEventBtnHeightClass,
  clubEventBtnRadiusClass,
);

export const clubEventDashboardSegmentShellClass = cn(
  clubEventPrimaryTabShellClass,
  "min-h-9 flex-nowrap items-center gap-0.5 overflow-hidden p-0.5",
);

export function clubEventDashboardSegmentBtnClass(active = false): string {
  return cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none transition-all sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

export const clubEventFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function clubEventFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

export const clubEventFinanceStatsGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

export const clubEventFinanceStatTailClass = "col-span-2 sm:col-span-1";

export const clubEventStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const clubEventRowCardClass =
  "flex flex-col gap-3 rounded-lg border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4";

export const clubEventFixedBottomActionClass =
  "fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 p-3 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none";

/** พอร์ทัลสาธารณะ — เปลือกหัว (ยังใช้ glass) */
export const clubEventGlassShellClass =
  "rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/40 shadow-[0_8px_32px_rgba(30,27,75,0.06)] backdrop-blur-2xl sm:rounded-[2.5rem]";

/** @deprecated ใช้ clubEventPrimaryButtonClass */
export const clubEventNavActiveClass = clubEventPrimaryButtonClass;
/** @deprecated ใช้ clubEventOutlineButtonClass */
export const clubEventNavIdleClass = clubEventOutlineButtonClass;
/** @deprecated dock ใช้ AppMobileDockShell */
export const clubEventMobileDockClass =
  "fixed inset-x-3 bottom-3 z-50 rounded-[2rem] border border-white/50 bg-white/85 p-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur-2xl sm:hidden";
export const clubEventMainPaddingBottomClass = "max-lg:pb-24 lg:pb-0";
