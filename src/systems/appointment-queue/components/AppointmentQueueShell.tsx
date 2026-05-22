"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { AppointmentQueueMobileDock } from "@/systems/appointment-queue/components/AppointmentQueueMobileDock";
import {
  aqIconBadgeClass,
  aqModuleHeaderShellClass,
  aqNavItemActiveClass,
  aqNavItemBase,
  aqNavItemIdleClass,
} from "@/systems/appointment-queue/appointment-queue-ui-tokens";

const navLinks = [
  { href: "/dashboard/appointment-queue", label: "คิววันนี้", icon: IconBoard },
  { href: "/dashboard/appointment-queue/schedule", label: "ตารางเวลา", icon: IconCalendar },
  { href: "/dashboard/appointment-queue/services", label: "บริการ", icon: IconService },
  { href: "/dashboard/appointment-queue/staff", label: "ช่าง", icon: IconStaff },
  { href: "/dashboard/appointment-queue/settings", label: "ตั้งค่า", icon: IconSettings },
] as const;

function navActive(pathname: string, href: string) {
  if (href === "/dashboard/appointment-queue") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppointmentQueueShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="max-w-full space-y-4 pb-28 sm:space-y-6 sm:pb-6">
      <header className={cn(aqModuleHeaderShellClass, "print:hidden")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className={aqIconBadgeClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M8 3v4M16 3v4M3 11h18" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  จองคิวอัจฉริยะ
                </h1>
                <p className="mt-1 hidden max-w-2xl text-sm text-[#66638c] md:block">
                  ลูกค้าจองเวลาจากบ้าน · มัดจำสลิป · บอร์ดคิวลากสถานะ — แปะลิงก์บน Facebook / TikTok ได้ทันที
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav aria-label="เมนูจองคิว" className="mt-4 hidden border-t border-white/50 pt-4 md:block">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    aqNavItemBase,
                    "w-full",
                    navActive(pathname, href) ? aqNavItemActiveClass : aqNavItemIdleClass,
                  )}
                  aria-current={navActive(pathname, href) ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {children}
      <AppointmentQueueMobileDock />
    </div>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
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
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  );
}
