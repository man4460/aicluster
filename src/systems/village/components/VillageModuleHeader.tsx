"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  villageMainKeyFromPathname,
  villageMainMenuItems,
  villagePathActive,
  villageSubMenuItems,
  type VillageMainMenuKey,
} from "@/systems/village/village-nav";

function villageMainIcon(key: VillageMainMenuKey) {
  if (key === "overview")
    return (
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    );
  if (key === "housing")
    return (
      <>
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
        <path d="M8.5 12.5h2M13.5 12.5h2" strokeLinecap="round" />
      </>
    );
  if (key === "finance")
    return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <>
      <path d="M12 3l8 4v6c0 4-3.2 6.8-8 8-4.8-1.2-8-4-8-8V7z" />
      <path d="M12 10v4M10 12h4" strokeLinecap="round" />
    </>
  );
}

export function VillageModuleHeader({ variant = "standalone" }: { variant?: "standalone" | "embedded" }) {
  const pathname = usePathname() ?? "";
  const activeMain = villageMainKeyFromPathname(pathname);
  const visibleSubMenu = villageSubMenuItems.filter((item) => item.group === activeMain);
  const embedded = variant === "embedded";
  return (
    <nav
      aria-label="เมนูหมู่บ้าน"
      className={cn(
        "print:hidden",
        embedded ? "mt-5 border-t border-white/40 pt-5" : "app-surface rounded-[2rem] p-3 sm:p-4",
      )}
    >
      {!embedded ? <p className="mb-2.5 text-xs font-black uppercase tracking-widest text-[#66638c] sm:mb-3">เมนูหลัก</p> : null}
      <ul className="flex gap-1.5">
        {villageMainMenuItems.map((item) => {
          const active = activeMain === item.key;
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all sm:text-sm",
                  active
                    ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
                    : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                )}
                aria-current={active ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4 w-4 shrink-0" aria-hidden>
                  {villageMainIcon(item.key)}
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {!embedded && visibleSubMenu.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {visibleSubMenu.map((item) => {
          const active = villagePathActive(pathname, item.href);
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                className={cn(
                  "inline-flex min-h-[34px] items-center rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "border-[#5b61ff]/30 bg-[#eef0ff] text-[#4d47b6]"
                    : "border-white/55 bg-white/45 text-slate-600 hover:bg-white/65",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
