import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";

/**
 * โทเค็น UI รายรับ–รายจ่าย — ยึดแม่แบบซักผ้า / การเงิน
 * (plain panel · h-9 · rounded-lg/xl — ไม่ใช้ glass ซ้อน)
 */

export const homeFinanceBtnRadiusClass = "rounded-lg";
export const homeFinanceBtnHeightClass = "box-border h-9 min-h-9 max-h-9";
export const homeFinanceBtnPadXClass = "px-2.5";
export const homeFinanceBtnBaseClass = cn(
  "inline-flex shrink-0 items-center justify-center gap-1.5",
  homeFinanceBtnRadiusClass,
  homeFinanceBtnHeightClass,
  "text-[11px] font-bold leading-none shadow-sm touch-manipulation transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs",
);

export const homeFinanceOutlineButtonClass = cn(
  homeFinanceBtnBaseClass,
  homeFinanceBtnPadXClass,
  "border border-slate-200/90 bg-white text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

export const homeFinancePrimaryButtonClass = cn(
  homeFinanceBtnBaseClass,
  homeFinanceBtnPadXClass,
  "border border-transparent text-white",
  appDashboardBrandGradientFillClass,
);

export const homeFinanceIconButtonClass = cn(
  homeFinanceBtnBaseClass,
  "w-9 min-w-9 border border-slate-200/90 bg-white px-0 text-[#1e1b4b] hover:border-slate-300 hover:bg-slate-50",
);

/** ปุ่มไอคอน primary มุมขวาบนการ์ด */
export const homeFinancePrimaryIconButtonClass = cn(
  homeFinanceBtnBaseClass,
  "w-9 min-w-9 border border-transparent px-0 text-white",
  appDashboardBrandGradientFillClass,
  "hover:brightness-110",
);

export const homeFinanceRowIconButtonClass = cn(
  "box-border inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm touch-manipulation transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
);

export const homeFinanceFieldClass = cn(
  "app-input box-border w-full",
  homeFinanceBtnHeightClass,
  homeFinanceBtnRadiusClass,
  "px-3 text-sm font-semibold leading-none text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
);

export const homeFinanceTextareaClass = cn(
  "app-input box-border w-full min-h-[5.5rem] resize-y px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] touch-manipulation placeholder:text-slate-400",
  homeFinanceBtnRadiusClass,
);

/** หัวโมดูล — plain white ไม่ glass */
export const homeFinanceModuleShellClass =
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm print:hidden";

/** @deprecated ใช้ homeFinanceModuleShellClass */
export const homeFinanceGlassShellClass = homeFinanceModuleShellClass;

export const homeFinanceAccentBarClass = "hidden";

export const homeFinanceMainPaddingBottomClass = "pb-24 lg:pb-0";

export const homeFinancePanelClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const homeFinancePanelSectionClass = "px-4 py-4 sm:px-5 sm:py-5";

/** แผงพร้อม padding — ใช้แทน glass panel เดิม */
export const homeFinancePanelPaddedClass = cn(homeFinancePanelClass, homeFinancePanelSectionClass);

export const homeFinancePanelDividerClass = "border-t border-slate-200/80";

export const homeFinanceSectionHeadingClass =
  "flex items-center gap-2 text-sm font-bold text-[#1e1b4b]";

export const homeFinanceSubtitleClass =
  "mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] sm:block";

export const homeFinanceStatInlineClass =
  "flex h-full min-h-[4.25rem] min-w-0 flex-col justify-center gap-0.5 rounded-lg bg-slate-50/90 px-3 py-2.5";

export const homeFinanceFinanceStatsGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

export const homeFinanceFinanceStatTailClass = "col-span-2 sm:col-span-1";

export const homeFinanceDashboardStatsGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3";

export const homeFinanceListRowCardClass =
  "rounded-lg border border-slate-200/90 bg-white shadow-sm";

export const homeFinanceOffersEmptyStateClass =
  "rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm font-medium text-[#66638c]";

export const homeFinanceInlineSubNavShellClass =
  "inline-flex shrink-0 flex-nowrap items-center gap-0.5";

export function homeFinanceInlineSubNavBtnClass(active = false): string {
  return active ? homeFinancePrimaryButtonClass : homeFinanceOutlineButtonClass;
}

export const homeFinanceFilterChipShellClass =
  "flex w-full flex-wrap content-start items-center gap-1 sm:gap-1.5";

export function homeFinanceFilterChipClass(active = false): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none transition sm:min-h-8 sm:px-2.5 sm:text-xs",
    active
      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200 bg-slate-50 text-[#4d47b6] hover:border-slate-300 hover:bg-white",
  );
}

/** แถบเมนูย่อยหน้าภาพรวม (pill ใหญ่กว่าชิปกรอง — แบบซักผ้า) */
export const homeFinancePrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1";

export function homeFinancePrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-8 shrink-0 grow basis-[calc(25%-4px)] whitespace-nowrap rounded-md px-2 text-[11px] font-bold leading-none sm:min-h-9 sm:grow-0 sm:basis-auto sm:px-3 sm:text-xs",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#5f5a8a] transition hover:bg-white hover:text-[#4d47b6]",
  );
}

export const homeFinanceMobileSelectClass = cn(
  "box-border w-full min-w-0 appearance-none border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-[#1e1b4b] shadow-sm outline-none focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15",
  homeFinanceBtnHeightClass,
  homeFinanceBtnRadiusClass,
);

export function homeFinanceFinanceRangeChipClass(active = false): string {
  return active ? homeFinancePrimaryButtonClass : homeFinanceOutlineButtonClass;
}

export const homeFinanceToolbarRowClass = "flex shrink-0 flex-wrap items-center gap-1";

export const homeFinancePageStackClass = "min-w-0 space-y-4";

export const homeFinanceCardSurfaceRadiusClass = "rounded-xl";

/** @deprecated aliases — คงชื่อเก่าเพื่อไม่พัง import */
export const homeFinanceSectionRadiusClass = "!rounded-xl";
export const homeFinanceDockPillClass = "!rounded-xl";
export const homeFinanceNavActiveClass = cn(appDashboardBrandGradientFillClass, "text-white shadow-sm");
export const homeFinanceNavIdleClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-700";
export const homeFinanceStatCardBubbleClass = "hidden";

export function homeFinanceDesktopNavLinkClass(active: boolean): string {
  return cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active
      ? "bg-indigo-50 text-[#5b61ff] ring-1 ring-indigo-100"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  );
}
