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
