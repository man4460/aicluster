/**
 * โทน UI คาร์แคร์ (Car Wash) — ให้สอดคล้องร้านเครื่องดื่ม / บาร์เบอร์ / template กลาง (ม่วง MAWELL)
 * Baseline: drink-pos · barber · football-turf (MASTER.md § Module Workspace UX/UI Rules)
 * Radius system (§9): Shell 2rem / Surface 1.5rem / Field 1rem / Pill rounded-full / Control rounded-lg
 */
import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/** Surface cards / การ์ดเนื้อหา (MASTER.md §9 — 1.5rem มาตรฐานคงที่) */
export const carWashCardSurfaceRadiusClass = "rounded-[1.5rem]";

/** แผงใหญ่ชั้นใน / Shell ใน — คู่กับเปลือกโมดูล 2rem (§9) */
export const carWashCardLargeRadiusClass = "rounded-[2rem]";

/** Input field / ฟิลด์กรอก / pill เล็ก (§9 — 1rem) */
export const carWashInsetControlRadiusClass = "rounded-[1rem]";

/** padding แนวนอนในการ์ด */
export const carWashCardBodyPaddingXClass = "px-2.5 sm:px-4";

/** สถานะว่างแบบเส้นประ (มีพื้นอ่อน) */
export const carWashEmptyStateDashedClass =
  `${carWashCardSurfaceRadiusClass} border border-dashed border-[#dcd8f0] bg-[#faf9ff]/80 ${carWashCardBodyPaddingXClass} py-10`;

/** สแต็กหลักใต้ PageHeader */
export const carWashPageStackClass = "min-w-0 space-y-5";

/** เซกชันแรกในเนื้อหาหน้า (ไม่มีเส้นแบ่งบน) */
export const carWashSectionFirstClass = "min-w-0 space-y-4";

/** เซกชันถัดไป — แบ่งจากบล็อกก่อนหน้า */
export const carWashSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-5";

/** การ์ดแถวรายการมาตรฐาน */
export const carWashListRowCardClass =
  `${carWashCardSurfaceRadiusClass} border border-[#ecebff] bg-white px-3 py-3 shadow-sm sm:py-2.5`;

/** --- Design System tokens (baseline drink-pos · barber · football-turf — MASTER.md) --- */

/** เปลือกหัวโมดูล glass shell — 2rem บน md+, 1.5rem บนมือถือ (§9) */
export const carWashGlassShellClass = cn(
  "app-surface overflow-hidden rounded-[2rem] max-md:rounded-[1.5rem] border border-[#e8e6fc]/80",
  "bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl",
);

/** Accent bar ในหัวหลักเท่านั้น — หลังเส้นต้องมี `mt-5` ก่อนเนื้อหาใต้ */
export const carWashAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

/** padding-bottom safe area เมื่อมี bottom dock */
export const carWashMainPaddingBottomClass = "pb-24 lg:pb-0";

/** Section radius standard */
export const carWashSectionRadiusClass = "!rounded-[2rem]";

/** Dock pill radius class */
export const carWashDockPillClass = "!rounded-[1.5rem]";

/** Nav active state — ใช้ brand gradient + text-white (ห้ามโทนดำ) */
export const carWashNavActiveClass = cn(
  appDashboardBrandGradientFillClass,
  "text-white shadow-md ring-1 ring-white/40",
);

/** Nav idle state */
export const carWashNavIdleClass = "text-slate-500 hover:bg-white/45 hover:text-slate-700";

/** Chip active state — rounded-full gradient white text */
export const carWashChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** Chip idle state — white bg + muted text */
export const carWashChipIdleClass =
  "text-slate-500 bg-white/55 hover:bg-white/80 rounded-full border border-[#0000BF]/25 px-4 py-2 text-xs font-black shadow-sm text-[#2e2a58]";

/** Edge-to-edge chip scroller — -mx offset matching shell padding (MASTER.md §1 §10) */
export const carWashChipScrollerClass =
  "-mx-4 px-4 sm:-mx-8 sm:px-8 overflow-x-auto pb-2 pt-0.5 overscroll-x-contain [scrollbar-width:none] [-webkit-overflow-scrolling:touch]";

/** Row class inside chip scroller */
export const carWashChipRowClass = "flex w-max gap-2";

/** Sub-tab segment shell — ใช้ครอบ tab group ปุ่ม */
export const carWashSubTabSegmentShellClass = cn(
  `${carWashCardSurfaceRadiusClass} flex shrink-0 items-center gap-1 border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-[#f0fdfa]/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]`,
);

/** ระยะ content stack แนวตั้งภายใน shell */
export const carWashContentStackClass = "space-y-4 sm:space-y-6";

/** Spacing cadence: top spacing ก่อนกราฟ (compact) */
export const carWashChartTopSpacingClass = "mt-4";

/** Spacing cadence: section divider ก่อนกราฟ (มีเส้นคั่น) */
export const carWashChartSectionDividerClass = "mt-6 border-t border-[#ecebff] pt-6";

/** Filter field grid layout — 1 col mobile, 2 col desktop */
export const carWashFilterFieldGridClass = "grid gap-3 sm:grid-cols-2";

/** Field / input class — 1rem radius (§9) */
export const carWashFieldClass =
  "w-full rounded-[1rem] border border-white/60 bg-white/85 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#0000BF]/20 focus:ring-2";

/** Stat card grid — 4 คอลัมน์บนคอม sm+ (เนื่องจาก stat = 4 ใบพอดี 1 แถวเดียว; มือถือ grid-cols-2 = 2×2) */
export const carWashStatGridClass = "grid grid-cols-2 gap-3 sm:grid-cols-4";

/** Booking / check-in card grid — 3 col sm+ */
export const carWashBookingGridClass = "grid gap-4 sm:grid-cols-3";

/** Product / list grid — md 3 col */
export const carWashProductGridClass = "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3";

/** Module icon gradient wrapper — h-10 w-10 rounded-2xl */
export const carWashModuleIconBadgeClass = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-indigo-100",
  appDashboardBrandGradientFillClass,
);

/** Header collapse ปุ่ม (ซ่อน/แสดงหัวโมดูล) — icon-only h-10 w-10 */
export const carWashHeaderCollapseBtnClass =
  "h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-[0.98]";

/** Small-caps English label บนหัวข้อ header (MASTER.md §7) */
export const carWashHeaderEnLabelClass =
  "text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]";

/** CTA button class — brand gradient white text, radius 1rem (§9 field level) */
export const carWashCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-[1rem] px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** Payment chips — คู่กับ barberPaymentChip* */
export const carWashPaymentChipIdleClass =
  "rounded-full border border-[#0000BF]/25 bg-white/85 px-4 py-2 text-xs font-black text-[#2e2a58] shadow-sm";

export const carWashPaymentChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** CTA ในแผงชำระ (แสดง QR ให้ลูกค้า) */
export const carWashPaymentCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-[1rem] px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** ช่องกรอกฟอร์มบันทึกรายการ — สูงเท่ากัน */
export const carWashVisitFieldClass =
  "box-border min-h-[48px] w-full rounded-2xl border bg-white px-4 py-3 text-base font-black tracking-wide text-[#1e1b4b] placeholder:font-semibold placeholder:tracking-normal placeholder:text-slate-300 outline-none focus:ring-2 disabled:opacity-50";

/** Header toolbar group ครอบ ปุ่มซ่อนหัว + คู่มือ */
export const carWashHeaderToolbarGroupClass = "flex shrink-0 items-center gap-2";

/** Header shell padding (p-4 สำหรับมือถือ, px-8 py-6 สำหรับเดสก์ท็อป) */
export const carWashShellPaddingClass = "p-4 sm:px-8 sm:py-6 print:hidden";

// --- §14 Finance Module UI tokens (ตามรูปแบบโรงแรมมาตรฐาน ---

/** §14 Finance SubTabs shell (2 ใบ: ประวัติ/รายรับ · รายจ่าย) = 1.25rem radius gradient white-fa-indigo inset shadow */
export const carWashFinanceSubTabShellClass =
  "rounded-xl border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:rounded-[1.25rem] sm:p-1";

/** §14 Finance stats grid: 3 ใบ (รายได้/ต้นทุน/กำไร) — mobile 2-col sm+ 3-col, gaps 2 sm=3, mt-4 */
export const carWashFinanceStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";

/** §14 Finance stat ใบสุดท้าย (กำไร): mobile col-span-2 (เต็มแถวเดียวล่าง) → sm+ col-span-1 กลับคืน 3-col พอดี */
export const carWashFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** §14 Finance stat list item card base (ใช้ทั้ง history row + cost row) = 1.25rem mobile / 2rem desktop */
export const carWashFinanceListItemCardClass =
  `rounded-[1.25rem] border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm sm:rounded-[2rem] sm:px-4`;

/** §14 Filter chip (rounded-full, active = solid indigo #5b61ff fill, idle = white border soft)
 *  ใช้กับ range chips: วันนี้/เดือนนี้/ปีนี้/กำหนดเอง + category filters ในรายจ่าย
 */
export const carWashFilterChipClass = (active: boolean) =>
  active
    ? "rounded-full border border-[#5b61ff]/40 bg-[#5b61ff] px-4 py-2 text-xs font-black text-white shadow-md"
    : "rounded-full border border-[#dedbf0]/90 bg-white/70 px-4 py-2 text-xs font-bold text-[#5b61ff] hover:bg-white hover:shadow-sm";

/** แถบเมนูหลักหน้าตั้งค่า (pill) */
export const carWashPrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:rounded-[1.35rem] sm:p-1.5";

export function carWashPrimaryTabPillClass(active: boolean): string {
  return cn(
    "min-h-10 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-xl px-3 text-sm font-black leading-none sm:min-h-11 sm:grow-0 sm:basis-auto sm:px-4 sm:text-[15px]",
    active
      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md")
      : "bg-white/50 text-[#5f5a8a] transition hover:bg-white/90 hover:text-[#4d47b6]",
  );
}

export const carWashMobileSelectClass =
  "box-border h-9 w-full min-w-0 appearance-none rounded-xl border border-[#e4e0f5] bg-white/95 px-3 pr-8 text-xs font-black text-[#1e1b4b] shadow-sm outline-none ring-1 ring-inset ring-white/70 focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

/** §14 Finance form field base (date, text, keyword search input) */
export const carWashFinanceFieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-left text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

/** Shell header glass + padding combine ไว้ใช้เร็ว */
export const carWashShellWrapperClass = cn(carWashGlassShellClass, carWashShellPaddingClass);

/** Full-width banner/strip — ยืดเต็มหน้าจอจริง (§10 ซ้ายขวา เต็มจอ) */
export const carWashFullWidthBannerClass =
  "w-screen relative left-1/2 -translate-x-1/2 !max-w-none";
