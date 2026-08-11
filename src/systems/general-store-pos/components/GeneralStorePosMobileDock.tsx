"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import {
  GENERAL_STORE_POS_NAV_ITEMS,
  isGeneralStorePosModulePath,
  isGeneralStorePosNavItemActive,
  type GeneralStorePosNavKey,
} from "@/systems/general-store-pos/general-store-pos-module-nav";

function IconProducts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconSales({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function dockIcon(key: GeneralStorePosNavKey, className?: string) {
  switch (key) {
    case "products":
      return <IconProducts className={className} />;
    case "sales":
      return <IconSales className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? cn("text-white shadow-sm", appDashboardBrandGradientFillClass)
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

export function GeneralStorePosMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isGeneralStorePosModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-3")} aria-label="แท็บนำทาง POS ร้านทั่วไป">
      {GENERAL_STORE_POS_NAV_ITEMS.map((item) => {
        const active = isGeneralStorePosNavItemActive(pathname, item.key);
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
