import { cn } from "@/lib/cn";

export const hotelResortGlassShellClass =
  "overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

export const hotelResortMainPaddingBottomClass =
  "max-lg:pb-[calc(12rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

/** ห่อแถวสถิติ — glass เทียบคาร์แคร์ / ซักผ้า */
export const hotelResortStatsShellClass =
  "rounded-[2.5rem] border border-white/55 bg-white/28 p-3 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5";

export const hotelResortStatsHeaderClass =
  "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400";

export const hotelResortStatsDividerClass = "mt-3 h-px flex-1 bg-white/65 sm:mt-4";

/** แถวสถิติ 4 ใบ — มือถือ 2×2 */
export const hotelResortStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4";

/** แถวสถิติการเงิน 3 ใบ — การ์ดคี่เต็มความกว้างบนมือถือ */
export const hotelResortFinanceStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";

export const hotelResortFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** การ์ดรายการ (ห้อง · จอง) — โทนเดียวกันทุกหน้า */
export const hotelResortContentCardClass =
  "relative overflow-hidden rounded-[1.35rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition-all duration-300 sm:rounded-[2rem] sm:p-4";

export const hotelResortContentCardInteractiveClass =
  "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-22px_rgba(30,27,75,0.32)] active:scale-[0.99]";

export const hotelResortContentCardSelectedClass = "border-[#5b61ff]/45 ring-[#5b61ff]/25";

/** การ์ด hub QR / ลูกค้า */
export const hotelResortHubCardBaseClass =
  "group w-full rounded-[2.5rem] border border-white/50 p-6 text-left shadow-[0_28px_70px_-24px_rgba(30,27,75,0.35)] backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition-all duration-300 hover:-translate-y-1 sm:p-8";

export const hotelResortHubCardVioletClass = cn(
  hotelResortHubCardBaseClass,
  "bg-gradient-to-br from-white/55 via-indigo-50/35 to-violet-200/25",
);

export const hotelResortHubCardAmberClass = cn(
  hotelResortHubCardBaseClass,
  "bg-gradient-to-br from-white/55 via-amber-50/35 to-orange-100/25",
);

export const hotelResortFieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-left text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

export const hotelResortFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-4 py-2 text-xs font-black text-white shadow-md"
    : "rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-black text-[#66638c] hover:bg-white/80";

export const hotelResortErrorBannerClass =
  "rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-700";

export const hotelResortSuccessBannerClass =
  "rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-800";

export const hotelResortFormLabelClass =
  "text-[11px] font-black uppercase tracking-[0.12em] text-[#5b61ff]";

/** ปุ่มไอคอนล้วนในแถวการ์ด (ไม่มีขอบ) */
export const hotelResortPlainIconActionClass =
  "inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl text-[#5b61ff] transition hover:bg-[#5b61ff]/[0.08] active:opacity-80";

export const hotelResortSkeletonClass = "animate-pulse rounded-2xl bg-[#ecebff]/40";

export const hotelResortListGridClass =
  "grid grid-cols-1 items-stretch gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4";

export const hotelResortBookingListClass = "mt-4 space-y-2 sm:space-y-3";

/** ตัวเลข/ราคาไล่สี */
export const hotelResortGradientPriceClass =
  "bg-gradient-to-br from-[#5b61ff] via-[#7c66ff] to-[#c026d3] bg-clip-text text-transparent";

export const hotelResortGradientTitleClass =
  "bg-gradient-to-r from-[#1e1b4b] via-[#4d47b6] to-[#7c66ff] bg-clip-text text-transparent";

/** แถบสีซ้ายการ์ด */
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
export function hotelResortInitialAvatarClass(tone: "violet" | "amber" | "emerald" | "rose" | "sky" = "violet"): string {
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

/** ไอคon badge ใน stat card */
export function hotelResortStatIconBadgeClass(tone: "slate" | "indigo" | "violet" | "emerald" | "amber" | "rose"): string {
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
  }
}
