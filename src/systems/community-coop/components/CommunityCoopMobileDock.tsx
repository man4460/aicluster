"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  COMMUNITY_COOP_NAV_ITEMS,
  isCommunityCoopModulePath,
  isCommunityCoopNavItemActive,
  type CommunityCoopNavKey,
} from "@/systems/community-coop/community-coop-module-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function IconCoop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <circle cx="9" cy="12" r="4" />
      <path d="M15 8l6 4-6 4v-2H9V10h6V8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

function dockIcon(key: CommunityCoopNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconCoop className={className} />;
    case "members":
      return <IconUsers className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

export function CommunityCoopMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isCommunityCoopModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-3")} aria-label="แท็บนำทางโมดูลสหกรณ์ชุมชน">
      {COMMUNITY_COOP_NAV_ITEMS.map((item) => {
        const active = isCommunityCoopNavItemActive(pathname, item.key);
        const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.shortLabel;
        return (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              className={dockLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
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
