"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHubMenuIcon } from "@/components/admin/AdminHubMenuIcons";
import {
  AppMobileDockShell,
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
  appMobileDockGridClass,
} from "@/components/app-templates";
import {
  ADMIN_HUB_HEADER_COLLAPSE_EVENT,
  ADMIN_HUB_MENU_ORDER,
  isAdminHubNavActive,
  readAdminHubHeaderCollapsed,
  writeAdminHubHeaderCollapsed,
} from "@/lib/admin-hub-nav";
import { cn } from "@/lib/cn";

const desktopNavLinkBase =
  "flex min-h-[44px] w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-center text-[11px] font-black leading-tight transition-all sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs " +
  "touch-manipulation active:scale-[0.98]";

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full min-w-[3.35rem] flex-col items-center justify-center gap-1 rounded-[1.35rem] px-0.5 py-1.5 text-center transition-all active:scale-90 touch-manipulation",
    active
      ? cn("text-white shadow-sm", appDashboardBrandGradientFillClass)
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function AdminHubChrome() {
  const pathname = usePathname() ?? "";
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readAdminHubHeaderCollapsed());
    sync();
    window.addEventListener(ADMIN_HUB_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ADMIN_HUB_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeAdminHubHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-3 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
          "sm:p-6 print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />

        <header className="mt-5">
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-indigo-200/80",
                  appDashboardBrandGradientFillClass,
                )}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path d="M12 15v3M9 21h6M5 4h14l-1 14H6L5 4z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">แอดมิน</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ศูนย์แอดมิน</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleHeaderCollapse}
              className="inline-flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
              aria-pressed={headerCollapsed}
              aria-label="ซ่อนส่วนหัวและเมนูศูนย์แอดมิน"
              title="ซ่อนส่วนหัวและเมนู"
              suppressHydrationWarning
            >
              <HeaderCollapseGlyph collapsed={false} />
            </button>
          </div>
        </header>

        <nav aria-label="เมนูศูนย์แอดมิน" className="mt-5 hidden border-t border-white/40 pt-5 md:block">
          <ul className="grid grid-cols-4 gap-1.5 xl:grid-cols-7">
            {ADMIN_HUB_MENU_ORDER.map((item) => {
              const active = isAdminHubNavActive(pathname, item.href);
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      desktopNavLinkBase,
                      active
                        ? cn("text-white shadow-md", appDashboardBrandGradientFillClass)
                        : "text-[#66638c] hover:bg-white/50 hover:text-[#2e2a58]",
                    )}
                  >
                    <AdminHubMenuIcon
                      name={item.icon}
                      className={cn(
                        "h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]",
                        active ? "text-white" : "text-slate-400",
                      )}
                    />
                    <span className="line-clamp-2 max-w-full">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <AppMobileDockShell ariaLabel="เมนูล่างศูนย์แอดมิน">
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul
            className={cn(appMobileDockGridClass, "grid-flow-col auto-cols-[minmax(3.35rem,1fr)]")}
            role="list"
          >
            {ADMIN_HUB_MENU_ORDER.map((item) => {
              const active = isAdminHubNavActive(pathname, item.href);
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                    className={dockLinkClass(active)}
                  >
                    <AdminHubMenuIcon name={item.icon} className="h-5 w-5" />
                    <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                      {item.dockLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </AppMobileDockShell>
    </>
  );
}
