import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

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

export const attendanceFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-3.5 py-1.5 text-[11px] font-black text-white shadow-md sm:px-4 sm:py-2 sm:text-xs"
    : "rounded-full border border-white/60 bg-white/50 px-3.5 py-1.5 text-[11px] font-black text-[#66638c] hover:bg-white/80 sm:px-4 sm:py-2 sm:text-xs";

