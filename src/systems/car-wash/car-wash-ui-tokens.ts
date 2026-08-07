/**
 * โทน UI คาร์แคร์ (Car Wash) — ให้สอดคล้องร้านเครื่องดื่ม / บาร์เบอร์ / template กลาง (ม่วง MAWELL)
 * Baseline: drink-pos · barber · football-turf (MASTER.md § Module Workspace UX/UI Rules)
 */
import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";

/** โค้งการ์ด/แผงย่อยในโมดูล */
export const carWashCardSurfaceRadiusClass = "rounded-[2rem]";

/** แผงใหญ่ชั้นใน (คู่กับเปลือกโมดูล rounded-[2.5rem]) */
export const carWashCardLargeRadiusClass = "rounded-[2.5rem]";

/** ช่องป้อนข้อมูล / แถบแจ้งเตือนเล็ก / รูปย่อ */
export const carWashInsetControlRadiusClass = "rounded-[1.25rem]";

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

/** เปลือกหัวโมดูล glass shell */
export const carWashGlassShellClass = cn(
  "app-surface overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-[#e8e6fc]/80",
  "bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl",
);

/** Accent bar ในหัวหลักเท่านั้น — หลังเส้นต้องมี `mt-5` ก่อนเนื้อหาใต้ */
export const carWashAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

/** padding-bottom safe area เมื่อมี bottom dock */
export const carWashMainPaddingBottomClass = "pb-24 lg:pb-0";

/** Nav active state — ใช้ brand gradient + text-white (ห้ามโทนดำ) */
export const carWashNavActiveClass = cn("text-white shadow-md", appDashboardBrandGradientFillClass);

/** Nav idle state */
export const carWashNavIdleClass = "text-slate-500 hover:bg-white/55 hover:text-slate-700";

/** Chip active state — rounded-full gradient white text */
export const carWashChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-xs font-black text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** Chip idle state — white bg + muted text */
export const carWashChipIdleClass =
  "text-slate-500 bg-white/55 hover:bg-white/80 rounded-full border border-[#0000BF]/25 px-4 py-2 text-xs font-black shadow-sm text-[#2e2a58]";

/** Edge-to-edge chip scroller — -mx offset matching shell padding */
export const carWashChipScrollerClass =
  "overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 sm:-mx-8 sm:px-8";

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

/** Field / input class */
export const carWashFieldClass =
  "w-full rounded-2xl border border-white/60 bg-white/85 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] outline-none ring-[#0000BF]/20 focus:ring-2";

/** Stat card grid — ตั้งแต่ md ขึ้นไป 3 คอลัมน์ (MASTER.md §8) */
export const carWashStatGridClass = "grid gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3";

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

/** CTA button class — brand gradient white text */
export const carWashCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** Header toolbar group ครอบ ปุ่มซ่อนหัว + คู่มือ */
export const carWashHeaderToolbarGroupClass = "flex shrink-0 items-center gap-2";

/** ตัวแปร persistent header collapse — local storage key */
export const CAR_WASH_HEADER_COLLAPSED_KEY = "car-wash:header-collapsed:v1";

/** Header shell padding (p-4 สำหรับมือถือ, px-8 py-6 สำหรับเดสก์ท็อป) */
export const carWashShellPaddingClass = "p-4 sm:px-8 sm:py-6 print:hidden";

/** Shell header glass + padding combine ไว้ใช้เร็ว */
export const carWashShellWrapperClass = cn(carWashGlassShellClass, carWashShellPaddingClass);
