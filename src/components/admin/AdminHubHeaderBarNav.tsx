"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminHubMenuIcon } from "@/components/admin/AdminHubMenuIcons";
import {
  ADMIN_HUB_DISPLAY_NAME,
  ADMIN_HUB_MENU_ORDER,
  isAdminHubNavActive,
} from "@/lib/admin-hub-nav";
import { cn } from "@/lib/cn";

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

/** ปุ่มขยายหัวศูนย์แอดมิน — มือถือใช้เมื่อซ่อนหัว */
export function AdminHubHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
      aria-label="แสดงส่วนหัวศูนย์แอดมิน"
      title="แสดงส่วนหัวศูนย์แอดมิน"
      suppressHydrationWarning
    >
      <ExpandGlyph />
    </button>
  );
}

/** แถบเมนูใน header หลักเมื่อย่อหัวศูนย์แอดมิน — เดสก์ท็อป */
export function AdminHubHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูศูนย์แอดมิน"
      >
        {ADMIN_HUB_MENU_ORDER.map((item) => {
          const active = isAdminHubNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black transition-all sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs",
                active
                  ? "bg-white text-[#4d47b6] shadow-md"
                  : "text-white/85 hover:bg-white/15 hover:text-white",
              )}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <AdminHubMenuIcon name={item.icon} className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{item.dockLabel}</span>
            </Link>
          );
        })}
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
        {ADMIN_HUB_DISPLAY_NAME}
      </span>
      <AdminHubHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}
