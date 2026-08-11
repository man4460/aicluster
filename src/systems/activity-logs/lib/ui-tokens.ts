import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

export const activityLogsGlassShellClass =
  "overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const activityLogsAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const activityLogsMainPaddingBottomClass = "pb-24 lg:pb-0";

export const activityLogsSectionRadiusClass = "!rounded-[2rem]";

export const activityLogsDockPillClass = "!rounded-[1.5rem]";

export const activityLogsNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

export const activityLogsNavIdleClass =
  "text-slate-500 hover:bg-white/45 hover:text-slate-700";

export const activityLogsCardSurfaceRadiusClass = "rounded-[2rem]";

export const activityLogsListRowClass =
  "rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0000BF]/25 hover:bg-white";
