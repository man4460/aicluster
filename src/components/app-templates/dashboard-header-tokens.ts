/**
 * แถบหัวแดชบอร์ด (มือถือ / ไอแพดแนวตั้ง + เดสก์ท็อป)
 * ชั้นเดียวเต็มขอบซ้าย–ขวา–บน · ปุ่มเป็นไอคอน ไม่ซ้อนกล่อง
 * มือถือ: พื้นขาวโทนเดียวกับ safe-area · lg+: ไล่สีม่วงแบรนด์
 */
import { cn } from "@/lib/cn";

/**
 * แถบเต็มความกว้าง — พื้นยื่นเข้า safe-area บน
 * คู่กับ: `dashboard-mobile-header-bar.mdc` · `dashboard-mobile-viewport.mdc`
 */
export const appDashboardHeaderBarClass = cn(
  "sticky top-0 z-30 w-full",
  "border-b border-slate-200/80 bg-white text-[#1e1b4b]",
  "shadow-[0_8px_24px_-18px_rgba(30,27,75,0.14)]",
  "lg:border-white/15 lg:bg-gradient-to-r lg:from-[#4f2f9a] lg:via-[#5b3ac2] lg:to-[#ec4899] lg:text-white",
  "lg:shadow-[0_8px_24px_-16px_rgba(61,29,125,0.45)]",
  "pt-[var(--mawell-safe-top,env(safe-area-inset-top,0px))]",
);

/** แถวเนื้อหาในหัว — ไม่มี rounded / border / เงาซ้อน */
export const appDashboardHeaderBarInnerClass =
  "relative z-[1] flex h-12 w-full min-w-0 items-center gap-1.5 px-2 pb-1 sm:h-14 sm:gap-2 sm:px-4 lg:px-6";

/** ปุ่มไอคอนในหัว — สีตามแถบ (ขาวบนมือถือ / ม่วงบน lg+) */
export const appDashboardHeaderIconButtonClass = cn(
  "inline-flex h-10 w-10 shrink-0 items-center justify-center text-current/80",
  "transition-colors hover:text-current active:scale-95",
);

/** ปุ่มไอคอนเมื่อกดแล้ว / เปิดเมนู */
export const appDashboardHeaderIconButtonActiveClass = "text-current";
