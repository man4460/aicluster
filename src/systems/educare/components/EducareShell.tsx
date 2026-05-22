"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { EducareMobileDock } from "@/systems/educare/components/EducareMobileDock";
import {
  educareFilterChipClass,
  educareIconBadgeClass,
  educareModuleHeaderShellClass,
  educareNavItemActiveClass,
  educareNavItemBase,
  educareNavItemIdleClass,
  educareSegmentShellClass,
} from "@/systems/educare/educare-ui-tokens";

type EducareNavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: readonly string[];
};

const navLinks: readonly EducareNavItem[] = [
  { href: "/dashboard/educare", label: "แดชบอร์ด", icon: IconDashboard },
  { href: "/dashboard/educare/check", label: "เช็คประจำวัน", icon: IconCheck },
  {
    href: "/dashboard/educare/students",
    label: "จัดการห้องเรียน",
    icon: IconManage,
    includes: ["/dashboard/educare/classrooms", "/dashboard/educare/settings"] as const,
  },
  { href: "/dashboard/educare/reports", label: "รายงาน", icon: IconReport },
] as const;

const manageSubLinks = [
  { href: "/dashboard/educare/students", label: "นักเรียน" },
  { href: "/dashboard/educare/classrooms", label: "ห้องเรียน" },
  { href: "/dashboard/educare/settings", label: "ตั้งค่า" },
] as const;

function navActive(pathname: string, href: string, includes?: readonly string[]): boolean {
  if (href === "/dashboard/educare") {
    return pathname === "/dashboard/educare";
  }
  if (includes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EducareShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const inManageGroup = navActive(pathname, "/dashboard/educare/students", [
    "/dashboard/educare/classrooms",
    "/dashboard/educare/settings",
  ]);

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className={cn(educareModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className={educareIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <path d="M9 11l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">EduCare เช็คนักเรียน</h1>
                <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
                  เช็คเข้าแถว ความเรียบร้อย เข้าเรียน ดื่มนม ทานอาหาร แปรงฟัน — รายวัน 6 ฟีเจอร์ จบในหน้าเดียว
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className="flex h-10 min-h-[40px] items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-3 text-sm font-semibold text-[#5b61ff] shadow-sm backdrop-blur-md transition hover:bg-white/75 sm:px-4"
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
            aria-label="เปิดคู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" />
            </svg>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>

        <nav aria-label="เมนู EduCare" className="mt-4 hidden border-t border-white/50 pt-4 md:block">
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
        <nav aria-label="เมนูย่อยจัดการห้องเรียน" className={educareSegmentShellClass}>
          <ul className="grid grid-cols-3 gap-1.5">
            {manageSubLinks.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("flex w-full items-center justify-center", educareFilterChipClass(active))}
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
        title="คู่มือการใช้งาน — EduCare เช็คนักเรียน"
        subtitle="ภาพรวมการตั้งค่าและการเช็ค 6 ฟีเจอร์ ให้ใช้งานได้เร็วในวันแรก"
        sections={[
          {
            title: "ลำดับเริ่มต้นแนะนำ",
            content: (
              <>
                <p>
                  ตั้งค่าโรงเรียนและเวลาเช็ค → เพิ่มห้องเรียน → เพิ่มนักเรียน →
                  เปิดเมนู <strong className="font-semibold text-[#2e2a58]">เช็คประจำวัน</strong>{" "}
                  เพื่อเริ่มเช็ค 6 ฟีเจอร์ในแต่ละวัน
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#5b61ff]">
                  <li>ตั้งค่าโรงเรียน + เวลาเช็คแต่ละช่วง</li>
                  <li>เพิ่มห้องเรียนพร้อมครูประจำชั้น</li>
                  <li>เพิ่มนักเรียนเข้าห้องที่ต้องการ</li>
                  <li>กดเช็คประจำวันเริ่มจากเช็คเข้าแถวก่อนเสมอ</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>ภาพรวมจำนวนนักเรียนวันนี้: มา ขาด ลา สาย</li>
                <li>เปอร์เซ็นต์ความเรียบร้อยและกิจกรรม (อาหาร นม แปรงฟัน)</li>
                <li>กราฟ 7 วันย้อนหลัง + นักเรียนที่ขาดบ่อย / มาเรียนสม่ำเสมอ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: เช็คประจำวัน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>เลือกห้องเรียน → เลือกฟีเจอร์ที่จะเช็ค (เข้าแถว → เรียบร้อย → ดื่มนม ฯลฯ)</li>
                <li>เช็คทีละคน หรือกด &quot;ทุกคนมา&quot; / &quot;ทุกคนผ่าน&quot; เพื่อความเร็ว</li>
                <li>เช็คเข้าแถวเป็นจุดเริ่ม — นักเรียนที่ขาดจะไม่ต้องเช็คฟีเจอร์อื่นซ้ำ</li>
              </ul>
            ),
          },
          {
            title: "เมนู: จัดการห้องเรียน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>นักเรียน — เพิ่ม/แก้ไข/ปิดการใช้งาน + รูปและข้อมูลผู้ปกครอง</li>
                <li>ห้องเรียน — กำหนดชื่อห้อง ระดับชั้น ครูประจำชั้น</li>
                <li>ตั้งค่า — ชื่อโรงเรียน เวลาเช็คมาตรฐาน เปิด/ปิด การแจ้งเตือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: รายงาน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#5b61ff]">
                <li>สรุปรายเดือน/รายห้องเรียน/รายบุคคล</li>
                <li>กรองช่วงวันที่และส่งออกเป็น CSV หรือพิมพ์ PDF</li>
                <li>ใช้ตรวจประวัติเพื่อรายงานต่อผู้บริหารและผู้ปกครอง</li>
              </ul>
            ),
          },
        ]}
      />

      <div>{children}</div>
      <EducareMobileDock />
    </div>
  );
}

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
      className={cn(educareNavItemBase, "w-full sm:w-auto", active ? educareNavItemActiveClass : educareNavItemIdleClass)}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
      {children}
    </Link>
  );
}

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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M9 11l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconManage({ className }: { className?: string }) {
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
