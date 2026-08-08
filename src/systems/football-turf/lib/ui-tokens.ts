/**
 * โทน UI โมดูลสนามฟุตบอล — จัดให้สอดคล้อง POS ร้านเครื่องดื่ม / โรงแรม / MAWELL
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

/** แถบเมนูเลือกสนาม / แท็บย่อย — มุมขวาหัวการ์ด */
export const footballTurfCourtTabShellClass =
  "inline-flex max-w-full overflow-x-auto rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export function footballTurfCourtTabPillClass(active: boolean): string {
  return cn(
    "min-h-[36px] shrink-0 whitespace-nowrap rounded-[1rem] px-3 text-xs font-black transition sm:px-3.5",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#66638c] hover:bg-white/80 hover:text-[#4d47b6]",
  );
}

/** การ์ดสนาม / คิว — โทน glass แบบโรงแรม */
export const footballTurfContentCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 sm:p-4";

export const footballTurfMetaChipClass =
  "inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-[#4d47b6] shadow-sm backdrop-blur-sm";

/** แถบสีซ้ายการ์ดสนาม */
export function footballTurfCardAccentBarClass(
  tone: "emerald" | "indigo" | "amber" | "rose" | "violet" | "sky" | "slate",
): string {
  const base = "absolute inset-y-3 left-0 w-1.5 rounded-r-full";
  switch (tone) {
    case "emerald":
      return `${base} bg-gradient-to-b from-emerald-400 to-teal-500`;
    case "indigo":
      return `${base} bg-gradient-to-b from-[#5b61ff] to-indigo-600`;
    case "amber":
      return `${base} bg-gradient-to-b from-amber-400 to-orange-500`;
    case "rose":
      return `${base} bg-gradient-to-b from-rose-400 to-fuchsia-500`;
    case "violet":
      return `${base} bg-gradient-to-b from-[#7c66ff] to-[#c026d3]`;
    case "sky":
      return `${base} bg-gradient-to-b from-sky-400 to-cyan-500`;
    default:
      return `${base} bg-gradient-to-b from-slate-300 to-slate-500`;
  }
}

export function footballTurfCourtStatusBadgeClass(
  tone: "emerald" | "indigo" | "amber" | "rose" | "slate",
): string {
  const base = "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1";
  switch (tone) {
    case "emerald":
      return `${base} border-emerald-200/80 bg-emerald-50/90 text-emerald-800 ring-emerald-200/80`;
    case "indigo":
      return `${base} border-indigo-200/80 bg-indigo-50/90 text-indigo-800 ring-indigo-200/80`;
    case "amber":
      return `${base} border-amber-200/80 bg-amber-50/90 text-amber-800 ring-amber-200/80`;
    case "rose":
      return `${base} border-rose-200/80 bg-rose-50/90 text-rose-800 ring-rose-200/80`;
    default:
      return `${base} border-slate-200/80 bg-slate-100/90 text-slate-600 ring-slate-200/80`;
  }
}
