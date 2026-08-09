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

export const footballTurfNavIdleClass =
  "text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/55 hover:text-slate-700 active:scale-[0.97]";

export const footballTurfHubCardBaseClass =
  "group w-full rounded-[2.5rem] border border-white/50 p-6 text-left shadow-[0_28px_70px_-24px_rgba(30,27,75,0.35)] backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition-all duration-300 hover:-translate-y-1 sm:p-8";

export const footballTurfHubCardVioletClass = cn(
  footballTurfHubCardBaseClass,
  "bg-gradient-to-br from-white/55 via-indigo-50/35 to-violet-200/25",
);

export const footballTurfHubCardAmberClass = cn(
  footballTurfHubCardBaseClass,
  "bg-gradient-to-br from-white/55 via-amber-50/35 to-orange-100/25",
);

/** ลูกเล่นปุ่ม — hover ยกเล็กน้อย · กดยุบ · วงแหวน (เห็นชัดแม้ในการ์ด overflow-hidden) */
export const footballTurfInteractiveButtonClass =
  "relative z-[1] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:brightness-[1.04] hover:shadow-md hover:ring-2 hover:ring-[#5b61ff]/30 active:translate-y-0 active:scale-[0.96] active:brightness-95 disabled:translate-y-0 disabled:scale-100 disabled:shadow-none disabled:ring-0";

/** ปุ่ม action ขนาดเล็กในการ์ดคิว/สนาม — มือถือย่อตามมาตรฐาน */
export const footballTurfChipActionButtonClass = cn(
  "inline-flex min-h-8 items-center justify-center rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm sm:min-h-[32px] sm:rounded-xl sm:px-3 sm:py-1.5",
  footballTurfInteractiveButtonClass,
);

/** แถบเมนูหลักในหน้า (เช่น โปร | ลูกค้า) — ใหญ่กว่าแถบกรอง */
export const footballTurfPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:rounded-[1.35rem] sm:p-1.5";

export function footballTurfPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-10 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-xl px-3 text-sm font-black leading-none sm:min-h-11 sm:grow-0 sm:basis-auto sm:px-5 sm:text-[15px]",
    footballTurfInteractiveButtonClass,
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md")
      : "bg-white/50 text-[#5f5a8a] hover:bg-white/90 hover:text-[#4d47b6]",
  );
}

/**
 * แถบกรองย่อย (แพ็ก/สิทธิ์ · สถานะลูกค้า · สถานะสิทธิ์) — เล็กกว่าแถบหลัก
 */
export const footballTurfFilterChipShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-xl border border-[#eceaf8]/90 bg-white/60 p-1 sm:w-auto";

export function footballTurfFilterChipClass(active: boolean): string {
  return cn(
    "inline-flex min-h-7 shrink-0 items-center whitespace-nowrap rounded-lg px-2 text-[10px] font-black leading-none sm:min-h-8 sm:px-2.5 sm:text-[11px]",
    footballTurfInteractiveButtonClass,
    active
      ? "bg-[#ecebff] text-[#3b36a0] ring-1 ring-[#5b61ff]/30"
      : "bg-transparent text-[#8b87b8] hover:bg-white/90 hover:text-[#4d47b6]",
  );
}

/** แถบเมนูเลือกสนาม / แท็บย่อยทั่วไป */
export const footballTurfCourtTabShellClass =
  "inline-flex max-w-full flex-wrap content-start items-center gap-0.5 rounded-[1rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:gap-1 sm:rounded-[1.25rem] sm:p-1";

export function footballTurfCourtTabPillClass(active: boolean): string {
  return cn(
    "min-h-8 shrink-0 whitespace-nowrap rounded-lg px-2 text-[11px] font-black leading-none sm:min-h-9 sm:rounded-[1rem] sm:px-3.5 sm:text-xs",
    footballTurfInteractiveButtonClass,
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
      : "text-[#66638c] hover:bg-white/80 hover:text-[#4d47b6]",
  );
}

/** แถบเมนูย่อยเต็มความกว้างใต้หัวการ์ด (มือถือ) */
export const footballTurfSubTabMobileRowClass = "mt-2.5 w-full sm:hidden";

/** แถวแอ็กชันหัวการ์ด — ห่อบรรทัดเมื่อข้อความ/ไอคอนล้น */
export const footballTurfHeaderActionRowClass =
  "flex max-w-full min-w-0 flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap sm:gap-2";

/** แถวชิปกรอง / ป้ายสถานะ — ห่อบรรทัดเมื่อล้น */
export const footballTurfChipWrapRowClass = "flex flex-wrap content-start items-center gap-1.5";

/** ปุ่มไอคอนตัวกรองมุมหัวการ์ด (มือถือ) — แตะ ~40px ตามมาตรฐานแดชบอร์ด */
export const footballTurfMobileFilterIconButtonClass = cn(
  "relative inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg border border-white/70 bg-white/80 text-[#4d47b6] shadow-sm sm:hidden",
  footballTurfInteractiveButtonClass,
);

/**
 * Dropdown มือถือเมื่อแถบ pill ไม่พอพื้นที่ (หน้าภาพรวม · เลือกสนาม / กรองสถานะ)
 * ใช้คู่กับ `sm:hidden` ที่ wrapper — ความกว้างเต็มขอบด้วย `w-full`
 */
export const footballTurfMobileSelectClass =
  "box-border h-9 w-full min-w-0 appearance-none rounded-xl border border-[#e4e0f5] bg-white/95 px-3 pr-8 text-xs font-black text-[#1e1b4b] shadow-sm outline-none ring-1 ring-inset ring-white/70 focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

/** ปุ่มไอคอน/แอ็กชันหัวการ์ด — มือถือย่อ · เดสก์ท็อปขยายข้อความได้ */
export const footballTurfHeaderIconButtonClass = cn(
  "inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg text-sm font-black sm:h-10 sm:w-auto sm:min-h-10 sm:min-w-0 sm:rounded-xl sm:px-4",
  footballTurfInteractiveButtonClass,
);

/** แถบเมนูย่อยในหน้าตั้งค่า / โปร / โปรโมชัน */
export const footballTurfSubTabShellClass = footballTurfCourtTabShellClass;

export function footballTurfSubTabPillClass(active: boolean): string {
  return footballTurfCourtTabPillClass(active);
}


/** การ์ดสนาม / คิว — โทน glass แบบโรงแรม */
export const footballTurfContentCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(30,27,75,0.38)] sm:p-4";

/** แผงฟอร์ม / รายการ — glass นิ่ง (ไม่มี hover ยกทั้งการ์ด) · มือถือ padding ย่อ */
export const footballTurfPanelCardClass =
  "relative overflow-hidden rounded-[1.25rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/20 to-violet-100/15 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.22)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:rounded-[1.5rem] sm:p-5";

/** การ์ดสถิติสรุป */
export const footballTurfStatCardClass =
  "rounded-[1.25rem] border border-white/60 bg-gradient-to-br from-white/80 via-[#f8f7ff]/75 to-indigo-50/40 p-3.5 shadow-[0_10px_28px_-22px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/50 backdrop-blur-xl sm:p-4";

export const footballTurfFieldClass =
  "w-full rounded-2xl border border-white/50 bg-white/80 px-4 py-3 text-sm font-bold text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm transition focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

export const footballTurfLabelClass = "space-y-1.5 text-sm font-bold text-[#4d47b6]";

export const footballTurfSectionEyebrowClass =
  "text-[10px] font-black uppercase tracking-[0.16em] text-[#8b87b8]";

/** แถวสถิติการเงิน 3 ใบ — มือถือ 2 คอลัมน์ · ใบคี่เต็มแถว */
export const footballTurfFinanceStatsGridClass = "grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";

export const footballTurfFinanceStatTailClass = "col-span-2 sm:col-span-1";

export const footballTurfFinanceStatCardClass =
  "rounded-[1.5rem] border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40";

/** แท็บประวัติ / รายจ่าย ในการ์ดการเงิน */
export const footballTurfFinanceSubTabShellClass =
  "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export function footballTurfFinanceSubTabPillClass(active: boolean): string {
  return cn(
    "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:px-3 sm:text-sm",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md ring-1 ring-white/40")
      : "text-slate-500 ring-1 ring-transparent hover:bg-white/45 hover:text-slate-700",
  );
}

/** ชิปช่วงเวลาการเงิน — pill เล็ก ไม่เต็มจอ */
export function footballTurfFinanceRangeChipClass(active: boolean): string {
  return active
    ? "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-3.5 text-xs font-black text-white shadow-md sm:px-4"
    : "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/50 px-3.5 text-xs font-black text-[#66638c] hover:bg-white/80 sm:px-4";
}

export const footballTurfFinanceListItemClass =
  "rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4";

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
