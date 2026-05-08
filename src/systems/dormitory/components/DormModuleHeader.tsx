"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const dormNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

const links = [
  { href: "/dashboard/dormitory", label: "แดชบอร์ด", icon: IconHome },
  { href: "/dashboard/dormitory/rooms", label: "จัดการห้อง", icon: IconRooms },
  { href: "/dashboard/dormitory/history", label: "การเงิน", icon: IconFinance },
] as const;

export function DormModuleHeader() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูหอพัก" className="print:hidden">
      <ul className="grid grid-cols-3 gap-2">
        {links.map((l) => {
          const Icon = l.icon;
          let active = false;
          if (l.href === "/dashboard/dormitory") {
            active = pathname === "/dashboard/dormitory";
          } else if (l.href === "/dashboard/dormitory/rooms") {
            active = pathname === "/dashboard/dormitory/rooms" || pathname.startsWith("/dashboard/dormitory/rooms/");
          } else {
            active =
              pathname === "/dashboard/dormitory/history" ||
              pathname.startsWith("/dashboard/dormitory/history/") ||
              pathname === "/dashboard/dormitory/costs" ||
              pathname.startsWith("/dashboard/dormitory/costs/");
          }
          return (
            <li key={l.href} className="min-w-0 sm:w-auto">
              <Link
                href={l.href}
                className={cn(
                  dormNavItemBase,
                  "w-full",
                  active
                    ? "bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_10px_20px_-12px_rgba(77,71,182,0.85)]"
                    : "border border-white/70 bg-white/70 text-[#66638c] backdrop-blur-md hover:bg-white/90",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRooms({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 19h16M6 15l3-3 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="15" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
