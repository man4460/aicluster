"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ASSET_NAV_ITEMS,
  isAssetModulePath,
  isAssetNavItemActive,
  type AssetNavKey,
} from "@/systems/asset/asset-module-nav";
import { assetNavActiveClass, assetNavIdleClass } from "@/systems/asset/lib/ui-tokens";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? assetNavActiveClass : assetNavIdleClass,
  );

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 3 3 7l9 4 9-4-9-4Z" strokeLinejoin="round" />
      <path d="m3 12 9 4 9-4M3 17l9 4 9-4" strokeLinejoin="round" />
    </svg>
  );
}

function IconReport({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 19h16M7 15l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function dockIcon(key: AssetNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconDashboard className={className} />;
    case "assets":
      return <IconBox className={className} />;
    case "operations":
      return <IconArrows className={className} />;
    case "master":
      return <IconStack className={className} />;
    case "reports":
      return <IconReport className={className} />;
  }
}

export function AssetMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isAssetModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-5")} aria-label="แท็บนำทางโมดูลบริหารทรัพย์สิน">
      {ASSET_NAV_ITEMS.map((item) => {
        const active = isAssetNavItemActive(pathname, item.key);
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
            >
              {dockIcon(item.key, cn("h-5 w-5 shrink-0", active ? "text-white" : "text-slate-400"))}
              <span className={cn("max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none", active ? "text-white" : "")}>
                {item.shortLabel}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
