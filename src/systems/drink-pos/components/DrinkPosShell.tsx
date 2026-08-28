"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  drinkPosAccentBarClass,
  drinkPosGlassShellClass,
  drinkPosMainPaddingBottomClass,
  drinkPosNavActiveClass,
  drinkPosNavIdleClass,
} from "@/systems/drink-pos/lib/ui-tokens";
import { DrinkPosMobileBottomProvider } from "@/systems/drink-pos/components/DrinkPosMobileBottomChrome";
import {
  DRINK_POS_HEADER_COLLAPSE_EVENT,
  DRINK_POS_NAV_ITEMS,
  DRINK_POS_ORDER_HREF,
  isDrinkPosNavItemActive,
  readDrinkPosHeaderCollapsed,
  writeDrinkPosHeaderCollapsed,
  type DrinkPosNavKey,
} from "@/systems/drink-pos/lib/drink-pos-module-nav";

function IconTabOrder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 3h12v4H6zM7 7v13h10V7" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h4" strokeLinecap="round" />
    </svg>
  );
}

function IconTabProducts({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M6 8h15l-1.5 9H7.5L6 8zM6 8L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21a1 1 0 002 0M16 21a1 1 0 002 0" strokeLinecap="round" />
    </svg>
  );
}

function IconTabSales({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTabMembers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" />
      <path d="M16 7l1.5 1.5M18 4v3M21 5.5h-3" strokeLinecap="round" />
    </svg>
  );
}

function IconTabSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTabOrdersQueue({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

function navIcon(key: DrinkPosNavKey, className?: string) {
  switch (key) {
    case "order":
      return <IconTabOrder className={className} />;
    case "orders":
      return <IconTabOrdersQueue className={className} />;
    case "products":
      return <IconTabProducts className={className} />;
    case "finance":
      return <IconTabSales className={className} />;
    case "settings":
      return <IconTabSettings className={className} />;
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
        active ? drinkPosNavActiveClass : drinkPosNavIdleClass,
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
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function DrinkPosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const onOrderPage = pathname === DRINK_POS_ORDER_HREF || pathname.startsWith(`${DRINK_POS_ORDER_HREF}/`);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readDrinkPosHeaderCollapsed());
    sync();
    window.addEventListener(DRINK_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DRINK_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeDrinkPosHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <DrinkPosMobileBottomProvider>
      <div
        className={cn(
          "flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6",
          onOrderPage && "lg:h-full lg:max-h-full lg:overflow-hidden lg:gap-3",
        )}
      >
        <header
          className={cn(
            drinkPosGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={drinkPosAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-5 w-5" aria-hidden>
                  <path d="M8 3h8l1 4H7l1-4zM6 7h12v2a5 5 0 01-5 5 5 5 0 01-5-5V7z" strokeLinejoin="round" />
                  <path d="M9 14v4M12 14v4M15 14v4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  POS ร้านเครื่องดื่ม
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
                <HeaderCollapseGlyph collapsed={false} />
              </button>
            </div>
          </div>

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูล POS ร้านเครื่องดื่ม"
          >
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DRINK_POS_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isDrinkPosNavItemActive(pathname, item.key)}
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
          title="คู่มือการใช้งาน — POS ร้านเครื่องดื่ม"
          subtitle="ออร์เดอร์ สินค้า และยอดขาย"
          sections={[
            {
              title: "ออร์เดอร์",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ซ้าย: ค้นหาสมาชิกและรายการที่เลือก</li>
                  <li>ขวา: เลือกเมนูสินค้าแบบเต็มจอ</li>
                </ul>
              ),
            },
            {
              title: "คิวออเดอร์",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>ดูสถานะ: รับออเดอร์ · กำลังทำ · เสร็จแล้ว (แยกสี)</li>
                  <li>ลิงก์แผนกทำ / เสิร์ฟ · QR ลูกค้า — อยู่ในเมนู «ตั้งค่า» แท็บลิงก์ QR</li>
                </ul>
              ),
            },
            {
              title: "เมนูหลัก",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>แท็บเมนูอยู่ในส่วนหัว — กดซ่อนเพื่อย้ายไปแถบบน (มือถือและคอมพิวเตอร์)</li>
                  <li>มือถือยังใช้เมนูล่างสลับหน้าได้</li>
                </ul>
              ),
            },
            {
              title: "หน้าสินค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>จัดการหมวดและสินค้า · แตะการ์ดเพื่อทดลองเพิ่มในบิล</li>
                </ul>
              ),
            },
          ]}
        />

        <div
          className={cn(
            drinkPosMainPaddingBottomClass,
            appModuleShellMainScrollClass,
            onOrderPage && "lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:pb-0",
          )}
        >
          {children}
        </div>
      </div>
    </DrinkPosMobileBottomProvider>
  );
}
