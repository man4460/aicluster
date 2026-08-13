import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";

/** เปลือกโมดูลหลัก — เทียบ CarWashDashboard การ์ดหัว */
export const buildingPosModuleGlassShellClass =
  cn(
    "app-surface overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-[#e8e6fc]/80",
    "bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55",
    "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl",
  );

export const buildingPosAccentBarClass = cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass);

export const buildingPosNavActiveClass = cn("text-white shadow-md", appDashboardBrandGradientFillClass);

export const buildingPosNavIdleClass = "text-slate-500 hover:bg-white/55 hover:text-slate-700";

export const buildingPosContentStackClass = "space-y-4 sm:space-y-6";

export const buildingPosFieldClass =
  "app-input min-h-[44px] w-full rounded-2xl px-3 py-2 text-sm font-semibold text-[#1e1b4b] touch-manipulation";

export const buildingPosSelectFieldClass = cn(buildingPosFieldClass, "cursor-pointer");

export const buildingPosChipIdleClass =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-200";

export const buildingPosChipActiveClass = cn(
  "rounded-full border-transparent px-4 py-2 text-sm font-semibold text-white shadow-md",
  appDashboardBrandGradientFillClass,
);

/** พื้นที่เลื่อนเนื้อหาแดชบอร์ด — ไม่ให้ถูก dock (+ สล็อตร่างบิล) บัง (มือถือ) */
export const buildingPosShellMainPaddingBottomClass =
  "max-lg:pb-[max(11rem,8rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

/** พอร์ทัลพนักงาน — เคลียร์แค่แถบแท็บล่าง (เทียบ drink-pos `pb-24`) ไม่เว้นที่สล็อตร่างบิลแดชบอร์ด */
export const buildingPosStaffPortalPaddingBottomClass = "pb-24 lg:pb-0";

/** กริดการ์ดเมนูหน้าออร์เดอร์ — ใช้คู่กับคลาส `bp-order-menu-grid` ใน globals.css (มือถือ 3 คอลัมน์บังคับ) */
export const buildingPosProductGridClass = "bp-order-menu-grid";

/**
 * กริดเมนูบนเว็บไซต์จองลูกค้า (`BuildingPosPortalClient`)
 * มือถือ 3 คอลัมน์ · คอม (`lg+`) 6 คอลัมน์ — ตาม `module-customer-booking-website-portal.mdc`
 */
export const buildingPosPortalMenuGridClass =
  "grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6";

/** การ์ดเมนูบนพอร์ทัลจอง — ย่อแน่นบนมือถือ (3 คอลัมน์) */
export const buildingPosPortalMenuCardClass =
  "overflow-hidden rounded-lg border border-white/70 bg-white/80 text-left shadow-sm sm:rounded-xl lg:rounded-2xl";

/** การ์ดเมนู — มือถือแน่น (3 คอลัมน์) · มุมโค้งเล็กลง · เดสก์ท็อปมนขึ้น */
export const buildingPosProductCardClass =
  "group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/70 bg-gradient-to-br from-white/85 via-white/70 to-violet-50/45 shadow-sm ring-1 ring-inset ring-white/55 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-xl lg:rounded-[1.25rem]";

export const buildingPosCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

export const buildingPosPulseWashClass = "bg-[#5b61ff]/08";

/** การ์ดสถิติแดชบอร์ด — โค้งพอประมาณ (`rounded-[1.25rem]`) */
export const buildingPosStatCardEmeraldClass =
  "relative overflow-hidden rounded-[1.25rem] border border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 p-4 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.35)] sm:p-5";

export const buildingPosStatCardIndigoClass =
  "relative overflow-hidden rounded-[1.25rem] border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 p-4 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.35)] sm:p-5";

export const buildingPosStatCardVioletClass =
  "relative overflow-hidden rounded-[1.25rem] border border-white/60 bg-gradient-to-br from-white/60 via-violet-50/30 to-fuchsia-50/25 p-4 shadow-[0_18px_38px_-26px_rgba(139,92,246,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.35)] sm:p-5";

/** แถวรายการหมวด / เมนู — พื้นไล่ + โค้งชั้นใน */
export const buildingPosListRowCardClass =
  "relative overflow-hidden rounded-[1.25rem] border border-[#e8e6f4]/90 bg-gradient-to-br from-white via-white to-[#faf9ff]/95 px-2.5 py-3 shadow-[0_8px_26px_-18px_rgba(91,97,255,0.14)] transition-[box-shadow,border-color] duration-300 sm:px-4 sm:py-2.5 hover:border-[#d4cff7]/90 hover:shadow-[0_14px_36px_-22px_rgba(79,70,229,0.16)]";

/** Hub ใหญ่ (QR ฯลฯ) — ชั้นนอกสอดคล้องเปลือก 2.5rem */
export const buildingPosQrHubOuterClass =
  "overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-white/50 bg-gradient-to-br from-white/55 via-[#faf9ff] to-indigo-50/25 shadow-[0_24px_60px_-28px_rgba(77,71,182,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/45";

/** แผงเนื้อหาภายใน (หมวด / เมนู / ต้นทุน) — glass อ่อน */
export const buildingPosContentPanelClass =
  "app-surface rounded-[1.25rem] border border-white/60 bg-white/50 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.18)] backdrop-blur-md sm:p-5";

/** แถบแท็บย่อย (เทียบแพ็กเกจ/สมาชิกบาร์เบอร์ / offers คาร์แคร์) */
export const buildingPosSubTabSegmentShellClass =
  "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

/** แถบเมนูการเงินในการ์ดรายละเอียด (ประวัติ · รายรับ · รายจ่าย) — แบบโรงแรม */
export const buildingPosFinanceSubTabShellClass = buildingPosSubTabSegmentShellClass;

/** การ์ดย่อยในแดชบอร์ด (โต๊ะค้าง ฯลฯ) */
export const buildingPosInnerCardRadiusClass = "rounded-[1.25rem]";

/** แถบหลักหน้าตั้งค่า (มือถือ dropdown · sm+ pill) */
export const buildingPosPrimaryTabShellClass =
  "flex flex-wrap gap-1.5 rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";

export function buildingPosPrimaryTabPillClass(active: boolean): string {
  return cn(
    "inline-flex min-h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition touch-manipulation sm:min-h-10 sm:px-3.5 sm:text-sm",
    active
      ? cn("text-white shadow-md", appDashboardBrandGradientFillClass)
      : "bg-white/70 text-[#5f5a8a] hover:bg-white hover:text-[#4d47b6]",
  );
}

export const buildingPosMobileSelectClass = cn(
  buildingPosSelectFieldClass,
  "border border-[#e4e0f5] bg-white/90 font-bold text-[#1e1b4b]",
);
