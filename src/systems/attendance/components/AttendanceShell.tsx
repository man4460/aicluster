"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

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

const navLinks = [
  { href: "/dashboard/attendance", label: "แดชบอร์ด" },
  { href: "/dashboard/attendance/settings", label: "ตั้งค่า" },
  { href: "/dashboard/attendance/logs", label: "รายงาน" },
  { href: "/dashboard/attendance/roster", label: "รายชื่อพนักงาน" },
  { href: "/dashboard/attendance/qr", label: "QR จุดเช็คอิน" },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/attendance") {
    return pathname === "/dashboard/attendance";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AttendanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">เช็คอินอัจฉริยะ</h1>
        <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
          เช็คอิน–เช็คเอาท์ กะงาน รายงาน และ QR จุดเช็คอิน — ใช้บัญชีเจ้าของ
        </p>
      </header>

      <nav aria-label="เมนูเช็คอินอัจฉริยะ" className="app-surface rounded-2xl p-3 sm:p-4 print:hidden">
        <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
        <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {navLinks.map(({ href, label }) => (
            <li key={href} className="min-w-0 sm:w-auto">
              <NavItem href={href} active={navActive(pathname, href)}>
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
