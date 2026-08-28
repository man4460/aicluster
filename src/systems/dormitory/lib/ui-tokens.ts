import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

export const dormGlassShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const dormAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const dormMainPaddingBottomClass = "pb-24 lg:pb-0";

export const dormSectionRadiusClass = "!rounded-[2rem]";

export const dormDockPillClass = "!rounded-[1.5rem]";

export const dormNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

export const dormNavIdleClass =
  "text-slate-500 hover:bg-white/45 hover:text-slate-700";

export const dormPrimaryTabShellClass =
  "rounded-[1.25rem] border border-white/55 bg-white/45 p-1 backdrop-blur-sm";

export const dormPrimaryTabPillClass = (active: boolean) =>
  cn(
    "min-h-9 rounded-xl px-3 py-2 text-xs font-black transition sm:min-h-10 sm:px-3.5 sm:text-sm",
    active
      ? cn(dormNavActiveClass, "shadow-md")
      : "text-[#66638c] hover:bg-white/60 hover:text-[#1e1b4b]",
  );

export const dormMobileSelectClass =
  "app-input min-h-11 w-full rounded-xl border border-white/60 bg-white/80 px-3 text-sm font-semibold text-[#1e1b4b]";

export const dormHubCardBaseClass =
  "w-full rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/70 via-indigo-50/30 to-violet-50/20 p-5 text-left shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/50 transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-22px_rgba(30,27,75,0.38)]";

export const dormHubCardVioletClass = cn(
  dormHubCardBaseClass,
  "hover:border-[#5b61ff]/25 hover:ring-[#5b61ff]/15",
);

export const dormHubCardAmberClass = cn(
  dormHubCardBaseClass,
  "hover:border-amber-300/50 hover:ring-amber-200/40",
);

export const dormFormLabelClass = "text-xs font-black text-[#4d47b6]";
export const dormFieldClass =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";
