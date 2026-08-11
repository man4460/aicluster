"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  WAIT_QUEUE_NAV_ITEMS,
  isWaitQueueModulePath,
  isWaitQueueNavItemActive,
  type WaitQueueNavKey,
} from "@/systems/wait-queue/wait-queue-module-nav";
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

function IconQueue({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function dockIcon(key: WaitQueueNavKey, className?: string): ReactNode {
  switch (key) {
    case "dashboard":
      return <IconQueue className={className} />;
    case "settings":
      return <IconModuleShopSettings className={className} />;
  }
}

export function WaitQueueMobileDockNav() {
  const pathname = usePathname() ?? "";
  if (!isWaitQueueModulePath(pathname)) return null;

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-2")} aria-label="แท็บนำทางโมดูลคิวหน้าร้าน">
      {WAIT_QUEUE_NAV_ITEMS.map((item) => {
        const active = isWaitQueueNavItemActive(pathname, item.key);
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
