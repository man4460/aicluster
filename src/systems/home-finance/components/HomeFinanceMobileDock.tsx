"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  HOME_FINANCE_NAV_ITEMS,
  isHomeFinanceModulePath,
  isHomeFinanceNavItemActive,
  type HomeFinanceNavKey,
} from "@/systems/home-finance/home-finance-module-nav";
import { homeFinanceNavActiveClass, homeFinanceNavIdleClass } from "@/systems/home-finance/lib/ui-tokens";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? cn(homeFinanceNavActiveClass, "!py-2") : homeFinanceNavIdleClass,
  );

function IconOverview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconEntries({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDocuments({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 13h6M10 17h4" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function dockIcon(key: HomeFinanceNavKey, className?: string): ReactNode {
  switch (key) {
    case "overview":
      return <IconOverview className={className} />;
    case "entries":
      return <IconEntries className={className} />;
    case "documents":
      return <IconDocuments className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

export function HomeFinanceMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isHomeFinanceModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทางระบบรายรับรายจ่าย">
      {HOME_FINANCE_NAV_ITEMS.map((item) => {
        const active = isHomeFinanceNavItemActive(pathname, item.key);
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              {dockIcon(item.key, cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400"))}
              <span className={cn("max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none", active ? "text-white" : "")}>{item.shortLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
