/**
 * โทน UI โมดูลสนามฟุตบอล — จัดให้สอดคล้อง POS ร้านเครื่องดื่ม / MAWELL
 */
import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

export const footballTurfGlassShellClass = cn(
  "app-surface overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-[#e8e6fc]/80",
  "bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl",
);

export const footballTurfAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const footballTurfMainPaddingBottomClass = "pb-24 lg:pb-0";

export const footballTurfNavActiveClass = cn("text-white shadow-md", appDashboardBrandGradientFillClass);

export const footballTurfNavIdleClass = "text-slate-500 hover:bg-white/55 hover:text-slate-700";
