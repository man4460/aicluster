import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

export const generalStorePosGlassShellClass =
  "overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const generalStorePosAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const generalStorePosMainPaddingBottomClass =
  "max-lg:pb-[calc(12rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

export const generalStorePosSectionRadiusClass = "!rounded-[2.5rem]";

export const generalStorePosDockPillClass = "!rounded-[1.5rem]";

export const generalStorePosNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

export const generalStorePosNavIdleClass =
  "text-slate-500 hover:bg-white/45 hover:text-slate-700";
