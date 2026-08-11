"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { LoyaltyStampMobileBottomProvider } from "@/systems/loyalty-stamp/components/LoyaltyStampMobileBottomChrome";
import {
  LOYALTY_STAMP_HEADER_COLLAPSE_EVENT,
  LOYALTY_STAMP_MODULE_DISPLAY_NAME,
  LOYALTY_STAMP_NAV_ITEMS,
  isLoyaltyStampNavItemActive,
  readLoyaltyStampHeaderCollapsed,
  writeLoyaltyStampHeaderCollapsed,
  type LoyaltyStampNavKey,
} from "@/systems/loyalty-stamp/loyalty-stamp-module-nav";
import {
  loyaltyStampAccentBarClass,
  loyaltyStampGlassShellClass,
  loyaltyStampMainPaddingBottomClass,
  loyaltyStampNavActiveClass,
  loyaltyStampNavIdleClass,
} from "@/systems/loyalty-stamp/lib/ui-tokens";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function IconStampCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8M8 13h5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconQrMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3M17 17h4M14 21v-4M21 14v7" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: LoyaltyStampNavKey, className?: string) {
  switch (key) {
    case "overview":
      return <IconHome className={className} />;
    case "stamp":
      return <IconStampCard className={className} />;
    case "qr":
      return <IconQrMark className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

function TabLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active ? loyaltyStampNavActiveClass : loyaltyStampNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function LoyaltyStampModuleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();
  const tab = sp.get("tab");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readLoyaltyStampHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readLoyaltyStampHeaderCollapsed());
    sync();
    window.addEventListener(LOYALTY_STAMP_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LOYALTY_STAMP_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeLoyaltyStampHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <LoyaltyStampMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            loyaltyStampGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={loyaltyStampAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <IconStampCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {LOYALTY_STAMP_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
                aria-label="คู่มือการใช้งาน"
                aria-haspopup="dialog"
                aria-expanded={usageGuideOpen}
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือการใช้งาน</span>
              </button>
              <button
                type="button"
                onClick={toggleHeaderCollapse}
                className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-pressed={headerCollapsed}
                aria-label="ซ่อนส่วนหัวโมดูล"
                title="ซ่อนส่วนหัวโมดูล"
                suppressHydrationWarning
              >
                <HeaderCollapseGlyph collapsed={headerCollapsed} />
              </button>
            </div>
          </div>

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลสะสมแต้มดิจิทัล"
          >
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOYALTY_STAMP_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label}
                    active={isLoyaltyStampNavItemActive(pathname, tab, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือสะสมแต้มดิจิทัล"
          subtitle="ภาพรวม เพิ่มแต้ม QR และตั้งค่า"
          sections={[
            {
              title: "เมนูหลัก",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>แท็บเมนูอยู่ในส่วนหัว — กดซ่อนเพื่อย้ายไปแถบบน (คอมพิวเตอร์) หรือเหลือเมนูล่าง (มือถือ)</li>
                  <li>มือถือใช้ dock ด้านล่างสลับหน้าตามแพทเทิร์นโรงแรม / POS</li>
                </ul>
              ),
            },
            {
              title: "ภาพรวม",
              content: <p>สถิติการ์ดแต้มที่ออก — สรุปจำนวนลูกค้าแต้มสะสมทั้งหมด</p>,
            },
            {
              title: "เพิ่มแต้ม",
              content: <p>ร้านกดเพิ่มแต้มสำหรับลูกค้าแต่ละคนผ่านเบอร์โทรหรือสแกนลิงก์ลูกค้า</p>,
            },
            {
              title: "QR / ลิงก์",
              content: <p>พิมพ์โปสเตอร์ QR หรือแชร์ลิงก์ให้ลูกค้าเปิดดูการ์ดแต้มออนไลน์ (ไม่ต้องโหลดแอป)</p>,
            },
            {
              title: "ตั้งค่า",
              content: <p>กำหนดจำนวนแต้มสะสม รางวัล และข้อมูลร้าน</p>,
            },
          ]}
        />

        <div className={cn(loyaltyStampMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </LoyaltyStampMobileBottomProvider>
  );
}
