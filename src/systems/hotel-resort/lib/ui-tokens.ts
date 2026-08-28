import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/**
 * §9 Radius System 2.0 / 1.5 / 1.0 — โรงแรมมาตรฐานเดียวกันกับทุกโมดูล
 * 3 ระดับ:
 *   - Shell (เปลือกหลัก / Section radius): 2.0rem = rounded-[2rem]
 *   - Surface (การ์ดย่อยๆ / stat / list): 1.5rem = rounded-[1.5rem]
 *   - Control (input / button / badge): 1.0rem = rounded-[1rem]
 */

/** §9 Shell = 2.0rem (เปลือกหลัก — ใช้กับ Module shell / main section) */
export const hotelResortGlassShellClass =
  "overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

/** เส้นไล่สีหัวการ์ด — ต้องมี `mt-5` ก่อนเนื้อหาใต้เส้น */
export const hotelResortAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

/** กันเมนูล่างบังเนื้อหา — แบบ drink-pos / สนามฟุตบอล */
export const hotelResortMainPaddingBottomClass = "pb-24 lg:pb-0";

/** §9 Shell = 2.0rem (ทับ AppDashboardSection rounded-2xl ให้โค้งมาตรฐานโมดูลนี้) */
export const hotelResortSectionRadiusClass = "!rounded-[2rem]";

/** dock pill มือถือ — §9 Surface = 1.5rem (เป็น surface ไม่ใช่ shell) */
export const hotelResortDockPillClass = "!rounded-[1.5rem]";

export const hotelResortNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

export const hotelResortNavIdleClass =
  "text-slate-500 hover:bg-white/45 hover:text-slate-700";

/** §9 SubTabs shell: 1.25rem (control hybrid — ขนาดระหว่าง 1.0 กับ 1.5) */
export const hotelResortFinanceSubTabShellClass =
  "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

/** §9 Surface = 1.5rem (shell stats wrapper) */
export const hotelResortStatsShellClass =
  "rounded-[1.5rem] border border-white/55 bg-white/28 p-3 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5";

export const hotelResortStatsHeaderClass =
  "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400";

export const hotelResortStatsDividerClass = "mt-3 h-px flex-1 bg-white/65 sm:mt-4";

/** แถวสถิติ 4 ใบ — มือถือ 2×2 */
export const hotelResortStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4";

/** แถวสถิติการเงิน 3 ใบ — การ์ดคี่เต็มความกว้างบนมือถือ */
export const hotelResortFinanceStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";

export const hotelResortFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** §9 Surface = 1.5rem (การ์ดรายการ ห้อง / จอง — เปลี่ยนจาก rounded-xl (0.75rem) เก่า → 1.5rem ตรงกฎ */
export const hotelResortContentCardClass =
  "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 sm:p-4";

export const hotelResortContentCardInteractiveClass =
  "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-22px_rgba(30,27,75,0.32)] active:scale-[0.99]";

export const hotelResortContentCardSelectedClass = "border-[#5b61ff]/45 ring-[#5b61ff]/25";

/** §9 Surface = 1.5rem (การ์ด hub QR / ลูกค้า) */
export const hotelResortHubCardBaseClass =
  "group w-full rounded-[1.5rem] border border-white/50 p-6 text-left shadow-[0_28px_70px_-24px_rgba(30,27,75,0.35)] backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition-all duration-300 hover:-translate-y-1 sm:p-8";

/** §9 Control = 1.0rem (การ์ดสถิติเดี่ยว / control level) — เปลี่ยนจาก rounded-xl (0.75rem) → 1rem */
export const hotelResortStatCardRadiusClass = "rounded-[1rem]";

export const hotelResortHubCardVioletClass = cn(
  hotelResortHubCardBaseClass,
  "bg-gradient-to-br from-white/55 via-indigo-50/35 to-violet-200/25",
);

export const hotelResortHubCardAmberClass = cn(
  hotelResortHubCardBaseClass,
  "bg-gradient-to-br from-white/55 via-amber-50/35 to-orange-100/25",
);

/** §9 Control = 1.0rem (field input) — เปลี่ยนจาก rounded-xl (0.75rem) → rounded-[1rem] */
export const hotelResortFieldClass =
  "min-h-[44px] w-full rounded-[1rem] border border-white/60 bg-white/70 px-3 py-2.5 text-left text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

/** Filter chips = rounded-full (ไม่อยู่ใน control 1.0 ไม่ขัดกฎ ไม่ต้องเปลี่ยน — pill style) */
export const hotelResortFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-4 py-2 text-xs font-black text-white shadow-md"
    : "rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-black text-[#66638c] hover:bg-white/80";

/** Payment chips idle = rounded-full (ไม่ขัด) */
export const hotelResortPaymentChipIdleClass =
  "rounded-full border border-[#0000BF]/25 bg-white/85 px-4 py-2 text-xs font-black text-[#2e2a58] shadow-sm";

export const hotelResortPaymentChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** §9 Control = 1.0rem (payment CTA button) — เปลี่ยนจาก rounded-xl (0.75rem) → rounded-[1rem] */
export const hotelResortPaymentCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-[1rem] px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** §9 Control = 1.0rem (banner error/success) */
export const hotelResortErrorBannerClass =
  "rounded-[1rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700";

export const hotelResortSuccessBannerClass =
  "rounded-[1rem] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-800";

export const hotelResortFormLabelClass =
  "text-[11px] font-black uppercase tracking-[0.12em] text-[#5b61ff]";

/** แถบแท็บหลักหน้าตั้งค่า — แบบ drink-pos / building-pos */
export const hotelResortPrimaryTabShellClass =
  "flex flex-wrap gap-1.5 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export function hotelResortPrimaryTabPillClass(active: boolean): string {
  return cn(
    "inline-flex min-h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition touch-manipulation sm:min-h-10 sm:px-3.5 sm:text-sm",
    active
      ? cn("text-white shadow-md", appDashboardBrandGradientFillClass)
      : "bg-white/70 text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

export const hotelResortMobileSelectClass = cn(
  hotelResortFieldClass,
  "border border-[#e4e0f5] bg-white/90 font-bold text-[#1e1b4b]",
);

/** §9 Control = 1.0rem (icon action button) — เปลี่ยนจาก rounded-xl (0.75rem) → rounded-[1rem] */
export const hotelResortPlainIconActionClass =
  "inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-[1rem] text-[#5b61ff] transition hover:bg-[#5b61ff]/[0.08] active:opacity-80";

/** Skeleton = 1.0rem (เปลี่ยนจาก rounded-2xl (1rem) อยู่แล้วตรงกฎ ไม่ต้องเปลี่ยน) */
export const hotelResortSkeletonClass = "animate-pulse rounded-[1rem] bg-[#ecebff]/40";

export const hotelResortListGridClass =
  "grid grid-cols-1 items-stretch gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4";

export const hotelResortBookingListClass = "mt-4 space-y-2 sm:space-y-3";

/** ตัวเลข/ราคาไล่สี */
export const hotelResortGradientPriceClass =
  "bg-gradient-to-br from-[#5b61ff] via-[#7c66ff] to-[#c026d3] bg-clip-text text-transparent";

export const hotelResortGradientTitleClass =
  "bg-gradient-to-r from-[#1e1b4b] via-[#4d47b6] to-[#7c66ff] bg-clip-text text-transparent";

/** แถบสีซ้ายการ์ดห้อง / การจอง */
export function hotelResortCardAccentBarClass(
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
    case "slate":
      return `${base} bg-gradient-to-b from-slate-300 to-slate-500`;
  }
}

/** meta chip */
export const hotelResortMetaChipClass =
  "inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-[#4d47b6] shadow-sm backdrop-blur-sm";

/** อวาตาร์อักษรย่อ */
export function hotelResortInitialAvatarClass(
  tone: "violet" | "amber" | "emerald" | "rose" | "sky" = "violet",
): string {
  const base =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-14px_rgba(30,27,75,0.55)] ring-2 ring-white/70";
  switch (tone) {
    case "amber":
      return `${base} bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400`;
    case "emerald":
      return `${base} bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500`;
    case "rose":
      return `${base} bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500`;
    case "sky":
      return `${base} bg-gradient-to-br from-sky-400 via-cyan-400 to-indigo-500`;
    case "violet":
    default:
      return `${base} bg-gradient-to-br from-[#5b61ff] via-[#7c66ff] to-[#c026d3]`;
  }
}

/** ป้ายสถานะจอง */
export function hotelResortBookingStatusBadgeClass(
  status: "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CANCELLED",
): string {
  const base =
    "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide";
  switch (status) {
    case "RESERVED":
      return `${base} border-amber-200/80 bg-amber-50/90 text-amber-800`;
    case "CHECKED_IN":
      return `${base} border-indigo-200/80 bg-indigo-50/90 text-indigo-800`;
    case "CHECKED_OUT":
      return `${base} border-emerald-200/80 bg-emerald-50/90 text-emerald-800`;
    case "NO_SHOW":
      return `${base} border-slate-200/80 bg-slate-50/90 text-slate-600`;
    case "CANCELLED":
      return `${base} border-rose-200/80 bg-rose-50/90 text-rose-800`;
  }
}

/** ป้ายสถานะชำระเงิน */
export function hotelResortPaymentStatusBadgeClass(status: "UNPAID" | "PARTIAL" | "PAID"): string {
  const base =
    "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide";
  switch (status) {
    case "UNPAID":
      return `${base} border-rose-200/80 bg-rose-50/90 text-rose-700`;
    case "PARTIAL":
      return `${base} border-amber-200/80 bg-amber-50/90 text-amber-800`;
    case "PAID":
      return `${base} border-emerald-200/80 bg-emerald-50/90 text-emerald-800`;
  }
}

/** ไอคอน badge ใน stat card */
export function hotelResortStatIconBadgeClass(
  tone: "slate" | "indigo" | "violet" | "emerald" | "amber" | "rose" | string = "indigo",
): string {
  const base = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md";
  switch (tone) {
    case "slate":
      return `${base} bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-200/50`;
    case "indigo":
      return `${base} bg-gradient-to-br from-[#5b61ff] to-indigo-600 shadow-indigo-200/50`;
    case "violet":
      return `${base} bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-200/50`;
    case "emerald":
      return `${base} bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200/50`;
    case "amber":
      return `${base} bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200/50`;
    case "rose":
      return `${base} bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-200/50`;
    default:
      return `${base} bg-gradient-to-br from-[#5b61ff] to-indigo-600 shadow-indigo-200/50`;
  }
}
