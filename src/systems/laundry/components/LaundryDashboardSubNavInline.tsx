"use client";

import { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LAUNDRY_BASE,
  LAUNDRY_DASHBOARD_TAB_ITEMS,
  laundryDashboardTabIcon,
  parseLaundryDashboardTab,
  type LaundryDashboardTabKey,
} from "@/systems/laundry/laundry-module-nav";
import {
  laundryInlineSubNavBtnClass,
  laundryInlineSubNavShellClass,
} from "@/systems/laundry/lib/ui-tokens";

function LaundryDashboardSubNavInlineInner({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? LAUNDRY_BASE;
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseLaundryDashboardTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: string) => {
      const key = next as LaundryDashboardTabKey;
      const q = new URLSearchParams(searchParams.toString());
      if (key === "overview") q.delete("tab");
      else q.set("tab", key);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <nav
      className={cn(laundryInlineSubNavShellClass, "print:hidden", className)}
      aria-label="แท็บแดชบอร์ดซักผ้า"
      role="tablist"
    >
      {LAUNDRY_DASHBOARD_TAB_ITEMS.map((item) => {
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={() => setTab(item.key)}
            className={laundryInlineSubNavBtnClass(active)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-4 w-4 shrink-0" aria-hidden>
              {laundryDashboardTabIcon(item.key)}
            </svg>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** แท็บย่อยแดชบอร์ด — มุมขวาบนในการ์ดเนื้อหา */
export function LaundryDashboardSubNavInline({ className }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <LaundryDashboardSubNavInlineInner className={className} />
    </Suspense>
  );
}
