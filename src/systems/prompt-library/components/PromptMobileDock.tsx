"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  PROMPT_LIBRARY_NAV_ITEMS,
  isPromptLibraryModulePath,
  isPromptLibraryNavItemActive,
  type PromptLibraryNavKey,
} from "@/systems/prompt-library/prompt-library-module-nav";

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <path d="M9.5 2 8 8l-6 1.5L8 11l1.5 6L11 11l6-1.5L11 8 9.5 2Z" strokeLinejoin="round" />
      <path d="M18 14.5 17 17l-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}

function dockIcon(key: PromptLibraryNavKey, className?: string): ReactNode {
  switch (key) {
    case "library":
      return <IconSpark className={className} />;
    case "categories":
      return <IconFolder className={className} />;
  }
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? cn("text-white shadow-md", appDashboardBrandGradientFillClass) : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

export function PromptLibraryMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isPromptLibraryModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-2")} aria-label="แท็บนำทางโมดูลคลังคำสั่ง AI">
      {PROMPT_LIBRARY_NAV_ITEMS.map((item) => {
        const active = isPromptLibraryNavItemActive(pathname, item.key);
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
