"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  ECOMMERCE_STORE_MODULE_DISPLAY_NAME,
  ECOMMERCE_STORE_NAV_ITEMS,
  isEcommerceStoreNavItemActive,
  type EcommerceStoreNavKey,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  IconClipboard,
  IconFinance,
  IconSettings,
  IconStore,
} from "@/systems/ecommerce-store/components/EcommerceStoreIcons";

function navIcon(key: EcommerceStoreNavKey, className?: string) {
  switch (key) {
    case "dashboard":
      return <IconStore className={className} />;
    case "finance":
      return <IconFinance className={className} />;
    case "manage":
      return <IconClipboard className={className} />;
    case "settings":
      return <IconSettings className={className} />;
  }
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function EcommerceStoreHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95"
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <ExpandGlyph />
    </button>
  );
}

const headerNavLinkClass = (active: boolean) =>
  cn(
    "inline-flex h-9 min-w-[2rem] shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition-all",
    active
      ? "bg-white text-[#4d47b6] shadow-md shadow-black/25 ring-1 ring-white/50"
      : "text-white/85 hover:bg-white/15 hover:text-white",
  );

export function EcommerceStoreHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูโมดูลร้านออนไลน์"
      >
        {ECOMMERCE_STORE_NAV_ITEMS.map((item) => {
          const active = isEcommerceStoreNavItemActive(pathname, item.key);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={headerNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                {navIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
        {ECOMMERCE_STORE_MODULE_DISPLAY_NAME}
      </span>
      <EcommerceStoreHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}
