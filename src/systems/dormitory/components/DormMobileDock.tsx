"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  dormDockItemActiveClass,
  dormDockItemIdleClass,
  dormMobileDockShellClass,
} from "@/systems/dormitory/dorm-ui-tokens";

const items = [
  { href: "/dashboard/dormitory", label: "ภาพรวม", icon: IconHome },
  { href: "/dashboard/dormitory/rooms", label: "จัดการห้อง", icon: IconRooms },
  { href: "/dashboard/dormitory/history", label: "การเงิน", icon: IconHistory },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/dormitory") return pathname === href;
  if (href === "/dashboard/dormitory/rooms") {
    return pathname === "/dashboard/dormitory/rooms" || pathname.startsWith("/dashboard/dormitory/rooms/");
  }
  if (href === "/dashboard/dormitory/history") {
    return (
      pathname === "/dashboard/dormitory/history" ||
      pathname.startsWith("/dashboard/dormitory/history/") ||
      pathname === "/dashboard/dormitory/costs" ||
      pathname.startsWith("/dashboard/dormitory/costs/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DormMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="เมนูล่างหอพัก" className={dormMobileDockShellClass}>
      <ul className="grid grid-cols-3 gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all active:scale-90",
                  active ? dormDockItemActiveClass : dormDockItemIdleClass,
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                <span className="text-[9px] font-black leading-none">{item.label}</span>
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

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v3h3M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
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
