"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DocMobileDock } from "@/systems/doc-transmission/components/DocMobileDock";
import { DOC_CATEGORY_LIST } from "@/systems/doc-transmission/lib/doc-types";

const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

function NavItem({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        navItemBase,
        "w-full sm:w-auto",
        active
          ? "bg-gradient-to-br from-[#ede9ff] via-white to-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
          : "app-btn-soft text-[#66638c]",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}

type DocNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly string[];
};

const navLinks: readonly DocNavItem[] = [
  { href: "/dashboard/doc-transmission", label: "แดชบอร์ด", icon: IconDashboard },
  {
    href: "/dashboard/doc-transmission/records/orders",
    label: "เอกสาร",
    icon: IconDoc,
    includes: ["/dashboard/doc-transmission/records"] as const,
  },
  {
    href: "/dashboard/doc-transmission/master",
    label: "ข้อมูลหลัก",
    icon: IconStack,
    includes: ["/dashboard/doc-transmission/settings"] as const,
  },
  { href: "/dashboard/doc-transmission/reports", label: "รายงาน", icon: IconReport },
] as const;

const masterSubLinks = [
  { href: "/dashboard/doc-transmission/master", label: "หน่วยงาน/แผนก" },
  { href: "/dashboard/doc-transmission/settings", label: "ตั้งค่า" },
] as const;

const recordsSubLinks = DOC_CATEGORY_LIST.map((c) => ({
  href: `/dashboard/doc-transmission/records/${c.slug}`,
  label: c.shortTitle,
}));

function navActive(pathname: string, href: string, includes?: readonly string[]): boolean {
  if (href === "/dashboard/doc-transmission") {
    return pathname === "/dashboard/doc-transmission";
  }
  if (includes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DocShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  const inRecordsGroup = navActive(pathname, "/dashboard/doc-transmission/records");
  const inMasterGroup = navActive(pathname, "/dashboard/doc-transmission/master", [
    "/dashboard/doc-transmission/settings",
  ]);

  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header className="-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">
              สารบรรณดิจิทัล
            </h1>
            <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
              คำสั่ง · บันทึกข้อความ · หนังสือรับ–ส่ง · หนังสือเวียน — พร้อม timeline ติดตามสถานะ
              และ public share link สำหรับนอกระบบ
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="app-btn-soft min-h-[44px] shrink-0 rounded-xl border border-[#dcd8f0] px-3 py-2 text-sm font-semibold text-[#4d47b6] hover:bg-[#f4f3ff] sm:px-4 sm:py-2.5"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
            aria-label="เปิดคู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
          >
            <span className="sm:hidden" aria-hidden>
              ?
            </span>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>

        <nav
          aria-label="เมนู สารบรรณดิจิทัล"
          className="mt-3 hidden border-t border-white/60 pt-3 md:block sm:mt-4 sm:pt-4"
        >
          <ul className="grid grid-cols-4 gap-2">
            {navLinks.map(({ href, label, icon, includes }) => (
              <li key={href} className="min-w-0">
                <NavItem href={href} icon={icon} active={navActive(pathname, href, includes)}>
                  {label}
                </NavItem>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {inRecordsGroup ? (
        <nav
          aria-label="เมนูย่อยหมวดหมู่เอกสาร"
          className="-mx-3 rounded-[2rem] p-3 sm:mx-0 sm:rounded-[2.5rem] sm:p-4 app-surface"
        >
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {recordsSubLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-[42px] items-center justify-center rounded-xl px-3 text-xs font-semibold transition sm:text-sm",
                      active
                        ? "bg-[#4d47b6] text-white shadow-[0_10px_18px_-12px_rgba(77,71,182,0.95)]"
                        : "app-btn-soft text-[#66638c]",
                    )}
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
        <nav
          aria-label="เมนูย่อยข้อมูลหลัก"
          className="-mx-3 rounded-[2rem] p-3 sm:mx-0 sm:rounded-[2.5rem] sm:p-4 app-surface"
        >
          <ul className="grid grid-cols-2 gap-2">
            {masterSubLinks.map((item) => {
              const active =
                item.href === "/dashboard/doc-transmission/master"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-[42px] items-center justify-center rounded-xl px-3 text-xs font-semibold transition sm:text-sm",
                      active
                        ? "bg-[#4d47b6] text-white shadow-[0_10px_18px_-12px_rgba(77,71,182,0.95)]"
                        : "app-btn-soft text-[#66638c]",
                    )}
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
                <li>กำหนดวันครบกำหนด (due date) เพื่อดูภาพรวม “เลยกำหนด” ในแดชบอร์ด</li>
                <li>แยกหมวด: คำสั่ง / บันทึกข้อความ / รับเข้า / ส่งออก / หนังสือเวียน — สอดคล้องงานสารบรรณจริง</li>
              </ul>
            ),
          },
        ]}
      />

      <div className="-mx-3 pb-24 sm:mx-0 sm:pb-0">{children}</div>
      <DocMobileDock />
    </div>
  );
}

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
