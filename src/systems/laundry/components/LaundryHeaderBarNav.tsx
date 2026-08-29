"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LAUNDRY_MODULE_DISPLAY_NAME,
  LAUNDRY_SETTINGS_PATH,
  LAUNDRY_TAB_ITEMS,
  isLaundrySettingsActive,
  isLaundryTabActive,
  laundryTabHref,
  type LaundryTabKey,
} from "@/systems/laundry/laundry-module-nav";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

function LaundryTabIcon({ tabKey }: { tabKey: LaundryTabKey }) {
  switch (tabKey) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "packages":
      return (
        <>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
        </>
      );
  }
}

function LaundryHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function LaundryHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <LaundryHeaderExpandGlyph />
    </button>
  );
}

const headerNavLinkClass = (active: boolean) =>
  cn(
    "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black transition-all sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs",
    active
      ? "bg-white text-[#4d47b6] shadow-md shadow-black/25 ring-1 ring-white/50"
      : "text-white/85 hover:bg-white/15 hover:text-white",
  );

export function LaundryHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const onSettings = isLaundrySettingsActive(pathname);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูโมดูลรับฝากซักผ้า"
      >
        {LAUNDRY_TAB_ITEMS.map((item) => {
          const active = !onSettings && isLaundryTabActive(pathname, item.key, tabParam);
          return (
            <Link
              key={item.key}
              href={laundryTabHref(item.key)}
              className={headerNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <LaundryTabIcon tabKey={item.key} />
                </svg>
              </span>
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={LAUNDRY_SETTINGS_PATH}
          className={headerNavLinkClass(onSettings)}
          aria-current={onSettings ? "page" : undefined}
          aria-label="ตั้งค่าร้าน"
          title="ตั้งค่าร้าน"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
            <IconModuleShopSettings className="h-3.5 w-3.5" />
          </span>
          <span className="hidden xl:inline">{MODULE_SHOP_SETTINGS_SHORT_LABEL}</span>
        </Link>
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
        {LAUNDRY_MODULE_DISPLAY_NAME}
      </span>
      <LaundryHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}
