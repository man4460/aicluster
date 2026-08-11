"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  generalStorePosAccentBarClass,
  generalStorePosGlassShellClass,
  generalStorePosMainPaddingBottomClass,
  generalStorePosNavActiveClass,
  generalStorePosNavIdleClass,
} from "@/systems/general-store-pos/lib/ui-tokens";
import { GeneralStorePosMobileBottomProvider } from "@/systems/general-store-pos/components/GeneralStorePosMobileBottomChrome";
import { GeneralStorePosHeaderBarNav } from "@/systems/general-store-pos/components/GeneralStorePosHeaderBarNav";
import {
  GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT,
  GENERAL_STORE_POS_MODULE_DISPLAY_NAME,
  GENERAL_STORE_POS_NAV_ITEMS,
  isGeneralStorePosNavItemActive,
  readGeneralStorePosHeaderCollapsed,
  writeGeneralStorePosHeaderCollapsed,
  type GeneralStorePosNavKey,
} from "@/systems/general-store-pos/general-store-pos-module-nav";

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

function navIcon(key: GeneralStorePosNavKey, className?: string) {
  switch (key) {
    case "products":
      return <IconTabProducts className={className} />;
    case "sales":
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
        active ? generalStorePosNavActiveClass : generalStorePosNavIdleClass,
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
        <path d="M6 9l6-6 6 6M6 15l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 15l6 6 6-6M6 9l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)" />
      )}
    </svg>
  );
}

export function GeneralStorePosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readGeneralStorePosHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readGeneralStorePosHeaderCollapsed());
    sync();
    window.addEventListener(GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeGeneralStorePosHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <GeneralStorePosMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        {headerCollapsed ? (
          <div className="sticky top-0 z-40 print:hidden">
            <div className={cn("mx-auto flex max-w-full items-center gap-2 rounded-2xl px-2 py-2 sm:rounded-3xl sm:px-3 sm:py-2.5", appDashboardBrandGradientFillClass)}>
              <GeneralStorePosHeaderBarNav onExpand={toggleHeaderCollapse} />
            </div>
          </div>
        ) : null}
        <header
          className={cn(
            generalStorePosGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={generalStorePosAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-5 w-5" aria-hidden>
                  <path d="M6 8h15l-1.5 9H7.5L6 8zM6 8L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 21a1 1 0 002 0M16 21a1 1 0 002 0" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {GENERAL_STORE_POS_MODULE_DISPLAY_NAME}
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
            aria-label="เมนูโมดูล POS ร้านทั่วไป"
          >
            <ul className="grid grid-cols-3 gap-2">
              {GENERAL_STORE_POS_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isGeneralStorePosNavItemActive(pathname, item.key)}
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
          title="คู่มือการใช้งาน — POS ร้านทั่วไป"
          subtitle="หน้าสินค้า ยอดขาย และปุ่มเมนู"
          sections={[
            {
              title: "เมนูหลัก (คอมพิวเตอร์)",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>
                    <strong className="font-semibold text-[#2e2a58]">สินค้า</strong> / <strong className="font-semibold text-[#2e2a58]">ยอดขาย</strong>{" "}
                    อยู่ในแถบเดียวกัน แบ่งซ้าย–ขวาเต็มความกว้าง (แบบคาร์แคร์) — ไม่ต้องมีคำอธิบายยาวใต้ชื่อโมดูล
                  </li>
                  <li>มือถือใช้เมนูล่างแทน — ดูกฎ dock ของโมดูลนี้ใน repo</li>
                </ul>
              ),
            },
            {
              title: "หน้าสินค้า",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>การ์ดสรุปด้านบน: หมวด / สินค้าเปิดขาย / แนะนำ / ยอดขายวันนี้ (กทม.)</li>
                  <li>กรองหมวด: แถบชิปเลื่อนแนวนอน — แตะหมวดเพื่อกรองการ์ดสินค้า</li>
                  <li>
                    แตะการ์ดสินค้า: ครั้งเดียวเพิ่มในบิล 1 ชิ้น — แตะซ้ำเร็วบนการ์ดเดิมเพิ่ม 2 ชิ้น (ช่วงเวลาสั้น ๆ ตามโค้ด{" "}
                    <code className="rounded bg-[#ecebff] px-1 text-xs">GENERAL_STORE_CARD_DOUBLE_TAP_MS</code>)
                  </li>
                  <li>แก้ไข / ลบสินค้า: ไอคอนด้านล่างการ์ด (ไม่ใช้ข้อความยาวบนการ์ด)</li>
                  <li>รายการรอก่อนบันทึกบิล: มือถืออยู่เหนือ dock — เดสก์ท็อปเป็นการ์ดลอยมุมขวาล่าง</li>
                  <li>
                    ปุ่ม <strong className="font-semibold text-[#2e2a58]">แนะภาพตามสินค้า</strong> / <strong className="font-semibold text-[#2e2a58]">แนะภาพตามหมวด</strong>: เติม URL รูปตัวอย่างจากชื่อสินค้า+หมวดหรือชื่อหมวด — ควรอัปโหลดรูปจริงของร้านก่อนขาย
                  </li>
                </ul>
              ),
            },
            {
              title: "หน้ายอดขาย",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>กราฟ 7 วัน + ยอดรวมด้านขวา — กรองบิลแล้วกราฟสะท้อนตามข้อมูลที่กรอง</li>
                  <li>ปุ่มรีเฟรชอยู่ข้างปุ่มบันทึกขายในการ์ดบิล — มือถือเป็นไอคอนล้วน</li>
                  <li>ฟิลเตอร์มือถือ: ไอคอนกรอง — เดสก์ท็อปแสดงฟอร์มเต็ม</li>
                </ul>
              ),
            },
            {
              title: "ข้อความใน UI",
              content: (
                <p>
                  ไม่ใส่คำอธิบายการตลาดหรือคู่มือยาวใน shell / หัวการ์ด / โมดัล — ใช้โมดัลคู่มือนี้และ{" "}
                  <code className="rounded bg-[#ecebff] px-1 text-xs">aria-label</code> แทน
                </p>
              ),
            },
          ]}
        />

        <div
          className={cn(
            generalStorePosMainPaddingBottomClass,
            appModuleShellMainScrollClass,
          )}
        >
          {children}
        </div>
      </div>
    </GeneralStorePosMobileBottomProvider>
  );
}
