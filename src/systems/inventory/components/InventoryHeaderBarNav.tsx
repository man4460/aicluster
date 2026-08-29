"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  INVENTORY_MODULE_DISPLAY_NAME,
  INVENTORY_NAV_ITEMS,
  inventoryNavActive,
  type InventoryNavKey,
} from "@/systems/inventory/inventory-module-nav";

function inventoryHeaderIcon(key: InventoryNavKey, className?: string) {
  let glyph: React.ReactNode;
  if (key === "overview") {
    glyph = (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </>
    );
  } else if (key === "items") {
    glyph = (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
        <path d="M3 8v8l9 5 9-5V8" strokeLinejoin="round" />
        <path d="M12 13v8" />
      </>
    );
  } else if (key === "warehouses") {
    glyph = (
      <>
        <path d="M3 9 12 4l9 5v11H3z" strokeLinejoin="round" />
        <path d="M7 20v-7h10v7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-3h4v3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  } else {
    glyph = <path d="M7 7h11l-3-3M17 17H6l3 3" strokeLinecap="round" strokeLinejoin="round" />;
  }
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
      {glyph}
    </svg>
  );
}

function InventoryHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function InventoryHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <InventoryHeaderExpandGlyph />
    </button>
  );
}

export function InventoryHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูโมดูลคลังสต๊อกสินค้า"
      >
        {INVENTORY_NAV_ITEMS.map((item) => {
          const active = inventoryNavActive(pathname, item.href);
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
                {inventoryHeaderIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
        {INVENTORY_MODULE_DISPLAY_NAME}
      </span>
      <InventoryHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}
