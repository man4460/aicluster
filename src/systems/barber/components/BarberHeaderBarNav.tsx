"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";
import {
  BARBER_MODULE_DISPLAY_NAME,
  BARBER_NAV_ITEMS,
  barberModuleNavIcon,
  isBarberModuleNavItemActive,
  type BarberModuleNavKey,
} from "@/systems/barber/barber-module-nav";

function navIcon(key: BarberModuleNavKey, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {barberModuleNavIcon(key)}
    </svg>
  );
}

function BarberHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function BarberHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <BarberHeaderExpandGlyph />
    </button>
  );
}

export function BarberHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูโมดูลร้านตัดผม"
      >
        {BARBER_NAV_ITEMS.map((item) => {
          const active = isBarberModuleNavItemActive(pathname, item.key);
          const label = item.key === "settings" ? MODULE_SHOP_SETTINGS_SHORT_LABEL : item.label;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black transition-all sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs",
                active
                  ? "bg-white text-[#4d47b6] shadow-md shadow-black/25 ring-1 ring-white/50"
                  : "text-white/85 hover:bg-white/15 hover:text-white",
              )}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                {navIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
        {BARBER_MODULE_DISPLAY_NAME}
      </span>
      <BarberHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}
