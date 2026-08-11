"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  LOYALTY_STAMP_NAV_ITEMS,
  isLoyaltyStampModulePath,
  isLoyaltyStampNavItemActive,
  type LoyaltyStampNavKey,
} from "@/systems/loyalty-stamp/loyalty-stamp-module-nav";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function IconStampCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8M8 13h5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconQrMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3M17 17h4M14 21v-4M21 14v7" strokeLinecap="round" />
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

function dockIcon(key: LoyaltyStampNavKey, className?: string): ReactNode {
  switch (key) {
    case "overview":
      return <IconHome className={className} />;
    case "stamp":
      return <IconStampCard className={className} />;
    case "qr":
      return <IconQrMark className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active ? cn("text-white shadow-md", appDashboardBrandGradientFillClass) : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

export function LoyaltyStampMobileDockNav() {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();
  const tab = sp.get("tab");
  if (!isLoyaltyStampModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทางโมดูลสะสมแต้มดิจิทัล">
      {LOYALTY_STAMP_NAV_ITEMS.map((item) => {
        const active = isLoyaltyStampNavItemActive(pathname, tab, item.key);
        const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.shortLabel;
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
              <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
