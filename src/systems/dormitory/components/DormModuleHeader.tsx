"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const dormNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

const links = [
  { href: "/dashboard/dormitory", label: "แดชบอร์ด" },
  { href: "/dashboard/dormitory/rooms", label: "ห้อง" },
  { href: "/dashboard/dormitory/history", label: "ประวัติ" },
  { href: "/dashboard/dormitory/costs", label: "ต้นทุน / รายจ่าย" },
  { href: "/dashboard/dormitory/settings", label: "ตั้งค่า" },
] as const;

export function DormModuleHeader() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูหอพัก" className="app-surface rounded-2xl p-3 sm:p-4 print:hidden">
      <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
      <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {links.map((l) => {
          const active =
            l.href === "/dashboard/dormitory"
              ? pathname === "/dashboard/dormitory"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href} className="min-w-0 sm:w-auto">
              <Link
                href={l.href}
                className={cn(
                  dormNavItemBase,
                  "w-full sm:w-auto",
                  active
                    ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                    : "app-btn-soft text-[#66638c]",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
