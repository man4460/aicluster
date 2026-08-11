"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT,
  ECOMMERCE_STORE_MODULE_DISPLAY_NAME,
  ECOMMERCE_STORE_NAV_ITEMS,
  ecommerceStorePathFlags,
  isEcommerceStoreNavItemActive,
  readEcommerceStoreHeaderCollapsed,
  writeEcommerceStoreHeaderCollapsed,
  type EcommerceStoreNavKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import { EcommerceStoreMobileBottomProvider } from "@/systems/ecommerce-store/components/EcommerceStoreMobileBottomChrome";
import { EcommerceStoreButton } from "@/systems/ecommerce-store/components/EcommerceStoreButton";
import {
  IconClipboard,
  IconPackage,
  IconSettings,
  IconStore,
  IconUsers,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import {
  ecommerceStoreAccentBarClass,
  ecommerceStoreGlassShellClass,
  ecommerceStoreMainPaddingBottomClass,
  ecommerceStoreModuleIconBadgeClass,
  ecommerceStoreNavActiveClass,
  ecommerceStoreNavIdleClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

const navIcons = {
  dashboard: IconStore,
  products: IconPackage,
  orders: IconClipboard,
  crm: IconUsers,
  settings: IconSettings,
} as const;

function navIcon(key: EcommerceStoreNavKey, className?: string) {
  const IconCmp = navIcons[key];
  return IconCmp ? <IconCmp className={className} /> : null;
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
        "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-all active:scale-[0.98] w-full sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2",
        active ? ecommerceStoreNavActiveClass : ecommerceStoreNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      <span>{label}</span>
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

function EcommerceStoreShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const flags = ecommerceStorePathFlags(pathname);
  const [guideOpen, setGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readEcommerceStoreHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readEcommerceStoreHeaderCollapsed());
    sync();
    window.addEventListener(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeEcommerceStoreHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  void flags;

  return (
    <div className={cn("max-w-full space-y-4 sm:space-y-6", ecommerceStoreMainPaddingBottomClass)}>
      <header
        className={cn(
          ecommerceStoreGlassShellClass,
          "flex shrink-0 flex-col print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className={ecommerceStoreAccentBarClass} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                ecommerceStoreModuleIconBadgeClass,
                "flex items-center justify-center shadow-lg shadow-fuchsia-500/20",
                appDashboardBrandGradientFillClass,
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                {ECOMMERCE_STORE_MODULE_DISPLAY_NAME}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <EcommerceStoreButton
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-1.5 sm:px-4 sm:inline-flex"
              aria-label="คู่มือการใช้งาน"
              aria-haspopup="dialog"
              aria-expanded={guideOpen}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              <span className="hidden sm:inline">คู่มือ</span>
            </EcommerceStoreButton>
            <EcommerceStoreButton
              type="button"
              onClick={toggleHeaderCollapse}
              className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
            >
              <HeaderCollapseGlyph collapsed={headerCollapsed} />
            </EcommerceStoreButton>
          </div>
        </div>
        <nav className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden" aria-label="เมนูร้านออนไลน์">
          <ul className="grid grid-cols-5 gap-2">
            {ECOMMERCE_STORE_NAV_ITEMS.map((item) => {
              const active = isEcommerceStoreNavItemActive(pathname, item.key);
              return (
                <li key={item.key}>
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={active}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="คู่มือร้านออนไลน์"
        sections={[
          {
            title: "เริ่มต้น",
            content:
              "ตั้งค่าร้าน → เพิ่มสินค้าและรูป → คัดลอกลิงก์ /shop แชร์ลูกค้า → ตรวจสลิปที่แท็บออเดอร์",
          },
          {
            title: "PromptPay",
            content: "ใส่เบอร์พร้อมเพย์ในตั้งค่า — หน้าชำระเงินลูกค้าจะเห็น QR ฝังยอดอัตโนมัติ",
          },
          {
            title: "Sale Page",
            content:
              "เลือกสินค้าเด่นในตั้งค่า + เปิดโหมด Sale Page — เหมาะโพสต์ TikTok/FB จบในหน้าเดียว",
          },
          {
            title: "โดเมนส่วนตัว",
            content:
              "ชี้ CNAME มา MAWELL → บันทึกโดเมน → กดยืนยันโดเมน — ลูกค้าเข้า shop.yourbrand.com ได้โดยไม่เห็น /shop/id",
          },
        ]}
      />

      <main className={cn(appModuleShellMainScrollClass, "min-h-0 w-full flex-1")}>
        {children}
      </main>
    </div>
  );
}

export function EcommerceStoreShell({ children }: { children: React.ReactNode }) {
  return (
    <EcommerceStoreMobileBottomProvider>
      <EcommerceStoreShellInner>{children}</EcommerceStoreShellInner>
    </EcommerceStoreMobileBottomProvider>
  );
}
