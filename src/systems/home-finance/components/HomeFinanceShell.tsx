"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { deriveHomeFinanceSection } from "@/systems/home-finance/homeFinanceSection";
import { HomeFinanceMobileDock } from "@/systems/home-finance/components/HomeFinanceMobileDock";
import {
  hfGuideButtonClass,
  hfIconBadgeClass,
  hfModuleHeaderShellClass,
  hfNavItemActiveClass,
  hfNavItemBase,
  hfNavItemIdleClass,
} from "@/systems/home-finance/components/home-finance-ui-tokens";

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
      className={cn(hfNavItemBase, "w-full", active ? hfNavItemActiveClass : hfNavItemIdleClass)}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
      {children}
    </Link>
  );
}

type FinanceNavItem = {
  href: string;
  section: "dashboard" | "history" | "categories" | "documents" | "reminders";
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
};

const navLinks: FinanceNavItem[] = [
  { href: "/dashboard/home-finance", section: "dashboard", label: "แดชบอร์ด", icon: IconDashboard },
  { href: "/dashboard/home-finance/history", section: "history", label: "ประวัติ", icon: IconHistory },
  { href: "/dashboard/home-finance/categories", section: "categories", label: "หมวดหมู่", icon: IconCategories },
  { href: "/dashboard/home-finance/documents", section: "documents", label: "เอกสาร", icon: IconDocuments },
  { href: "/dashboard/home-finance/reminders", section: "reminders", label: "แจ้งเตือน", icon: IconReminder },
];

export function HomeFinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const section = deriveHomeFinanceSection(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className={cn(hfModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className={hfIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.35" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">รายรับ–รายจ่าย</h1>
                <p className="mt-0.5 hidden max-w-2xl text-sm text-[#66638c] md:block">
                  บันทึกรับ–จ่าย สร้างหมวดเอง แนบสลิป และเก็บเอกสารส่วนตัว
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUsageGuideOpen(true)}
            className={hfGuideButtonClass}
            aria-haspopup="dialog"
            aria-expanded={usageGuideOpen}
            aria-label="เปิดคู่มือการใช้งาน"
            title="คู่มือการใช้งาน"
            suppressHydrationWarning
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 7h.01" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">คู่มือ</span>
          </button>
        </div>

        <nav aria-label="เมนูระบบรายรับรายจ่าย" className="mt-4 hidden border-t border-white/50 pt-4 md:block">
          <ul className="grid grid-cols-5 gap-2">
            {navLinks.map(({ href, section: key, label, icon }) => (
              <li key={href} className="min-w-0">
                <NavItem href={href} icon={icon} active={section === key}>
                  {label}
                </NavItem>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — ระบบรายรับรายจ่าย"
        subtitle="บันทึกรายรับ–รายจ่ายแบบเรียบง่าย หมวดหมู่และเอกสารจัดการเองได้ทั้งหมด"
        sections={[
          {
            title: "เริ่มต้นใช้งาน",
            content: (
              <>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>สร้างหมวดหมู่ที่เมนู «หมวดหมู่»</li>
                  <li>บันทึกรายการที่แดชบอร์ด — เลือกประเภท หมวด ชื่อรายการ แนบสลิป</li>
                  <li>ตรวจย้อนหลังที่ «ประวัติ»</li>
                  <li>เก็บเอกสารสำคัญที่ «เอกสาร» แยกจากสลิปรายการ</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มรายการรายรับ/รายจ่าย — ฟอร์มสั้น ไม่ผูกบิลหรือรถ</li>
                <li>แนบสลิปด้วยปุ่มเลือกรูปหรือถ่ายรูป</li>
                <li>ดูสรุปยอดและกราฟรายเดือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: หมวดหมู่",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>สร้างหมวดเองทั้งหมด — ไม่มีหมวดบังคับจากระบบ</li>
                <li>ตั้งชื่อให้ตรงการใช้งานจริง เช่น ค่าอาหาร ค่าเช่า รายได้เสริม</li>
              </ul>
            ),
          },
          {
            title: "เมนู: เอกสารส่วนตัว",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เก็บบัตรประชาชน สัญญา ใบรับรอง แยกจากสลิปรายการ</li>
                <li>อัปโหลดรูปหรือ PDF แล้วตั้งชื่อและหมวดย่อยได้</li>
              </ul>
            ),
          },
        ]}
      />

      {children}
      <HomeFinanceMobileDock />
    </div>
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

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCategories({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
    </svg>
  );
}

function IconDocuments({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 13h6M10 17h4" strokeLinecap="round" />
    </svg>
  );
}

function IconReminder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 17a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}
