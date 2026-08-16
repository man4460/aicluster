"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import {
  BARBER_HEADER_COLLAPSE_EVENT,
  BARBER_MODULE_DISPLAY_NAME,
  barberPathFlags,
  readBarberHeaderCollapsed,
  writeBarberHeaderCollapsed,
} from "@/systems/barber/barber-module-nav";
import {
  barberAccentBarClass,
  barberContentStackClass,
  barberGlassShellClass,
  barberHeaderCollapseBtnClass,
  barberHeaderEnLabelClass,
  barberHeaderToolbarGroupClass,
  barberMainPaddingBottomClass,
  barberModuleContentShellClass,
  barberModuleIconBadgeClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BarberModuleDesktopNav, BarberModuleMobileDock } from "./BarberModuleHeader";
import { BarberUsageGuideModal } from "./BarberUsageGuideModal";

const BARBER_MODULE_EN_LABEL = "BARBER SHOP";

function BarberHeaderCollapseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

export function BarberLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const flags = barberPathFlags(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    if (flags.onStaff) {
      setHeaderCollapsed(false);
      return;
    }
    const sync = () => setHeaderCollapsed(readBarberHeaderCollapsed());
    sync();
    window.addEventListener(BARBER_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BARBER_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [flags.onStaff]);

  const toggleHeader = useCallback(() => {
    writeBarberHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  /** พอร์ทัลพนักงาน — เต็มจอแบบสนามฟุตบอล ไม่มีหัว/dock โมดูล */
  if (flags.onStaff) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <div className={cn("flex min-w-0 flex-col", barberContentStackClass, barberMainPaddingBottomClass)}>
      <div
        className={cn(barberGlassShellClass, "p-3 sm:px-8 sm:py-6 print:hidden", headerCollapsed && "hidden")}
      >
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
                    {BARBER_MODULE_DISPLAY_NAME}
                  </h1>
                </div>
              </div>
            </div>

            <div className={barberHeaderToolbarGroupClass}>
              <button
                type="button"
                onClick={toggleHeader}
                className={cn("inline-flex", barberHeaderCollapseBtnClass)}
                aria-expanded={!headerCollapsed}
                aria-label={headerCollapsed ? "แสดงส่วนหัวโมดูล" : "ซ่อนส่วนหัวโมดูล"}
                suppressHydrationWarning
              >
                <BarberHeaderCollapseGlyph />
              </button>
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="flex h-10 shrink-0 items-center gap-2 rounded-[1rem] border border-white/60 bg-white/45 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-[0.98]"
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

        <div className="mt-5">
          <div className={barberAccentBarClass} aria-hidden />
        </div>

        <BarberModuleDesktopNav pathname={pathname} />
      </div>
      <BarberModuleMobileDock pathname={pathname} />

      <BarberUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />

      {trialExpiresLabel ? (
        <TrialSandboxStrip>ทดลอง · หมด {trialExpiresLabel} · ส่งออก QR ปิด</TrialSandboxStrip>
      ) : null}

      {flags.plainInner ? (
        <div className={cn("flex min-w-0 flex-col", barberContentStackClass)}>{children}</div>
      ) : (
        <div className={barberModuleContentShellClass}>{children}</div>
      )}
    </div>
  );
}
