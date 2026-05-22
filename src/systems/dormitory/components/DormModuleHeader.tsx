"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  dormNavItemActiveClass,
  dormNavItemBase,
  dormNavItemIdleClass,
} from "@/systems/dormitory/dorm-ui-tokens";

const links = [
  { href: "/dashboard/dormitory", label: "แดชบอร์ด", icon: IconHome },
  { href: "/dashboard/dormitory/rooms", label: "จัดการห้อง", icon: IconRooms },
  { href: "/dashboard/dormitory/history", label: "การเงิน", icon: IconFinance },
] as const;

export function DormModuleHeader() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูหอพัก">
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
                className={cn(dormNavItemBase, "w-full", active ? dormNavItemActiveClass : dormNavItemIdleClass)}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRooms({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M6 15l3-3 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
