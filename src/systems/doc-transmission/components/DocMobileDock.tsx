"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  DOC_TRANSMISSION_NAV_ITEMS,
  isDocTransmissionModulePath,
  isDocTransmissionNavItemActive,
  type DocTransmissionNavKey,
} from "@/systems/doc-transmission/doc-transmission-module-nav";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function dockIcon(key: DocTransmissionNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconHome className={className} />;
    case "records":
      return <IconDoc className={className} />;
    case "master":
      return <IconStack className={className} />;
    case "reports":
      return <IconReport className={className} />;
  }
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? cn("text-white shadow-md", appDashboardBrandGradientFillClass) : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

export function DocTransmissionMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isDocTransmissionModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทางโมดูลสารบรรณดิจิทัล">
      {DOC_TRANSMISSION_NAV_ITEMS.map((item) => {
        const active = isDocTransmissionNavItemActive(pathname, item.key);
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              {dockIcon(item.key, "h-5 w-5 shrink-0")}
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{item.shortLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DocMobileDock() {
  const pathname = usePathname() ?? "";
  return (
    <AppMobileDockShell ariaLabel="เมนูล่าง สารบรรณดิจิทัล">
      <DocTransmissionMobileDockNav />
    </AppMobileDockShell>
  );
}
