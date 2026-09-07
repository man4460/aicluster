/**
 * Alias โทเค็น UI — แหล่งความจริงอยู่ที่ `lib/ui-tokens.ts` (แม่แบบซักผ้า)
 */
export {
  homeFinanceCardSurfaceRadiusClass as hfCardSurfaceRadiusClass,
  homeFinanceCardSurfaceRadiusClass as hfCardLargeRadiusClass,
  homeFinanceModuleShellClass as hfModuleHeaderShellClass,
  homeFinanceNavActiveClass as hfNavItemActiveClass,
  homeFinanceNavIdleClass as hfNavItemIdleClass,
  homeFinanceFilterChipClass as hfFilterChipClass,
  homeFinancePanelClass as hfSectionClass,
  homeFinancePanelClass as hfSectionTightClass,
  homeFinanceListRowCardClass as hfListRowCardClass,
  homeFinancePanelPaddedClass as hfPanelGlassClass,
  homeFinancePanelPaddedClass as hfHeroCtaClass,
  homeFinancePanelPaddedClass as hfFilterCardClass,
  homeFinancePanelPaddedClass as hfStatsPanelClass,
  homeFinancePanelPaddedClass as hfManageSubNavShellClass,
  homeFinancePanelSectionClass,
  homeFinancePanelPaddedClass,
  homeFinanceOutlineButtonClass,
  homeFinancePrimaryButtonClass,
  homeFinanceIconButtonClass,
  homeFinancePrimaryIconButtonClass,
  homeFinanceFieldClass,
  homeFinanceInlineSubNavBtnClass,
  homeFinanceFinanceRangeChipClass,
} from "@/systems/home-finance/lib/ui-tokens";

export {
  appMobileDockBackdropClass as hfMobileDockShellClass,
  appMobileDockPillClass as hfMobileDockPillClass,
  appMobileDockGridClass as hfMobileDockGridClass,
  appMobileDockItemActiveClass as hfDockItemActiveClass,
  appMobileDockItemIdleClass as hfDockItemIdleClass,
} from "@/components/app-templates/mobile-dock-tokens";

/** ชื่อเก่า — ไม่ใช้แล้ว แต่คงไว้กัน import พัง */
export const hfInsetControlRadiusClass = "rounded-lg";
export const hfNavItemBase =
  "flex min-h-9 min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-all";
export const hfIconBadgeClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#5b61ff] ring-1 ring-indigo-100";
export const hfGuideButtonClass =
  "flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 text-xs font-bold text-[#1e1b4b] shadow-sm transition hover:bg-slate-50";
