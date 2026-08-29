/**
 * โทน UI จัดการหมู่บ้าน — สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */

export const villageCardSurfaceRadiusClass = "rounded-[2rem]";
export const villageCardLargeRadiusClass = "rounded-[2.5rem]";
export const villageInsetControlRadiusClass = "rounded-[1.25rem]";

export const villageModuleHeaderShellClass =
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55 sm:px-8 sm:py-6";

export const villageNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] sm:min-h-0 sm:text-sm sm:py-2";

export const villageNavItemActiveClass =
  "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm";

export const villageNavItemIdleClass = "text-slate-500 hover:bg-white/45 hover:text-[#4d47b6]";

export {
  appMobileDockBackdropClass as villageMobileDockShellClass,
  appMobileDockPillClass as villageMobileDockPillClass,
  appMobileDockGridClass as villageMobileDockGridClass,
  appMobileDockItemActiveClass as villageDockItemActiveClass,
  appMobileDockItemIdleClass as villageDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

export const villageIconBadgeClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-lg shadow-indigo-100";

/** Header collapse ปุ่ม (ซ่อน/แสดงหัวโมดูล) — icon-only */
export const villageHeaderCollapseBtnClass =
  "inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-[0.98]";

export const villageHeaderToolbarGroupClass = "flex shrink-0 items-center gap-2";

export function villageFilterChipClass(active: boolean) {
  return active
    ? "min-h-[40px] shrink-0 rounded-xl border border-[#5b61ff]/40 bg-[#5b61ff] px-3 text-sm font-bold text-white shadow-sm"
    : "min-h-[40px] shrink-0 rounded-xl border border-white/60 bg-white/70 px-3 text-sm font-semibold text-[#4d47b6] transition hover:bg-white/90";
}

export function villageSubNavChipClass(active: boolean) {
  return active
    ? "min-h-[34px] rounded-xl border border-[#5b61ff]/35 bg-[#5b61ff] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
    : "min-h-[34px] rounded-xl border border-white/55 bg-white/45 px-2.5 py-1 text-[11px] font-semibold text-[#4d47b6] transition hover:bg-white/65";
}

export const villageListRowCardClass =
  `${villageCardSurfaceRadiusClass} border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)]`;

export const villagePanelCardClass =
  `${villageCardLargeRadiusClass} border border-white/55 bg-white/28 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`;

export const villageGlassCardClass =
  `${villageInsetControlRadiusClass} border border-white/60 bg-gradient-to-br from-white/60 via-white/42 to-indigo-50/28 shadow-sm backdrop-blur-xl ring-1 ring-inset ring-white/55`;

export const villageSegmentShellClass =
  `${villageCardSurfaceRadiusClass} w-full border border-white/55 bg-white/40 p-1 backdrop-blur-md`;

export const villageEmptyDashedClass =
  `${villageInsetControlRadiusClass} border border-dashed border-white/60 bg-white/35 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c] backdrop-blur-sm`;

/** แถบเมนูหลักหน้าตั้งค่า — shell pill */
export const villagePrimaryTabShellClass =
  "inline-flex w-full max-w-full flex-wrap content-start items-center gap-1 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:rounded-[1.35rem] sm:p-1.5";

export function villagePrimaryTabPillClass(active: boolean): string {
  return [
    "min-h-10 shrink-0 grow basis-[calc(50%-4px)] whitespace-nowrap rounded-xl px-3 text-sm font-black leading-none sm:min-h-11 sm:grow-0 sm:basis-auto sm:px-4 sm:text-[15px]",
    active
      ? "bg-gradient-to-br from-[#5b61ff] via-[#6366f1] to-[#7c3aed] text-white shadow-md"
      : "bg-white/50 text-[#5f5a8a] transition hover:bg-white/90 hover:text-[#4d47b6]",
  ].join(" ");
}

/** แถบแท็บย่อยหน้าการเงิน (ประวัติ / รายรับ · รายจ่าย) */
export const villageFinanceSubTabShellClass =
  "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export const villageFinanceStatsGridClass = "grid grid-cols-2 gap-3 sm:grid-cols-3";

export const villageFinanceStatTailClass = "col-span-2 sm:col-span-1";

/** ช่องกรอกในฟอร์ม/โมดัลการเงิน — โทนเดียวกับ dormFieldClass */
export const villageFieldClass =
  "mt-1 min-h-[44px] w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[#1e1b4b] outline-none ring-1 ring-inset ring-white/50 focus:border-[#5b61ff]/45 focus:ring-2 focus:ring-[#5b61ff]/20 sm:min-h-[40px]";

export const villageMobileSelectClass =
  "box-border h-9 w-full min-w-0 appearance-none rounded-xl border border-[#e4e0f5] bg-white/95 px-3 pr-8 text-xs font-black text-[#1e1b4b] shadow-sm outline-none ring-1 ring-inset ring-white/70 focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";
