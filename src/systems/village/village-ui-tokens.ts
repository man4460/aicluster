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
