/**
 * แถบหัวแดชบอร์ด (มือถือ / ไอแพดแนวตั้ง + เดสก์ท็อป)
 * ชั้นเดียวเต็มขอบซ้าย–ขวา–บน · ปุ่มเป็นไอคอน ไม่ซ้อนกล่อง
 */
import { cn } from "@/lib/cn";

/**
 * แถบสีเต็มความกว้าง — พื้นยื่นเข้า safe-area บน · เนื้อหาเว้นด้วย padding-top
 * คู่กับ: `dashboard-mobile-header-bar.mdc` · `dashboard-mobile-viewport.mdc`
 */
export const appDashboardHeaderBarClass = cn(
  "sticky top-0 z-30 w-full border-b border-white/15",
  "bg-gradient-to-r from-[#4f2f9a] via-[#5b3ac2] to-[#ec4899]",
  "text-white shadow-[0_8px_24px_-16px_rgba(61,29,125,0.45)]",
  "pt-[var(--mawell-safe-top,env(safe-area-inset-top,0px))]",
);

/** แถวเนื้อหาในหัว — ไม่มี rounded / border / เงาซ้อน */
export const appDashboardHeaderBarInnerClass =
  "relative z-[1] flex h-12 w-full min-w-0 items-center gap-1.5 px-2 pb-1 sm:h-14 sm:gap-2 sm:px-4 lg:px-6";

/** ปุ่มไอคอนในหัว — ไม่มีกล่องซ้อน · สีขาวบนแถบม่วง */
export const appDashboardHeaderIconButtonClass = cn(
  "inline-flex h-10 w-10 shrink-0 items-center justify-center text-white/90",
  "transition-colors hover:text-white active:scale-95",
);

/** ปุ่มไอคอนเมื่อกดแล้ว / เปิดเมนู */
export const appDashboardHeaderIconButtonActiveClass = "text-white";

/**
 * เมนูโมดูลเมื่อยุบหัว → ขึ้นบน header ม่วง (เดสก์ท็อป)
 * โทนเดียวกับชิปทดลองใช้งาน: กล่องแก้ว + แท็บมน + active ขาว
 */

/** แถวห่อเมนู + ชื่อโมดูล + ปุ่มขยาย */
export const appDashboardModuleHeaderNavRowClass =
  "flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2";

/** เปลือกแก้วรอบแท็บเมนู */
export const appDashboardModuleHeaderNavShellClass = cn(
  "flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto p-0.5",
  "rounded-full border border-white/30 bg-white/12",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md",
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
);

/** ลิงก์แท็บในเปลือกแก้ว */
export function appDashboardModuleHeaderNavLinkClass(active: boolean) {
  return cn(
    "inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center gap-1 rounded-full px-2",
    "text-[10px] font-bold tracking-tight transition-colors sm:h-8 sm:gap-1.5 sm:px-2.5 sm:text-[11px]",
    active
      ? "bg-white font-black text-[#5b3ac2] shadow-sm"
      : "text-white/85 hover:bg-white/15 hover:text-white",
  );
}

/** ชื่อโมดูลด้านขวาเมนู */
export const appDashboardModuleHeaderTitleClass =
  "hidden max-w-[12rem] shrink-0 truncate text-right text-xs font-bold tracking-tight text-white/90 md:inline lg:max-w-[16rem] lg:text-sm";

/** ปุ่มขยายหัวโมดูล (ไอคอนเส้น) — โทนเดียวกับปุ่มไอคอนหัว */
export const appDashboardModuleHeaderExpandButtonClass = appDashboardHeaderIconButtonClass;
