"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppUsageGuideModal } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { deriveHomeFinanceSection } from "@/systems/home-finance/homeFinanceSection";
import { HomeFinanceMobileDock } from "@/systems/home-finance/components/HomeFinanceMobileDock";

/** มือถือ: กริด 2 คอลัมน์ แตะง่าย (min 44px) · จอใหญ่: แถบแนวนอน wrap */
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
        "w-full",
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

type FinanceNavItem = {
  href: string;
  section: "dashboard" | "history" | "manage" | "reminders";
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  includes?: ReadonlyArray<"categories" | "utilities" | "vehicles">;
};

const navLinks: FinanceNavItem[] = [
  { href: "/dashboard/home-finance", section: "dashboard", label: "แดชบอร์ด", icon: IconDashboard },
  { href: "/dashboard/home-finance/history", section: "history", label: "ประวัติ", icon: IconHistory },
  {
    href: "/dashboard/home-finance/categories",
    section: "manage",
    label: "จัดการค่าใช้จ่าย",
    icon: IconCategories,
    includes: ["categories", "utilities", "vehicles"],
  },
  { href: "/dashboard/home-finance/reminders", section: "reminders", label: "แจ้งเตือน", icon: IconReminder },
];

const manageSubLinks = [
  { href: "/dashboard/home-finance/categories", section: "categories", label: "หมวด" },
  { href: "/dashboard/home-finance/utilities", section: "utilities", label: "ค่าน้ำค่าไฟ" },
  { href: "/dashboard/home-finance/vehicles", section: "vehicles", label: "ยานพาหนะ" },
] as const;

export function HomeFinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const section = deriveHomeFinanceSection(pathname);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const inManageGroup = section === "categories" || section === "utilities" || section === "vehicles";

  return (
    <div className="-mt-1 max-w-full space-y-4 sm:mt-0 sm:space-y-6">
      <header className="-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">ระบบรายรับรายจ่าย</h1>
            <p className="mt-1 hidden max-w-2xl text-sm leading-snug text-[#66638c] md:block">
              บันทึกรับ–จ่าย สรุปและกราฟ เชื่อมบิลไฟ/น้ำและรถ — ใช้บัญชีเจ้าของ
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
            suppressHydrationWarning
          >
            <span className="sm:hidden" aria-hidden>
              ?
            </span>
            <span className="hidden sm:inline">คู่มือการใช้งาน</span>
          </button>
        </div>

        <nav
          aria-label="เมนูระบบรายรับรายจ่าย"
          className="mt-3 hidden border-t border-white/60 pt-3 md:block sm:mt-4 sm:pt-4"
        >
          <ul className="grid grid-cols-4 gap-2">
            {navLinks.map(({ href, section: key, label, icon, includes }) => (
              <li key={href} className="min-w-0">
                <NavItem
                  href={href}
                  icon={icon}
                  active={section === key || Boolean(includes?.includes(section as "categories" | "utilities" | "vehicles"))}
                >
                  {label}
                </NavItem>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {inManageGroup ? (
        <nav
          aria-label="เมนูย่อยจัดการค่าใช้จ่าย"
          className="-mx-3 app-surface rounded-[2rem] p-3 sm:mx-0 sm:rounded-[2.5rem] sm:p-4"
        >
          <ul className="grid grid-cols-3 gap-2">
            {manageSubLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[42px] items-center justify-center rounded-xl px-3 text-xs font-semibold transition sm:text-sm",
                    section === item.section
                      ? "bg-[#4d47b6] text-white shadow-[0_10px_18px_-12px_rgba(77,71,182,0.95)]"
                      : "app-btn-soft text-[#66638c]",
                  )}
                  aria-current={section === item.section ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <AppUsageGuideModal
        open={usageGuideOpen}
        onClose={() => setUsageGuideOpen(false)}
        title="คู่มือการใช้งาน — ระบบรายรับรายจ่าย"
        subtitle="วิธีใช้งานแบบละเอียดทุกเมนูในระบบการเงินครัวเรือน"
        sections={[
          {
            title: "เริ่มต้นใช้งาน",
            content: (
              <>
                <p>
                  แนะนำตั้ง <strong className="font-semibold text-[#2e2a58]">หมวด</strong> ก่อน แล้วค่อยบันทึกข้อมูลรายวันที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">แดชบอร์ด</strong> และตรวจย้อนหลังที่{" "}
                  <strong className="font-semibold text-[#2e2a58]">ประวัติ</strong>
                </p>
                <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-[#4d47b6]">
                  <li>ตั้งหมวดรายรับ-รายจ่ายหลักให้ครบ</li>
                  <li>เพิ่มค่าไฟ/น้ำและยานพาหนะ (ถ้ามี)</li>
                  <li>บันทึกรายการจริงต่อเนื่องทุกวัน</li>
                  <li>ตรวจกราฟรายเดือนและตั้งแจ้งเตือน</li>
                </ol>
              </>
            ),
          },
          {
            title: "เมนู: แดชบอร์ด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มรายการรายรับ/รายจ่ายใหม่ได้ทันทีจากหน้าเดียว</li>
                <li>ดูภาพรวมยอดเข้า ยอดออก และคงเหลือสุทธิ</li>
                <li>เหมาะใช้เปิดเช็กสถานะการเงินรายวันอย่างรวดเร็ว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ประวัติ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ค้นหาและกรองรายการย้อนหลังตามวันที่ หมวด หรือคำค้น</li>
                <li>แก้ไขข้อมูลที่บันทึกผิด เช่น จำนวนเงิน หมายเหตุ หรือรูปสลิป</li>
                <li>ใช้เพื่อตรวจสอบรายการสำคัญก่อนสรุปรายเดือน</li>
              </ul>
            ),
          },
          {
            title: "เมนู: หมวด",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>เพิ่มหมวดรายรับ/รายจ่ายให้สอดคล้องการใช้งานจริง</li>
                <li>ตั้งชื่อให้ชัด เช่น ค่าอาหาร ค่าน้ำมัน ค่าเช่า รายได้เสริม</li>
                <li>หมวดที่ดีช่วยให้กราฟและสรุปอ่านง่ายขึ้นมาก</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ค่าไฟ/น้ำ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกบิลค่าน้ำ ค่าไฟ พร้อมรอบเดือน</li>
                <li>เปรียบเทียบค่าใช้จ่ายรายเดือนเพื่อดูแนวโน้มเพิ่ม/ลด</li>
                <li>แยกหมวดชัดเจนทำให้วางแผนลดค่าใช้จ่ายได้ง่าย</li>
              </ul>
            ),
          },
          {
            title: "เมนู: ยานพาหนะ",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>บันทึกรายจ่ายรถ เช่น น้ำมัน ซ่อมบำรุง ประกัน ภาษี</li>
                <li>ติดตามต้นทุนต่อคันได้อย่างเป็นระบบ</li>
                <li>ใช้ประกอบการตัดสินใจเรื่องค่าใช้จ่ายระยะยาว</li>
              </ul>
            ),
          },
          {
            title: "เมนู: แจ้งเตือน",
            content: (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                <li>ตั้งเตือนบิลที่ต้องจ่ายซ้ำ เช่น ค่าน้ำ ค่าไฟ ค่าเน็ต</li>
                <li>ลดโอกาสลืมจ่ายและค่าปรับล่าช้า</li>
                <li>ควรตั้งก่อนวันครบกำหนดจริง 1-3 วัน</li>
              </ul>
            ),
          },
        ]}
      />

      <div className="-mx-3 pb-24 sm:mx-0 sm:pb-0">{children}</div>
      <HomeFinanceMobileDock />
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

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCategories({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
      <circle cx="7" cy="17" r="1.5" />
    </svg>
  );
}

function IconUtility({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M13 2 6 14h5l-1 8 8-13h-5l1-7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconVehicle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 14h16l-1.5-5h-13L4 14Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </svg>
  );
}

function IconReminder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 17a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}
