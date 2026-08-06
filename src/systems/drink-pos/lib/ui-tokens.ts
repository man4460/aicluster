/**
 * โทน POS ร้านเครื่องดื่ม — จัดให้สอดคล้องสนามฟุตบอล / MAWELL brand
 * (app-surface · gradient bar · violet cards · ไม่ใส่ description ใต้หัวข้อ)
 */
import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/** การ์ดชื่อโมดูล / หัวโมดูล */
export const drinkPosModuleTitleCardClass = "app-surface border border-[#e8e6fc]/80";

/** เปลือกหัวโมดูลพร้อมแถบเมนู */
export const drinkPosGlassShellClass = cn(
  "app-surface overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-[#e8e6fc]/80",
  "bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl",
);

/** เส้นไล่สีหัวการ์ด — ต้องมี `mt-5` ก่อนเนื้อหาใต้เส้น */
export const drinkPosAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

/** กันเมนูล่างบังเนื้อหา — แบบสนามฟุตบอล */
export const drinkPosMainPaddingBottomClass = "pb-24 lg:pb-0";

/** การ์ดสถิติ */
export const drinkPosStatCardClass =
  "relative flex min-h-[7.25rem] flex-col overflow-hidden rounded-xl border border-violet-200/60 bg-gradient-to-br from-white/90 via-[#0000BF]/10 to-violet-50/80 px-4 py-4 shadow-sm";

/** การ์ดสินค้า — มือถือแน่น (3 คอลัมน์) · เดสก์ท็อปใหญ่ขึ้น */
export const drinkPosProductCardClass =
  "group relative flex flex-col overflow-hidden rounded-lg border border-white/70 bg-gradient-to-br from-white/85 via-white/70 to-violet-50/45 shadow-sm ring-1 ring-inset ring-white/55 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-xl";

/** กริดการ์ดสินค้า — มือถือ 3 ต่อแถว */
export const drinkPosProductGridClass =
  "grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8";

/** แผงบิล / draft */
export const drinkPosDraftPanelClass =
  "rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-white/90 via-[#f5f3ff]/75 to-[#fdf2f8]/55 p-3 shadow-[0_20px_50px_-20px_rgba(30,27,75,0.4)] backdrop-blur-2xl ring-1 ring-inset ring-white/60";

export const drinkPosHeadingClass = "font-black tracking-tight text-[#1e1b4b]";
export const drinkPosAccentTextClass = "text-[#0000BF]";
export const drinkPosMutedTextClass = "text-[#4d47b6]";
export const drinkPosSoftWashClass = "bg-[#0000BF]/10";
export const drinkPosPulseWashClass = "bg-[#0000BF]/08";

export const drinkPosFocusRingClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80";

export const drinkPosFieldClass =
  "w-full rounded-2xl border border-white/60 bg-white/85 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#0000BF]/20 focus:ring-2";

export const drinkPosChipIdleClass =
  "rounded-full border border-[#0000BF]/25 bg-white/85 px-4 py-2 text-xs font-black text-[#2e2a58] shadow-sm";

export const drinkPosChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

export const drinkPosCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

export const drinkPosNavActiveClass = cn(
  "text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

export const drinkPosNavIdleClass = "text-slate-500 hover:bg-white/55 hover:text-slate-700";

export const drinkPosOutlineIconButtonClass =
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/85 px-0 text-[#4d47b6] shadow-sm transition hover:bg-white sm:min-w-0 sm:px-3";

/** ระยะระหว่างบล็อกเนื้อหาหลัก */
export const drinkPosContentStackClass = "space-y-4";

/** กริดการ์ดสรุป */
export const drinkPosStatGridClass = "grid grid-cols-2 gap-3";
