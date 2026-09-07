/**
 * Safe-area กลาง — มือถือเต็มจอ / ทางลัดหน้าจอโฮม / Capacitor / ลิงก์เว็บสาธารณะ
 *
 * ใช้โทเค็น/คอมโพเนนต์นี้เท่านั้น — อย่าคัดลอก `env(safe-area-inset-*)` กระจายในโมดูล
 * คู่กับ: `AppSafeAreaTopSpacer` · `appMobileDockBackdropClass` (ล่าง)
 * CSS vars: `--mawell-safe-top/bottom` ใน `globals.css` (fallback เป็น env)
 */
import { cn } from "@/lib/cn";

/** ความสูงแถบสถานะ (CSS) */
export const appSafeAreaTopInset = "var(--mawell-safe-top, env(safe-area-inset-top, 0px))";
/** ความสูง home indicator (CSS) */
export const appSafeAreaBottomInset = "var(--mawell-safe-bottom, env(safe-area-inset-bottom, 0px))";

/**
 * Spacer ความสูง = แถบสถานะ — วางเป็นลูกแรกของ sticky/fixed header
 * ใส่ `className` เป็นสีพื้นถ้าต้องการให้แถบสถานะกลืนกับหัว (เช่น `bg-white/95`)
 */
export const appSafeAreaTopSpacerClass =
  "pointer-events-none h-[var(--mawell-safe-top,env(safe-area-inset-top,0px))] w-full shrink-0 [min-height:var(--mawell-safe-top,env(safe-area-inset-top,0px))]";

/** sticky/fixed header: padding-top = safe-area (เมื่อไม่ใช้ spacer) */
export const appSafeAreaStickyHeaderPadClass =
  "pt-[var(--mawell-safe-top,env(safe-area-inset-top,0px))]";

/**
 * หัวพอร์ทัล absolute ทับแบนเนอร์ (ลิงก์เว็บสาธารณะ / ทางลัดหน้าจอ)
 * — รวมตำแหน่ง + เว้นแถบสถานะแล้ว
 */
export const appSafeAreaPortalHeaderClass =
  "absolute inset-x-0 top-0 z-30 pt-[var(--mawell-safe-top,env(safe-area-inset-top,0px))]";

/** หัว sticky ของหน้ารายละเอียดสาธารณะ */
export const appSafeAreaStickyPublicHeaderClass = cn(
  "sticky top-0 z-30",
  appSafeAreaStickyHeaderPadClass,
);

/** padding บนเนื้อหาเมื่อไม่มี header แยก */
export const appSafeAreaTopPadClass =
  "pt-[max(0.5rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))]";

/** padding ล่างชิด home indicator — แถบ dock / CTA (ไม่บวกช่องว่างเกิน) */
export const appSafeAreaBottomPadClass =
  "pb-[var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px))]";

/** โซน hero ใต้ absolute header — เว้นโลโก้+เมนู+status bar */
export const appSafeAreaPortalHeroTopPadClass =
  "pt-[calc(6rem+var(--mawell-safe-top,env(safe-area-inset-top,0px)))]";

/** Dashboard แถบหัวเต็มขอบ — เว้นสถานะด้วย pt บนแถบสีเอง (`appDashboardHeaderBarClass`) */
export const appSafeAreaDashboardHeaderPadClass =
  "pt-[var(--mawell-safe-top,env(safe-area-inset-top,0px))]";

/** Landing / หน้าสาธารณะหัวใหญ่ */
export const appSafeAreaLandingHeaderPadClass =
  "pt-[max(0.75rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] sm:pt-[max(1rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))]";

/** หน้าเนื้อหาเดี่ยว (download / auth-ish) — เว้นสถานะ + ระยะอ่านง่าย */
export const appSafeAreaPageContentTopPadClass =
  "pt-[max(1rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] sm:pt-8";

/** หน้า auth — เว้นสถานะ + ระยะการ์ดกลางจอ */
export const appSafeAreaAuthFramePadClass =
  "pt-[max(2.5rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] pb-[max(2.5rem,var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px)))]";

/** หน้าแก้วสาธารณะ — padding นอกเนื้อหา */
export const appSafeAreaGlassPageTopPadClass =
  "pt-[max(2rem,calc(1.5rem+var(--mawell-safe-top,env(safe-area-inset-top,0px))))] sm:pt-[max(3rem,calc(2rem+var(--mawell-safe-top,env(safe-area-inset-top,0px))))]";

export const appSafeAreaGlassPageBottomPadClass =
  "pb-[max(5rem,calc(4rem+var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px))))]";

/** overlay โมดัลเต็มจอ — เว้นบน+ล่าง (compact = ชิดขอบมากขึ้น) */
export const appSafeAreaOverlayPadYClass =
  "pt-[max(0.75rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] pb-[max(0.75rem,var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px)))]";

export const appSafeAreaOverlayPadYCompactClass =
  "pt-[max(0.375rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] pb-[max(0.375rem,var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px)))]";

/**
 * overlay เต็มจอ (lightbox / สไลด์โชว์) — เว้นทุกด้านก่อนขยาย
 * ใช้แทนการเขียน env(safe-area-inset-*) ตรงในโมดูล
 */
export const appSafeAreaOverlayPadAllClass =
  "p-[max(0.5rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)),var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px)),var(--mawell-safe-left,env(safe-area-inset-left,0px)),var(--mawell-safe-right,env(safe-area-inset-right,0px)))] sm:p-5";

/** แถบหัวเมื่อขยายเต็มจอ (lightbox / สไลด์โชว์) */
export const appSafeAreaOverlayExpandedHeaderPadClass =
  "pt-[max(0.5rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))]";

/** ปุ่ม/ชิป absolute มุมบนของ overlay */
export const appSafeAreaOverlayTopEdgeClass =
  "top-[max(12px,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] sm:top-5";
export const appSafeAreaOverlayRightEdgeClass =
  "right-[max(12px,var(--mawell-safe-right,env(safe-area-inset-right,0px)))] sm:right-5";
export const appSafeAreaOverlayLeftEdgeClass =
  "left-[max(8px,var(--mawell-safe-left,env(safe-area-inset-left,0px)))] sm:left-5";
