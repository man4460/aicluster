"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { deriveHomeFinanceSection } from "@/systems/home-finance/homeFinanceSection";

/** มือถือ: กริด 2 คอลัมน์ แตะง่าย (min 44px) · จอใหญ่: แถบแนวนอน wrap */
const navItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        navItemBase,
        "w-full sm:w-auto",
        active ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
      )}
    >
      {children}
    </Link>
  );
}

const navLinks: { href: string; section: "dashboard" | "history" | "categories" | "utilities" | "vehicles" | "reminders"; label: string }[] = [
  { href: "/dashboard/home-finance", section: "dashboard", label: "แดชบอร์ด" },
  { href: "/dashboard/home-finance/history", section: "history", label: "ประวัติ" },
  { href: "/dashboard/home-finance/categories", section: "categories", label: "หมวด" },
  { href: "/dashboard/home-finance/utilities", section: "utilities", label: "ค่าไฟ/น้ำ" },
  { href: "/dashboard/home-finance/vehicles", section: "vehicles", label: "ยานพาหนะ" },
  { href: "/dashboard/home-finance/reminders", section: "reminders", label: "แจ้งเตือน" },
];

export function HomeFinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const section = deriveHomeFinanceSection(pathname);

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">ระบบรายรับรายจ่าย</h1>
        <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
          บันทึกรับ–จ่าย สรุปและกราฟ เชื่อมบิลไฟ/น้ำและรถ — ใช้บัญชีเจ้าของ
        </p>
      </header>

      <nav
        aria-label="เมนูระบบรายรับรายจ่าย"
        className="app-surface rounded-2xl p-3 sm:p-4 print:hidden"
      >
        <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
        <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {navLinks.map(({ href, section: key, label }) => (
            <li key={href} className="min-w-0 sm:w-auto">
              <NavItem href={href} active={section === key}>
                {label}
              </NavItem>
            </li>
          ))}
        </ul>
      </nav>

      {children}
    </div>
  );
}
