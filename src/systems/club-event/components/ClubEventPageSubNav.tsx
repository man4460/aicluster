"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

type Tab = { key: string; label: string; href: string };

export function ClubEventPageSubNav({ tabs, ariaLabel }: { tabs: Tab[]; ariaLabel: string }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  return (
    <nav
      className="mb-3 flex flex-wrap gap-1.5 rounded-2xl border border-slate-100 bg-white/90 p-1.5 sm:rounded-3xl"
      aria-label={ariaLabel}
      role="tablist"
    >
      {tabs.map((tab) => {
        const url = new URL(tab.href, "http://local");
        const active =
          pathname === url.pathname &&
          (url.searchParams.get("tab") ?? null) === (tabParam ?? url.searchParams.get("tab"));
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "min-h-8 rounded-lg px-3 py-1.5 text-[11px] font-black sm:min-h-9 sm:text-xs",
              active
                ? "bg-gradient-to-r from-[#0000BF] to-[#6366f1] text-white shadow-sm"
                : "text-[#5f5a8a] hover:bg-violet-50/80",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
