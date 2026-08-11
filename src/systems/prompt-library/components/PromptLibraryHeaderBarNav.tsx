"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  PROMPT_LIBRARY_MODULE_DISPLAY_NAME,
  PROMPT_LIBRARY_NAV_ITEMS,
  isPromptLibraryNavItemActive,
  type PromptLibraryNavKey,
} from "@/systems/prompt-library/prompt-library-module-nav";

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <path d="M9.5 2 8 8l-6 1.5L8 11l1.5 6L11 11l6-1.5L11 8 9.5 2Z" strokeLinejoin="round" />
      <path d="M18 14.5 17 17l-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}

function navIcon(key: PromptLibraryNavKey, className?: string) {
  switch (key) {
    case "library":
      return <IconSpark className={className} />;
    case "categories":
      return <IconFolder className={className} />;
  }
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function PromptLibraryHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 sm:h-9 sm:w-9 sm:rounded-xl"
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
      suppressHydrationWarning
    >
      <ExpandGlyph />
    </button>
  );
}

export function PromptLibraryHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
      <nav
        className="flex min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        aria-label="เมนูโมดูลคลังคำสั่ง AI"
      >
        {PROMPT_LIBRARY_NAV_ITEMS.map((item) => {
          const active = isPromptLibraryNavItemActive(pathname, item.key);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[10px] font-black transition-all sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs",
                active ? "bg-white text-[#4d47b6] shadow-md" : "text-white/85 hover:bg-white/15 hover:text-white",
              )}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                {navIcon(item.key, "h-3.5 w-3.5")}
              </span>
              <span className="hidden xl:inline">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
      <span className="hidden max-w-[12rem] shrink-0 truncate text-right text-sm font-black tracking-tight text-white md:inline lg:max-w-[16rem]">
        {PROMPT_LIBRARY_MODULE_DISPLAY_NAME}
      </span>
      <PromptLibraryHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}
