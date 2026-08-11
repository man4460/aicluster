import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

export const waitQueueGlassShellClass =
  "overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const waitQueueAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const waitQueueMainPaddingBottomClass = "pb-24 lg:pb-0";

export const waitQueueSectionRadiusClass = "!rounded-[2rem]";

export const waitQueueDockPillClass = "!rounded-[1.5rem]";

export const waitQueueNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

export const waitQueueNavIdleClass =
  "text-slate-500 hover:bg-white/45 hover:text-slate-700";
