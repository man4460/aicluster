"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AppMobileDockShell,
  AppUsageGuideModal,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  USED_CAR_SHOWROOM_HEADER_COLLAPSE_EVENT,
  USED_CAR_SHOWROOM_MODULE_DISPLAY_NAME,
  USED_CAR_SHOWROOM_NAV_ITEMS,
  usedCarShowroomModuleNavIcon,
  isUsedCarShowroomModuleNavItemActive,
  readUsedCarShowroomHeaderCollapsed,
  writeUsedCarShowroomHeaderCollapsed,
} from "@/systems/used-car-showroom/used-car-showroom-module-nav";

const shellClass = cn(
  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
  "print:hidden",
);

const navLinkClass = (active: boolean) =>
  cn(
    "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-bold transition-all",
    active
      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
  );

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

function UsedCarShowroomModuleChromeInner({
  children,
  shopName,
}: {
  children: ReactNode;
  shopName?: string;
}) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readUsedCarShowroomHeaderCollapsed());
    sync();
    window.addEventListener(USED_CAR_SHOWROOM_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USED_CAR_SHOWROOM_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeUsedCarShowroomHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header
        className={cn(shellClass, "flex flex-col px-4 py-4 sm:px-6 sm:py-5", headerCollapsed && "hidden")}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-sm"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path
                  d="M5 17h14M7 17l1.2-5.5A2 2 0 0 1 10.15 10h3.7a2 2 0 0 1 1.95 1.5L17 17M8 10l1-3h6l1 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="8.5" cy="17" r="1.5" />
                <circle cx="15.5" cy="17" r="1.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">โมดูล</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {USED_CAR_SHOWROOM_MODULE_DISPLAY_NAME}
              </h1>
              {shopName ? (
                <p className="mt-0.5 truncate text-xs font-medium text-[#66638c]">{shopName}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-9 min-h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-slate-50 active:scale-95 sm:w-auto sm:gap-2 sm:px-3"
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
              className="inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-white text-sky-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
              suppressHydrationWarning
            >
              <HeaderCollapseGlyph collapsed={false} />
            </button>
          </div>
        </div>

        <nav aria-label="เมนูโชว์รูมรถมือสอง" className="mt-4 hidden border-t border-slate-200/80 pt-4 lg:block print:hidden">
          <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {USED_CAR_SHOWROOM_NAV_ITEMS.map((item) => {
              const active = isUsedCarShowroomModuleNavItemActive(pathname, item.key);
              return (
                <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                  <Link href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                      {usedCarShowroomModuleNavIcon(item.key)}
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — โชว์รูมรถมือสอง"
        subtitle="แดชบอร์ด · การจัดการ · การเงิน · ตั้งค่า · เว็บ /car/[slug]"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-sky-700">
                <li>ตั้งค่าพื้นฐาน + พร้อมเพย์/บัญชี + โหมดมัดจำ</li>
                <li>ตั้งค่าเว็บไซต์ — slug · แบนเนอร์ · เปิดพอร์ทัล</li>
                <li>เพิ่มรถ (ทุนซื้อ → รายจ่าย «รับซื้อรถ») · ต้นทุนซ่อม/ล้าง · รูปปก · YouTube</li>
                <li>เปลี่ยนสถานะเป็นพร้อมขาย · แชร์ลิงก์ /car/[slug]</li>
                <li>จอง/ปิดดีล → รายได้ «ขายรถ» · ค่าคอมเป็นรายจ่ายผูกรถ</li>
              </ol>
            ),
          },
          {
            title: "เมนูหลัก",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-sky-700">
                <li>แดชบอร์ด — สถิติคลิกได้ · สต็อก · จอง · นัด · ไฟแนนซ์รอ · คิดค่างวด</li>
                <li>การจัดการ — รถ · P&L · พนักงาน · โปร · ลูกค้า · บริษัทไฟแนนซ์</li>
                <li>การเงิน — รายรับ–รายจ่าย · หมวด · กราฟ</li>
                <li>ตั้งค่า — พื้นฐาน · การเงิน · เว็บ · ลิงก์/QR (รายเดือน)</li>
              </ul>
            ),
          },
          {
            title: "ค่าคอม & P&L",
            content: (
              <p>
                ค่าคอมไม่ใส่ในต้นทุนซ่อม/ล้าง — บันทึกเป็นรายจ่ายหมวด «ค่าคอม» และบังคับผูกรถ
                กำไรสุทธิ = ราคาขายสุทธิ − (ทุนซื้อ + ค่าปรับสภาพ + ค่าคอม)
              </p>
            ),
          },
        ]}
      />

      {children}

      <AppMobileDockShell ariaLabel="เมนูล่างโชว์รูมรถมือสอง">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {USED_CAR_SHOWROOM_NAV_ITEMS.map((item) => {
            const active = isUsedCarShowroomModuleNavItemActive(pathname, item.key);
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    {usedCarShowroomModuleNavIcon(item.key)}
                  </svg>
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                    {item.shortLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>
    </div>
  );
}

export function UsedCarShowroomModuleChrome({
  children,
  shopName,
}: {
  children: ReactNode;
  shopName?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6 max-lg:pb-24 lg:pb-0">{children}</div>
      }
    >
      <UsedCarShowroomModuleChromeInner shopName={shopName}>{children}</UsedCarShowroomModuleChromeInner>
    </Suspense>
  );
}
