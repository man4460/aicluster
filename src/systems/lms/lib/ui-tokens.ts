import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/**
 * ปุ่ม / การ์ด / แท็บ โมดูล LMS — ชุดเดียวกับแม่แบบซักผ้า (plain panel · h-9 · rounded-lg)
 * หมายเหตุ: `cn` ในโปรเจกต์นี้ไม่ใช้ twMerge — ห้ามซ้อนคลาสชนกัน
 */
export const lmsBtnRadiusClass = "rounded-lg";
export const lmsBtnHeightClass = "box-border h-9 min-h-9 max-h-9";
export const lmsBtnPadXClass = "px-2.5";
export const lmsBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  lmsBtnRadiusClass,
  lmsBtnHeightClass,
  "text-[11px] font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs",
);

export const lmsOutlineButtonClass = cn(
  lmsBtnBaseClass,
  lmsBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const lmsPrimaryButtonClass = cn(
  lmsBtnBaseClass,
  lmsBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const lmsIconButtonClass = cn(
  lmsBtnBaseClass,
  "w-9 min-w-9 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const lmsRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

export const lmsFieldClass = cn(
  "app-input box-border w-full",
  lmsBtnHeightClass,
  lmsBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const lmsTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  lmsBtnRadiusClass,
);

/** แผงหลัก — มุมพอดี · ขอบบาง · ไม่ซ้อน glass */
export const lmsPanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const lmsPanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

export const lmsPanelDividerClass = "border-t border-slate-200/80";

export const lmsSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

export const lmsSubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

export const lmsPageStackClass = "min-w-0 space-y-4";

export const lmsPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function lmsPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-8 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-md px-2.5 text-xs font-bold leading-none sm:min-h-9 sm:grow-0 sm:basis-auto sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

/** เมนูย่อยแถบหัว — แบบซักผ้า (ปุ่ม h-9 คู่กับ action) */
export const lmsInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5";

export function lmsInlineSubNavBtnClass(active = false): string {
  return active ? lmsPrimaryButtonClass : lmsOutlineButtonClass;
}

export const lmsMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  lmsBtnHeightClass,
  lmsBtnRadiusClass,
);

export const lmsDashboardSegmentShellClass = cn(
  lmsPrimaryTabShellClass,
  "min-h-9 flex-nowrap items-center gap-0.5 overflow-hidden p-0.5",
);

export function lmsDashboardSegmentBtnClass(active = false): string {
  return cn(
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none transition-all sm:px-3",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

export const lmsFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function lmsFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

export const lmsFinanceStatsGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

export const lmsFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** ชิปช่วงเวลาการเงิน — pill ตามแม่แบบซักผ้า */
export function lmsFinanceRangeChipClass(active = false): string {
  return cn(
    "inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-bold transition-all sm:text-xs",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "border border-slate-200/90 bg-white text-[#4d47b6] hover:border-[#5b61ff]/35 hover:bg-slate-50",
  );
}

/** กริดสถิติหน้าแดชบอร์ด — 2×2 มือถือ · แถวเดียว 4 คอลัมน์บน md+ (แบบซักผ้า) */
export const lmsDashboardStatsGridClass =
  "grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4";

export const lmsToolbarRowClass = "flex shrink-0 flex-nowrap items-center gap-1";

export const lmsStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const lmsRowCardClass =
  "flex flex-col gap-3 rounded-lg border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4";

export const lmsFixedBottomActionClass =
  "fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 p-3 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none";

/** พอร์ทัลสาธารณะ — เปลือกหัว (ยังใช้ glass) */
export const lmsGlassShellClass =
  "rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/40 shadow-[0_8px_32px_rgba(30,27,75,0.06)] backdrop-blur-2xl sm:rounded-[2.5rem]";

/** @deprecated ใช้ lmsPrimaryButtonClass */
export const lmsNavActiveClass = lmsPrimaryButtonClass;
/** @deprecated ใช้ lmsOutlineButtonClass */
export const lmsNavIdleClass = lmsOutlineButtonClass;
/** @deprecated dock ใช้ AppMobileDockShell */
export const lmsMobileDockClass =
  "fixed inset-x-3 bottom-3 z-50 rounded-[2rem] border border-white/50 bg-white/85 p-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur-2xl sm:hidden";
export const lmsMainPaddingBottomClass = "max-lg:pb-24 lg:pb-0";

