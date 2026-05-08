"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

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
    return pathname === "/dashboard/dormitory/history" || pathname.startsWith("/dashboard/dormitory/history/") || pathname === "/dashboard/dormitory/costs" || pathname.startsWith("/dashboard/dormitory/costs/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DormMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="เมนูล่างหอพัก"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/45 bg-gradient-to-r from-white/80 via-white/70 to-[#eef2ff]/75 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur-2xl md:hidden"
    >
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-3 gap-1 rounded-[2rem] border border-white/60 bg-white/65 p-1.5 shadow-[0_12px_38px_-18px_rgba(76,70,178,0.55)] ring-1 ring-white/65">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-bold tracking-tight transition",
                  active
                    ? "bg-gradient-to-b from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_10px_20px_-12px_rgba(77,71,182,0.9)]"
                    : "text-[#66638c] hover:bg-white/70",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{item.label}</span>
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

function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v3h3M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
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

