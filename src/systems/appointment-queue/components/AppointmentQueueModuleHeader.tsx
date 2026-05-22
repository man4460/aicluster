"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/appointment-queue", tab: "overview", label: "ภาพรวม", labelShort: "ภาพรวม" },
  { href: "/dashboard/appointment-queue?tab=queue", tab: "queue", label: "จัดการคิว", labelShort: "คิว" },
  { href: "/dashboard/appointment-queue?tab=services", tab: "services", label: "บริการ", labelShort: "บริการ" },
  { href: "/dashboard/appointment-queue?tab=settings", tab: "settings", label: "ตั้งค่า", labelShort: "ตั้งค่า" },
] as const;

function currentTab(sp: URLSearchParams): string {
  return sp.get("tab") ?? "overview";
}

function isActive(pathname: string, tab: string, sp: URLSearchParams): boolean {
  if (pathname !== "/dashboard/appointment-queue") return false;
  return currentTab(sp) === tab;
}

function navIcon(tab: string) {
  switch (tab) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "queue":
      return (
        <g>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </g>
      );
    case "schedule":
      return (
        <g>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </g>
      );
    case "services":
      return <path d="M12 3v18M8 7h8M7 12h10M8 17h8" strokeLinecap="round" />;
    case "settings":
      return (
        <g>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2" strokeLinecap="round" />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

function navLinkClass(active: boolean) {
  return cn(
    "flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[10px] font-black transition-all sm:min-h-0 sm:gap-2 sm:px-3 sm:text-xs",
    active
      ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      : "text-slate-600 hover:bg-white/45 hover:text-slate-800",
  );
}

export function AppointmentQueueModuleDesktopNav() {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();

  return (
    <nav
      aria-label="เมนูจองคิว"
      className="mt-5 hidden border-t border-white/40 pt-5 md:block print:hidden"
    >
      <ul className="grid grid-cols-4 gap-1">
        {links.map((l) => {
          const active = isActive(pathname, l.tab, sp);
          return (
            <li key={l.href} className="min-w-0">
              <Link href={l.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className={cn("h-4 w-4 shrink-0", active ? "text-[#5b61ff]" : "text-slate-400")}
                  aria-hidden
                >
                  {navIcon(l.tab)}
                </svg>
                <span className="truncate">{l.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppointmentQueueModuleMobileDock() {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();

  return (
    <nav
      className={cn(
        "fixed inset-x-3 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-1.5 md:hidden print:hidden",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))]",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
      )}
      aria-label="เมนูล่างจองคิว"
    >
      <ul className="grid grid-cols-4 gap-0.5">
        {links.map((l) => {
          const active = isActive(pathname, l.tab, sp);
          return (
            <li key={l.href} className="min-w-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                aria-label={l.label}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 transition-all active:scale-90",
                  active
                    ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
                    : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                  {navIcon(l.tab)}
                </svg>
                <span className="max-w-full truncate text-[8px] font-black leading-none sm:text-[9px]">
                  {l.labelShort}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
