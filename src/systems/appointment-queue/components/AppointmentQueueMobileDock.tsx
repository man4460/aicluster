"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  aqDockItemActiveClass,
  aqDockItemIdleClass,
} from "@/systems/appointment-queue/appointment-queue-ui-tokens";

const items = [
  { href: "/dashboard/appointment-queue", label: "คิว", icon: IconBoard },
  { href: "/dashboard/appointment-queue/schedule", label: "ตาราง", icon: IconCalendar },
  { href: "/dashboard/appointment-queue/services", label: "บริการ", icon: IconService },
  { href: "/dashboard/appointment-queue/staff", label: "ช่าง", icon: IconStaff },
  { href: "/dashboard/appointment-queue/settings", label: "ตั้งค่า", icon: IconSettings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/appointment-queue") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppointmentQueueMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <AppMobileDockShell ariaLabel="เมนูล่างจองคิว">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all active:scale-90",
                  active ? aqDockItemActiveClass : aqDockItemIdleClass,
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")} />
                <span className="max-w-full truncate px-0.5 text-[9px] font-black leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 2v3M16 2v3M3 9h18" strokeLinecap="round" />
    </svg>
  );
}

function IconBoard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="6" height="16" rx="1.5" />
      <rect x="9" y="4" width="6" height="16" rx="1.5" />
      <rect x="15" y="4" width="6" height="16" rx="1.5" />
    </svg>
  );
}

function IconService({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3v18M8 7h8M7 12h10M8 17h8" strokeLinecap="round" />
    </svg>
  );
}

function IconStaff({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}
