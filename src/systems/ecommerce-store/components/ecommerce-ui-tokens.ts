/**
 * โทน UI ร้านออนไลน์ — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

export const ecommerceCardSurfaceRadiusClass = "rounded-[2rem]";
export const ecommerceCardLargeRadiusClass = "rounded-[2.5rem]";
export const ecommerceInsetControlRadiusClass = "rounded-[1.25rem]";

/** เปลือกหัวโมดูล — glass แบบคาร์แคร์ */
export const ecommerceModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const ecommerceNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

export const ecommerceNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const ecommerceNavItemIdleClass = "app-btn-soft text-[#66638c] hover:bg-white/55 hover:text-[#4d47b6]";

/** Dock มือถือ */
export {
  appMobileDockBackdropClass as ecommerceMobileDockShellClass,
  appMobileDockPillClass as ecommerceMobileDockPillClass,
  appMobileDockGridClass as ecommerceMobileDockGridClass,
  appMobileDockItemActiveClass as ecommerceDockItemActiveClass,
  appMobileDockItemIdleClass as ecommerceDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

/** ชิป / แท็บกรอง */
export function ecommerceFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

/** การ์ดแถวรายการ */
export const ecommerceListRowCardClass =
  `${ecommerceCardSurfaceRadiusClass} border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)]`;

export const ecommerceListRowCardWarnClass =
  `${ecommerceCardSurfaceRadiusClass} border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-4 shadow-sm ring-1 ring-amber-200/60`;

/** แผงย่อยในตั้งค่า */
export const ecommerceSettingsPanelClass =
  `${ecommerceCardSurfaceRadiusClass} border border-white/55 bg-white/40 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl sm:p-5`;

/** กล่องสถิติรวม (ห่อกริด) */
export const ecommerceStatsPanelClass =
  `${ecommerceCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

/** การ์ดรายรับหลัก */
export const ecommerceHeroRevenueCardClass =
  `${ecommerceInsetControlRadiusClass} border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 px-4 py-4 text-indigo-900 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl sm:px-5 sm:py-5`;

export const ecommerceIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

export const ecommerceGuideButtonClass =
  "flex min-h-[40px] shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95";

/** ช่องค้นหา / select */
export const ecommerceFieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/65 bg-white/85 px-3 text-sm font-semibold text-[#1e1b4b] shadow-sm outline-none ring-[#5b61ff]/15 backdrop-blur-sm placeholder:text-[#8b87b8] focus:ring-2";

/** กริดสถิติภาพรวม — มือถือ 2 คอลัมน์ */
export const ecommerceOverviewStatsGridClass = "grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4";

/** กริดยอดขาย — มือถือเรียงแนวตั้ง */
export const ecommerceSalesHeroGridClass = "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4";

/** แถวรายการ — กริดมือถือ/เดสก์ท็อป */
export const ecommerceListStackClass = "mt-4 space-y-3 sm:space-y-3";

/** ป้ายสถานะออเดอร์ */
export function ecommerceOrderStatusBadgeClass(
  status: "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED",
): string {
  const base =
    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide";
  switch (status) {
    case "PENDING_SLIP":
      return `${base} border-amber-200/80 bg-amber-50/90 text-amber-800`;
    case "VERIFYING":
      return `${base} border-sky-200/80 bg-sky-50/90 text-sky-800`;
    case "PREPARING":
      return `${base} border-violet-200/80 bg-violet-50/90 text-violet-800`;
    case "SHIPPED":
      return `${base} border-emerald-200/80 bg-emerald-50/90 text-emerald-800`;
  }
}

/** ป้ายแท็กสินค้า */
export function ecommerceProductTagClass(tone: "rose" | "amber" | "slate" | "emerald"): string {
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black";
  switch (tone) {
    case "rose":
      return `${base} border-rose-200/80 bg-rose-50/90 text-rose-700`;
    case "amber":
      return `${base} border-amber-200/80 bg-amber-50/90 text-amber-800`;
    case "emerald":
      return `${base} border-emerald-200/80 bg-emerald-50/90 text-emerald-800`;
    case "slate":
      return `${base} border-slate-200/80 bg-slate-50/90 text-slate-600`;
  }
}

/** กล่องลิงก์ร้าน (ย่อ/ขยาย) */
export const ecommerceShopLinkPanelClass =
  `${ecommerceInsetControlRadiusClass} border border-[#5b61ff]/25 bg-gradient-to-br from-white/70 via-indigo-50/40 to-violet-50/30 p-3 shadow-sm backdrop-blur-sm sm:p-4`;

/** การ์ดแถวออเดอร์ — โครงภายใน */
export const ecommerceOrderCardInnerClass = "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between";

/** ราคาเด่น */
export const ecommercePriceEmphasisClass = "text-lg font-black tabular-nums tracking-tight text-[#1e1b4b] sm:text-xl";

/** ปุ่มสต๊อก ± */
export const ecommerceStockButtonClass =
  "flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/80 text-base font-black text-[#4d47b6] shadow-sm transition hover:bg-white";

/** ปุ่มแสดงจำนวนสต๊อก — กดเปิด popup ปรับ */
export const ecommerceStockPillClass =
  "inline-flex min-h-[36px] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-white/65 bg-white/85 px-2.5 text-sm font-black tabular-nums text-[#1e1b4b] shadow-sm ring-1 ring-[#5b61ff]/10 transition hover:border-[#5b61ff]/35 hover:bg-[#ecebff]/80 active:scale-95";

/** ไอคอน action ล้วน — ไม่มีกรอบ/พื้นปุ่ม */
export const ecommercePlainIconActionClass =
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg p-0 text-[#4d47b6] transition hover:bg-black/[0.04] active:scale-95";

export const ecommercePlainIconActionWarnClass =
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg p-0 text-rose-600 transition hover:bg-rose-500/[0.08] active:scale-95";

export const ecommercePlainIconActionToggleActiveClass =
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg p-0 text-amber-600 transition hover:bg-amber-500/[0.08] active:scale-95";

export const ecommercePlainIconActionToggleInactiveClass =
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg p-0 text-emerald-600 transition hover:bg-emerald-500/[0.08] active:scale-95";

/** ตัวอักษรไล่สีเน้น (ราคา / ตัวเลขเด่น) */
export const ecommerceGradientPriceClass =
  "bg-gradient-to-br from-[#5b61ff] via-[#7c66ff] to-[#c026d3] bg-clip-text text-transparent";

/** ตัวอักษรไล่สีทอง — ยอดใช้จ่ายสูง */
export const ecommerceGradientGoldClass =
  "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent";

/** อวาตาร์อักษรย่อลูกค้า */
export function ecommerceInitialAvatarClass(tone: "violet" | "amber" | "emerald" | "rose" | "slate" = "violet"): string {
  const base =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_24px_-14px_rgba(30,27,75,0.55)] ring-2 ring-white/70";
  switch (tone) {
    case "amber":
      return `${base} bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400`;
    case "emerald":
      return `${base} bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500`;
    case "rose":
      return `${base} bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500`;
    case "slate":
      return `${base} bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600`;
    case "violet":
    default:
      return `${base} bg-gradient-to-br from-[#5b61ff] via-[#7c66ff] to-[#c026d3]`;
  }
}

/** แถบสีซ้ายการ์ด — บ่งบอกสถานะ */
export function ecommerceCardAccentBarClass(
  tone: "amber" | "sky" | "violet" | "emerald" | "rose" | "slate",
): string {
  const base = "absolute inset-y-3 left-0 w-1.5 rounded-r-full";
  switch (tone) {
    case "amber":
      return `${base} bg-gradient-to-b from-amber-400 to-orange-500`;
    case "sky":
      return `${base} bg-gradient-to-b from-sky-400 to-indigo-500`;
    case "violet":
      return `${base} bg-gradient-to-b from-[#7c66ff] to-[#c026d3]`;
    case "emerald":
      return `${base} bg-gradient-to-b from-emerald-400 to-teal-500`;
    case "rose":
      return `${base} bg-gradient-to-b from-rose-400 to-fuchsia-500`;
    case "slate":
      return `${base} bg-gradient-to-b from-slate-300 to-slate-500`;
  }
}

/** meta chip — เมตาย่อยในการ์ด (icon + label) */
export const ecommerceMetaChipClass =
  "inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-[#4d47b6] shadow-sm backdrop-blur-sm";

/** desktop grid สำหรับแถวสินค้า — image | info | stock | actions */
export const ecommerceProductRowGridClass =
  "flex flex-col gap-3 lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4";

/** desktop grid สำหรับแถวออเดอร์ — customer | amount | actions */
export const ecommerceOrderRowGridClass =
  "flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-4";
