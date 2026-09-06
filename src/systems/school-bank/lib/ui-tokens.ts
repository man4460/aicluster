import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/** เปลือกโมดูล — plain panel ตาม laundry (ไม่ใช้ glass ซ้อน) */
export const schoolBankGlassShellClass =
  "overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm";

export const schoolBankAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const schoolBankMainPaddingBottomClass = "pb-24 lg:pb-0";

export const schoolBankSectionRadiusClass = "!rounded-xl";

export const schoolBankDockPillClass = "!rounded-2xl";

export const schoolBankPanelClass =
  "rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4";

export const schoolBankOutlineButtonClass =
  "inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 text-[11px] font-bold text-[#1e1b4b] shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:text-xs";

export const schoolBankPrimaryButtonClass = cn(
  "inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 text-[11px] font-bold text-white shadow-sm transition disabled:opacity-50 sm:text-xs",
  appDashboardBrandGradientFillClass,
);

export const schoolBankNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-sm",
);

export const schoolBankNavIdleClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-700";
