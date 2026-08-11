"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT,
  DOC_TRANSMISSION_MODULE_DISPLAY_NAME,
  DOC_TRANSMISSION_NAV_ITEMS,
  docTransmissionPathFlags,
  isDocTransmissionNavItemActive,
  readDocTransmissionHeaderCollapsed,
  writeDocTransmissionHeaderCollapsed,
  type DocTransmissionNavKey,
} from "@/systems/doc-transmission/doc-transmission-module-nav";
import { DocTransmissionMobileBottomProvider } from "@/systems/doc-transmission/components/DocTransmissionMobileBottomChrome";
import { DocTransmissionButton } from "@/systems/doc-transmission/components/DocTransmissionButton";
import {
  docFilterChipClass,
  docSegmentShellClass,
} from "@/systems/doc-transmission/doc-ui-tokens";
import { DOC_CATEGORY_LIST } from "@/systems/doc-transmission/lib/doc-types";
import {
  docTransmissionAccentBarClass,
  docTransmissionGlassShellClass,
  docTransmissionMainPaddingBottomClass,
  docTransmissionModuleIconBadgeClass,
  docTransmissionNavActiveClass,
  docTransmissionNavIdleClass,
} from "@/systems/doc-transmission/lib/ui-tokens";

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function navIcon(key: DocTransmissionNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "records":
      return <IconDoc className={className} />;
    case "master":
      return <IconStack className={className} />;
    case "reports":
      return <IconReport className={className} />;
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
        "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98] w-full sm:min-h-0 sm:w-auto sm:justify-center sm:px-3 sm:text-sm sm:py-2",
        active ? docTransmissionNavActiveClass : docTransmissionNavIdleClass,
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

const masterSubLinks = [
  { href: "/dashboard/doc-transmission/master", label: "หน่วยงาน/แผนก" },
  { href: "/dashboard/doc-transmission/settings", label: "ตั้งค่า" },
] as const;

function DocShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const flags = docTransmissionPathFlags(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readDocTransmissionHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readDocTransmissionHeaderCollapsed());
    sync();
    window.addEventListener(DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeDocTransmissionHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  const inRecordsGroup = flags.isRecords;
  const inMasterGroup = flags.isMaster;

  const recordsSubLinks = DOC_CATEGORY_LIST.map((c) => ({
    href: `/dashboard/doc-transmission/records/${c.slug}`,
    label: c.shortTitle,
  }));

  return (
    <div className={cn("max-w-full space-y-4 sm:space-y-6", docTransmissionMainPaddingBottomClass)}>
      <header
        className={cn(
          docTransmissionGlassShellClass,
          "flex shrink-0 flex-col print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className={docTransmissionAccentBarClass} aria-hidden />
        <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                docTransmissionModuleIconBadgeClass,
                "flex items-center justify-center shadow-lg shadow-fuchsia-500/20",
                appDashboardBrandGradientFillClass,
              )}
            >
              <IconDoc className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                {DOC_TRANSMISSION_MODULE_DISPLAY_NAME}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DocTransmissionButton
              type="button"
              onClick={() => setUsageGuideOpen(true)}
              className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-1.5 sm:px-4 sm:inline-flex"
              aria-label="คู่มือการใช้งาน"
              aria-haspopup="dialog"
              aria-expanded={usageGuideOpen}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" />
              </svg>
              <span className="hidden sm:inline">คู่มือการใช้งาน</span>
            </DocTransmissionButton>
            <DocTransmissionButton
              type="button"
              onClick={toggleHeaderCollapse}
              className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวโมดูล"
              title="ซ่อนส่วนหัวโมดูล"
            >
              <HeaderCollapseGlyph collapsed={headerCollapsed} />
            </DocTransmissionButton>
          </div>
        </div>
        <nav aria-label="เมนู สารบรรณดิจิทัล" className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden">
          <ul className="grid grid-cols-4 gap-2">
            {DOC_TRANSMISSION_NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <TabLink
                  href={item.href}
                  label={item.label}
                  active={isDocTransmissionNavItemActive(pathname, item.key)}
                  icon={navIcon(item.key, "h-4 w-4")}
                />
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {inRecordsGroup ? (
        <nav aria-label="เมนูย่อยหมวดหมู่เอกสาร" className={docSegmentShellClass}>
          <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {recordsSubLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("flex w-full items-center justify-center", docFilterChipClass(active))}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {inMasterGroup ? (
        <nav aria-label="เมนูย่อยข้อมูลหลัก" className={docSegmentShellClass}>
          <ul className="grid grid-cols-2 gap-1.5">
            {masterSubLinks.map((item) => {
              const active =
                item.href === "/dashboard/doc-transmission/master"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("flex w-full items-center justify-center", docFilterChipClass(active))}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — สารบรรณดิจิทัล"
        subtitle="รับ–ส่ง–ติดตามหนังสือ พร้อม timeline และไฟล์แนบ PDF ครบจบในที่เดียว"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                <li>เพิ่มหน่วยงาน/แผนกในเมนูข้อมูลหลัก</li>
                <li>ตั้งชื่อองค์กร + Prefix เลขที่หนังสือในเมนูตั้งค่า</li>
                <li>สร้างเอกสารใหม่ในหมวดที่ต้องการ — ระบบออกเลขให้อัตโนมัติ</li>
                <li>เปิดรายละเอียดเอกสาร → กดปุ่มเหตุการณ์ใน timeline (ลงรับ → มอบหมาย → เสร็จ)</li>
                <li>ใช้ปุ่ม Share เพื่อสร้างลิงก์ดูเอกสารแบบสาธารณะให้ผู้นอกระบบ</li>
              </ol>
            ),
          },
          {
            title: "ฟีเจอร์มืออาชีพ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เลขที่หนังสือออกอัตโนมัติ (running per ปี/หมวด) + tracking code/QR</li>
                <li>Workflow timeline บันทึกทุกขั้น พร้อมผู้ดำเนินการ + เวลา</li>
                <li>ไฟล์แนบ PDF เก็บประวัติเวอร์ชัน (revision) — ดูย้อนหลังได้</li>
                <li>Audit log บันทึกการแก้ไข/ลบ/เปลี่ยนสถานะ — ตรวจสอบย้อนหลัง</li>
                <li>ค้นหา/กรองได้ทุกฟิลด์: หมวด, ปี, สถานะ, ความเร่งด่วน, หน่วยงาน</li>
                <li>Export CSV ทั้งหมด หรือเฉพาะหมวด/ปี/ช่วงวันที่</li>
                <li>Public share link (read-only) — ส่งให้คนนอกระบบดูเอกสาร</li>
                <li>กำหนดวันครบกำหนด (due date) เพื่อดูภาพรวม "เลยกำหนด" ในแดชบอร์ด</li>
                <li>แยกหมวด: คำสั่ง / บันทึกข้อความ / รับเข้า / ส่งออก / หนังสือเวียน — สอดคล้องงานสารบรรณจริง</li>
              </ul>
            ),
          },
        ]}
      />

      <main className={cn(appModuleShellMainScrollClass, "min-h-0 w-full flex-1")}>
        {children}
      </main>
    </div>
  );
}

export function DocShell({ children }: { children: React.ReactNode }) {
  return (
    <DocTransmissionMobileBottomProvider>
      <DocShellInner>{children}</DocShellInner>
    </DocTransmissionMobileBottomProvider>
  );
}
