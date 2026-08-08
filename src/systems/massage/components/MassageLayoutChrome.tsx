"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TrialSandboxStrip } from "@/components/dashboard/TrialSandboxStrip";
import { cn } from "@/lib/cn";
import {
  MASSAGE_HEADER_COLLAPSE_EVENT,
  MASSAGE_MODULE_DISPLAY_NAME,
  isMassageModuleNavItemActive,
  massageModuleNavIcon,
  MASSAGE_NAV_ITEMS,
  massagePathFlags,
  readMassageHeaderCollapsed,
  writeMassageHeaderCollapsed,
  type MassageModuleNavKey,
} from "@/systems/massage/massage-module-nav";
import {
  massageHeaderToolbarGroupClass,
  massageModuleContentShellClass,
  massageNavActiveGradientClass,
  massageNavIdleClass,
  massageNavItemBaseClass,
  massageShellAccentBarClass,
  massageShellWrapperClass,
  massageEnEyebrowLabelClass,
  massageHorizontalScrollerClass,
} from "@/systems/massage/components/massage-ui-tokens";
import { MassageUsageGuideModal } from "./MassageUsageGuideModal";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";

/** §12 3-line hamburger glyph (ไม่ใช่ chevron) */
function MassageHeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  void collapsed;
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden
    >
      {/* Always render 3 full lines as SSR-safe placeholder (hotel pattern — no hydration mismatch) */}
      <path d="M4 8h16M4 12h16M4 16h16" strokeLinecap="round" />
    </svg>
  );
}

/**
 * §12 Main module DESKTOP nav (อยู่ใน glass shell header) — เมื่อซ่อน header จะหายไปด้วย
 * Nav items: 5 ใบตรงกับ MASSAGE_NAV_ITEMS (dashboard/finance/packages/qr/settings)
 * Active: brand gradient (§4 single source of truth)
 */
export function MassageModuleDesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="เมนูร้านนวด"
      className="mt-5 hidden items-center justify-between gap-1 border-t border-white/40 pt-5 lg:flex print:hidden"
    >
      <ul className={cn(massageHorizontalScrollerClass, "w-full justify-start")}>
        {MASSAGE_NAV_ITEMS.map((item) => {
          const active = isMassageModuleNavItemActive(pathname, item.key);
          const icon = massageModuleNavIcon(item.key);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
                className={cn(massageNavItemBaseClass, "gap-2 min-w-0", active ? massageNavActiveGradientClass : massageNavIdleClass)}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("h-4 w-4 shrink-0")}
                  aria-hidden
                >
                  {icon}
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * §12 Mobile dock nav (ล่างจอ) — grid-cols-5 เพราะ 5 ใบพอดี
 * Icon: stroke 2.5, active = brand gradient
 */
export function MassageModuleMobileDock({ pathname }: { pathname: string }) {
  return (
    <AppMobileDockShell ariaLabel="เมนูล่างร้านนวด">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {MASSAGE_NAV_ITEMS.map((item) => {
          const active = isMassageModuleNavItemActive(pathname, item.key);
          const icon = massageModuleNavIcon(item.key);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-90",
                  active ? massageNavActiveGradientClass : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                  aria-hidden
                >
                  {icon}
                </svg>
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}

export function MassageLayoutChrome({
  children,
  trialExpiresLabel,
}: {
  children: React.ReactNode;
  trialExpiresLabel?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const flags = massagePathFlags(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  /** §12 Header collapse state — hotel event/storage sync */
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  useEffect(() => {
    if (flags.onStaff) {
      setHeaderCollapsed(false);
      return;
    }
    const sync = () => setHeaderCollapsed(readMassageHeaderCollapsed());
    sync();
    window.addEventListener(MASSAGE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MASSAGE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [flags.onStaff]);
  const toggleHeader = useCallback(() => {
    writeMassageHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  /** Module icon (นิ้วนวดม่วง-ชมพู brand gradient) */
  const moduleIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 sm:gap-6",
        !flags.onStaff && "max-lg:pb-24 lg:pb-0",
      )}
    >
      {!flags.onStaff ? (
        <>
          {/* §12 ซ่อน header ทั้งใบ (ไม่ใช่แค่ nav) ด้วย `hidden` บน wrapper class ตรง hotel pattern */}
          <header
            className={cn(massageShellWrapperClass, headerCollapsed && "hidden")}
            aria-label="ส่วนหัวโมดูลร้านนวด"
          >
            <div className={massageShellAccentBarClass} aria-hidden />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#ec4899] text-white shadow-lg shadow-indigo-100"
                    aria-hidden
                  >
                    {moduleIcon}
                  </div>
                  <div className="min-w-0">
                    {/* §7 EN Eyebrow label + TH title — ห้ามมี description/line ภายใต้หัวข้อ */}
                    <p className={massageEnEyebrowLabelClass}>{MASSAGE_EN_LABEL}</p>
                    <h1
                      className="mt-0.5 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl"
                      id="massage-module-title"
                    >
                      {MASSAGE_MODULE_DISPLAY_NAME}
                    </h1>
                  </div>
                </div>
              </div>
              {/* §12 Header toolbar: collapse 3-lines + guide button */}
              <div className={massageHeaderToolbarGroupClass}>
                <button
                  type="button"
                  onClick={toggleHeader}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/45 px-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95",
                  )}
                  aria-pressed={headerCollapsed}
                  title="ซ่อนส่วนหัวโมดูล"
                  aria-label="ซ่อนส่วนหัวโมดูล"
                  suppressHydrationWarning
                >
                  <MassageHeaderCollapseGlyph collapsed={headerCollapsed} />
                </button>
                <button
                  type="button"
                  onClick={() => setUsageGuideOpen(true)}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/45 px-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95"
                  aria-haspopup="dialog"
                  aria-expanded={usageGuideOpen}
                  aria-label="คู่มือการใช้งาน"
                  suppressHydrationWarning
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 1 1 5 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1" />
                  </svg>
                  <span className="hidden sm:inline">คู่มือ</span>
                </button>
              </div>
            </div>
            <MassageModuleDesktopNav pathname={pathname} />
          </header>
          <MassageModuleMobileDock pathname={pathname} />
        </>
      ) : null}

      {!flags.onStaff ? (
        <MassageUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />
      ) : null}

      {trialExpiresLabel ? (
        <TrialSandboxStrip>
          ทดลอง · หมด {trialExpiresLabel} · ส่งออก QR ปิด
        </TrialSandboxStrip>
      ) : null}

      {flags.plainInner ? (
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{children}</div>
      ) : (
        <div className={massageModuleContentShellClass}>{children}</div>
      )}
    </div>
  );
}

/** §7 EN Label constant (ซ่อน description tagline เดิม "คิว · แพ็กเกจ · การเงิน · QR" — เอาออกตามกฎ ไม่อนุญาตให้มีคำบรรยายใต้หัวข้อ) */
const MASSAGE_EN_LABEL = "MASSAGE STUDIO";
