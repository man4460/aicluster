"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import {
  barberAccentBarClass,
  barberContentStackClass,
  barberGlassShellClass,
  barberHeaderCollapseBtnClass,
  barberHeaderEnLabelClass,
  barberHeaderToolbarGroupClass,
  barberMainPaddingBottomClass,
  barberModuleIconBadgeClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BarberModuleDesktopNav, BarberModuleMobileDock } from "./BarberModuleHeader";
import { BarberUsageGuideModal } from "./BarberUsageGuideModal";

/** EN small-caps label บนหัวข้อ header (MASTER.md §7 — ห้ามมีคำอธิบายใต้ H1) */
const BARBER_MODULE_EN_LABEL = "BARBER SHOP";
/** ชื่อระบบโมดูล — แสดงเป็นหัวข้อหลักด้านบน (ไทย H1 บรรทัดล่าง) */
const BARBER_MODULE_TITLE = "ร้านตัดผม";
/** LocalStorage key สำหรับ UI preference: ซ่อน/แสดงหัวโมดูล */
const BARBER_HEADER_COLLAPSED_KEY = "barber:header-collapsed:v1";

/** พื้นที่เนื้อหาโมดูล — โทนกระจกอ่อน โค้งระดับแผงใหญ่คาร์แคร์ */
const barberModuleContentShellClass = cn(
  "min-w-0 overflow-hidden rounded-[2.5rem] border border-white/45 bg-white/35 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
  "p-4 sm:p-5 md:p-6 print:border-0 print:shadow-none",
);

/** Chevron ขึ้น-ลง สำหรับปุ่มซ่อน/แสดงหัวโมดูล */
function BarberHeaderChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={cn("h-4 w-4 transition-transform duration-200", expanded ? "rotate-0" : "rotate-180")}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BarberLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  /** ซ่อน/แสดงหัวโมดูล + เมนูหลักบนเดสก์ท็อป — default: แสดง (false) */
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false);
  /** mount เสร็จแล้ว — อ่าน preference จาก localStorage ได้แล้วเท่านั้น (กัน hydration mismatch) */
  const [headerPrefHydrated, setHeaderPrefHydrated] = useState(false);
  /** หน้าจาก QR พนักงาน — โฟกัสคิว/เช็กอิน ไม่แสดงเมนูร้าน */
  const hideBarberChrome = pathname === "/dashboard/barber/staff";
  /**
   * ไม่ห่อเนื้อหาด้วยการ์ดกระจกชั้นใน — หน้าเหล่านี้มีการ์ด/เซกชันของตัวเองอยู่แล้ว (ซ้อนกับขอบโมดูลนอกเกินไป)
   */
  const plainInnerContent =
    hideBarberChrome ||
    pathname === "/dashboard/barber/finance" ||
    pathname === "/dashboard/barber/packages" ||
    pathname === "/dashboard/barber/qr";

  /** โหลด preference ซ่อนหัวจาก localStorage หลัง mount (SSR-safe) */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BARBER_HEADER_COLLAPSED_KEY);
      if (stored === "1") setHeaderCollapsed(true);
    } catch {
      /* storage ไม่พร้อม — ใช้ default */
    } finally {
      setHeaderPrefHydrated(true);
    }
  }, []);

  /** Persist preference: ซ่อน/แสดงหัวโมดูล */
  const toggleHeader = () => {
    const next = !headerCollapsed;
    setHeaderCollapsed(next);
    try {
      window.localStorage.setItem(BARBER_HEADER_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        barberContentStackClass,
        /* เว้นที่ให้แถบ dock ลอยแบบสนามฟุตบอล / ร้านเครื่องดื่ม (MASTER.md §1) */
        !hideBarberChrome && barberMainPaddingBottomClass,
      )}
    >
      {!hideBarberChrome ? (
        <>
          <div className={cn(barberGlassShellClass, "p-4 sm:px-8 sm:py-6 print:hidden")}>
            <header>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className={barberModuleIconBadgeClass} aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className={cn(barberHeaderEnLabelClass, "hidden sm:block")} aria-hidden>
                        {BARBER_MODULE_EN_LABEL}
                      </p>
                      <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl" id="barber-module-title">
                        {BARBER_MODULE_TITLE}
                      </h1>
                    </div>
                  </div>
                </div>

                <div className={barberHeaderToolbarGroupClass}>
                  <button
                    type="button"
                    onClick={toggleHeader}
                    className={cn("inline-flex", barberHeaderCollapseBtnClass)}
                    aria-expanded={headerCollapsed ? "false" : "true"}
                    aria-controls="barber-desktop-nav-section"
                    aria-label={headerCollapsed ? "แสดงกลุ่มเมนูส่วนหัว" : "ซ่อนกลุ่มเมนูส่วนหัว"}
                    suppressHydrationWarning
                  >
                    {headerPrefHydrated ?
                      <BarberHeaderChevron expanded={!headerCollapsed} />
                    : /* SSR placeholder (กัน hydration mismatch) */
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden>
                        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsageGuideOpen(true)}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-[0.98]"
                    aria-haspopup="dialog"
                    aria-expanded={usageGuideOpen}
                    aria-label="คู่มือการใช้งาน"
                    suppressHydrationWarning
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                      <circle cx="12" cy="17" r="1" />
                    </svg>
                    <span className="hidden sm:inline">คู่มือ</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Accent bar — เฉพาะหัวหลักเท่านั้น (MASTER.md §4) */}
            <div className="mt-5">
              <div className={barberAccentBarClass} aria-hidden />
            </div>

            {!headerCollapsed ?
              <div id="barber-desktop-nav-section">
                <BarberModuleDesktopNav pathname={pathname} />
              </div>
            : null}
          </div>
          <BarberModuleMobileDock pathname={pathname} />
        </>
      ) : null}

      {!hideBarberChrome ? (
        <BarberUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />
      ) : null}

      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ส่งออก QR ปิด
        </TrialSandboxStrip>
      ) : null}

      {plainInnerContent ?
        <div className={cn("flex min-w-0 flex-col", barberContentStackClass)}>{children}</div>
      : <div className={barberModuleContentShellClass}>{children}</div>}
    </div>
  );
}
