import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";
import { attendanceFieldClass, attendanceFilterChipClass } from "../attendance-ui";

export const attendanceGlassShellClass =
  "overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const attendanceAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const attendanceMainPaddingBottomClass = "pb-24 lg:pb-0";

export const attendanceSectionRadiusClass = "!rounded-[2rem]";

export const attendanceDockPillClass = "!rounded-[1.5rem]";

export const attendanceContentCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 sm:p-4";

export const attendanceNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

export const attendanceNavIdleClass =
  "text-slate-500 hover:bg-white/45 hover:text-slate-700";

export const attendanceModuleIconBadgeClass = cn(
  "flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
  appDashboardBrandGradientFillClass,
);

export { attendanceFilterChipClass };

export const attendanceMobileSelectClass = cn(
  attendanceFieldClass,
  "border border-[#e4e0f5] bg-white/90 font-bold text-[#1e1b4b]",
);

export const attendancePrimaryTabShellClass =
  "flex flex-wrap gap-1.5 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export function attendancePrimaryTabPillClass(active: boolean): string {
  return cn(
    "inline-flex min-h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition touch-manipulation sm:min-h-10 sm:px-3.5 sm:text-sm",
    active
      ? cn("text-white shadow-md", appDashboardBrandGradientFillClass)
      : "bg-white/70 text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

