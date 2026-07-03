"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import { MassageModuleDesktopNav, MassageModuleMobileDock } from "./MassageModuleHeader";
import { MassageUsageGuideModal } from "./MassageUsageGuideModal";

/** ชื่อระบบโมดูล — แสดงเป็นหัวข้อหลักด้านบน */
const MASSAGE_MODULE_TITLE = "ร้านนวด";
/** คำอธิบายสั้นใต้ชื่อระบบ */
const MASSAGE_MODULE_TAGLINE = "คิว · แพ็กเกจ · การเงิน · QR";

/** แผงหัว + เมนูแบบเดียวกับคาร์แคร์ (glass — มือถือใช้ rounded-[2.5rem] เหมือนกัน ไม่ลดเหลือ 2xl) */
const massageModuleGlassShellClass = cn(
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
  "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
  "sm:px-8 sm:py-6 print:hidden",
);

/** พื้นที่เนื้อหาโมดูล — โทนกระจกอ่อน โค้งระดับแผงใหญ่คาร์แคร์ */
const massageModuleContentShellClass = cn(
  "min-w-0 overflow-hidden rounded-[2.5rem] border border-white/45 bg-white/35 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl ring-1 ring-inset ring-white/50",
  "p-4 sm:p-5 md:p-6 print:border-0 print:shadow-none",
);

export function MassageLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  /** format บนเซิร์ฟเวอร์แล้ว — กัน hydration กับ toLocaleString บน client */
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  /** หน้าจาก QR พนักงาน — โฟกัสคิว/เช็กอิน ไม่แสดงเมนูร้าน */
  const hideMassageChrome = pathname === "/dashboard/massage/staff";
  /**
   * ไม่ห่อเนื้อหาด้วยการ์ดกระจกชั้นใน — หน้าเหล่านี้มีการ์ด/เซกชันของตัวเองอยู่แล้ว (ซ้อนกับขอบโมดูลนอกเกินไป)
   */
  const plainInnerContent =
    hideMassageChrome ||
    pathname === "/dashboard/massage/finance" ||
    pathname === "/dashboard/massage/packages" ||
    pathname === "/dashboard/massage/qr";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 sm:gap-6",
        /* เว้นที่ให้แถบ dock ลอยแบบคาร์แคร์ (pb-20 + bottom offset) */
        !hideMassageChrome && "max-lg:pb-24 lg:pb-0",
      )}
    >
      {!hideMassageChrome ? (
        <>
          <div className={massageModuleGlassShellClass}>
            <header>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#f06dc8] text-white shadow-lg shadow-indigo-100"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl" id="massage-module-title">
                        {MASSAGE_MODULE_TITLE}
                      </h1>
                      <p
                        id="massage-module-tagline"
                        className="mt-0.5 hidden truncate text-xs font-semibold text-slate-500 md:block"
                      >
                        {MASSAGE_MODULE_TAGLINE}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUsageGuideOpen(true)}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95"
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
            </header>

            <MassageModuleDesktopNav pathname={pathname} />
          </div>
          <MassageModuleMobileDock pathname={pathname} />
        </>
      ) : null}

      {!hideMassageChrome ? (
        <MassageUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />
      ) : null}

      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ส่งออก QR ปิด
        </TrialSandboxStrip>
      ) : null}

      {plainInnerContent ?
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{children}</div>
      : <div className={massageModuleContentShellClass}>{children}</div>}
    </div>
  );
}
