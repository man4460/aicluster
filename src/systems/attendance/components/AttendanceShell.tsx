"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { AttendanceMobileDock } from "@/systems/attendance/components/AttendanceMobileDock";

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
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}

type AttendanceNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly string[];
};

const navLinks: readonly AttendanceNavItem[] = [
  { href: "/dashboard/attendance", label: "แดชบอร์ด", icon: IconDashboard },
  {
    href: "/dashboard/attendance/settings",
    label: "จัดการเช็คอิน",
    icon: IconSettings,
    includes: ["/dashboard/attendance/roster", "/dashboard/attendance/check"] as const,
  },
  { href: "/dashboard/attendance/logs", label: "รายงาน", icon: IconReport },
  { href: "/dashboard/attendance/qr", label: "QR จุดเช็คอิน", icon: IconQr },
] as const;

const manageSubLinks = [
  { href: "/dashboard/attendance/settings", label: "ตั้งค่า" },
  { href: "/dashboard/attendance/roster", label: "รายชื่อพนักงาน" },
  { href: "/dashboard/attendance/check", label: "เช็คอิน" },
] as const;

function navActive(pathname: string, href: string, includes?: readonly string[]): boolean {
  if (href === "/dashboard/attendance") {
    return pathname === "/dashboard/attendance";
  }
  if (includes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AttendanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const inManageGroup = navActive(pathname, "/dashboard/attendance/settings", [
    "/dashboard/attendance/roster",
    "/dashboard/attendance/check",
  ]);

  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header className="-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">เช็คอินอัจฉริยะ</h1>
            <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
              เช็คอิน–เช็คเอาท์ กะงาน รายงาน และ QR จุดเช็คอิน — ใช้บัญชีเจ้าของ
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

        <nav aria-label="เมนูเช็คอินอัจฉริยะ" className="mt-3 hidden border-t border-white/60 pt-3 md:block sm:mt-4 sm:pt-4">
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

      {inManageGroup ? (
        <nav
          aria-label="เมนูย่อยจัดการเช็คอิน"
          className="-mx-3 rounded-[2rem] p-3 sm:mx-0 sm:rounded-[2.5rem] sm:p-4 app-surface"
        >
          <ul className="grid grid-cols-3 gap-2">
            {manageSubLinks.map((item) => {
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

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — เช็คอินอัจฉริยะ"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูสำหรับผู้ดูแลและพนักงาน"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ให้ตั้งค่าที่เมนู <strong className="font-semibold text-[#2e2a58]">ตั้งค่า</strong> และ{" "}
                  <strong className="font-semibold text-[#2e2a58]">รายชื่อพนักงาน</strong> ก่อน แล้วเผยแพร่{" "}
                  <strong className="font-semibold text-[#2e2a58]">QR จุดเช็คอิน</strong> ให้ทีมใช้งาน
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>กำหนดกะและนโยบายสาย/ขาด</li>
                  <li>เพิ่มพนักงานให้ครบทุกคน</li>
                  <li>เปิดใช้ QR และทดสอบเช็คอินจริง</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูภาพรวมพนักงานที่เช็คอินแล้ว เช็คเอาท์แล้ว และที่ยังไม่เข้า</li>
                <li>ติดตามสถานะหน้างานแบบเรียลไทม์ในวันปัจจุบัน</li>
                <li>เหมาะสำหรับหัวหน้างานใช้ตรวจความพร้อมทีมก่อนเริ่มกะ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ตั้งค่า",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>กำหนดกะเวลางาน เวลาเข้างาน-เลิกงาน และเงื่อนไขการนับสาย</li>
                <li>ตั้งค่ากฎการใช้งานระบบให้ตรงกับนโยบายองค์กร</li>
                <li>ควรตรวจค่าทั้งหมดก่อนเริ่มใช้งานจริงทุกสาขา</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ดูประวัติการเข้างานย้อนหลังตามช่วงวันที่ต้องการ</li>
                <li>กรองตามพนักงานเพื่อส่งต่อคำนวณเงินเดือน</li>
                <li>ใช้ตรวจเหตุผิดปกติ เช่น ลืมเช็คเอาท์หรือเวลาไม่ครบ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายชื่อพนักงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่ม/แก้ไขข้อมูลพนักงานที่สามารถเช็คอินได้</li>
                <li>ปิดการใช้งานพนักงานที่ลาออกเพื่อลดความผิดพลาด</li>
                <li>ตรวจชื่อและรหัสพนักงานให้ตรงกับข้อมูลฝ่ายบุคคล</li>
              </ul>
            ),
          },
          {
            title: "เมนู: QR จุดเช็คอิน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้าง QR สำหรับให้พนักงานสแกนเข้า/ออกงาน</li>
                <li>วาง QR ไว้ตำแหน่งที่เข้าถึงง่ายและมีสัญญาณอินเทอร์เน็ต</li>
                <li>ทดสอบสแกนจากมือถือหลายเครื่องก่อนเริ่มใช้งานจริง</li>
              </ul>
            ),
          },
        ]}
      />

      <div className="-mx-3 pb-24 sm:mx-0 sm:pb-0">{children}</div>
      <AttendanceMobileDock />
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

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.2 1.2 0 0 0 .24 1.32l.04.04a1.5 1.5 0 0 1 0 2.12 1.5 1.5 0 0 1-2.12 0l-.04-.04A1.2 1.2 0 0 0 16.2 18a1.2 1.2 0 0 0-1 .7 1.2 1.2 0 0 0-.1.5V19a1.5 1.5 0 1 1-3 0v-.08a1.2 1.2 0 0 0-.7-1.1 1.2 1.2 0 0 0-1.33.24l-.04.04a1.5 1.5 0 1 1-2.12-2.12l.04-.04A1.2 1.2 0 0 0 7 14.8a1.2 1.2 0 0 0-.5-.1H6.4a1.5 1.5 0 1 1 0-3h.08a1.2 1.2 0 0 0 1.1-.7 1.2 1.2 0 0 0-.24-1.33l-.04-.04A1.5 1.5 0 1 1 9.42 7.5l.04.04A1.2 1.2 0 0 0 10.8 7a1.2 1.2 0 0 0 .1-.5V6.4a1.5 1.5 0 1 1 3 0v.08a1.2 1.2 0 0 0 .7 1.1 1.2 1.2 0 0 0 1.33-.24l.04-.04a1.5 1.5 0 1 1 2.12 2.12l-.04.04A1.2 1.2 0 0 0 17 10.8c0 .17.03.34.1.5.18.43.6.7 1.06.7h.08a1.5 1.5 0 1 1 0 3h-.08a1.2 1.2 0 0 0-1.1.7Z" />
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

function IconQr({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v7h-3M14 20h3" />
    </svg>
  );
}
