"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminHubMenuIcon } from "@/components/admin/AdminHubMenuIcons";
import { AppMobileDockShell, appMobileDockGridClass } from "@/components/app-templates";
import { ADMIN_HUB_MENU_ORDER } from "@/lib/admin-hub-nav";
import { cn } from "@/lib/cn";

const desktopNavLinkBase =
  "flex min-h-0 w-full items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-black transition-all sm:text-sm " +
  "touch-manipulation active:scale-[0.98]";

const dockLinkBase =
  "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-95 touch-manipulation";

export function AdminHubChrome() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
          "p-4 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
          "sm:p-6 print:hidden",
        )}
      >
        <header>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                    <path d="M12 15v3M9 21h6M5 4h14l-1 14H6L5 4z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                    <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#7c3aed] bg-clip-text text-transparent">
                      ศูนย์แอดมิน
                    </span>
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5f5a8a]">
                    ควบคุมผู้ใช้ บันทึกระบบ MQTT และภาพการ์ดโมดูล — เลือกเมนูด้านล่างบนมือถือ หรือแถบด้านใน
                    บนเดสก์ท็อป
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav aria-label="เมนูศูนย์แอดมิน" className="mt-5 hidden border-t border-white/40 pt-5 md:block">
          <ul className="grid grid-cols-3 gap-1.5 xl:grid-cols-6">
            {ADMIN_HUB_MENU_ORDER.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    className={cn(
                      desktopNavLinkBase,
                      active
                        ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/15 backdrop-blur-sm"
                        : "text-[#66638c] hover:bg-white/50 hover:text-[#2e2a58]",
                    )}
                  >
                    <AdminHubMenuIcon
                      name={item.icon}
                      className={cn("h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]", active ? "text-[#5b61ff]" : "text-slate-400")}
                    />
                    <span className="line-clamp-2 leading-tight">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <AppMobileDockShell ariaLabel="เมนูล่างศูนย์แอดมิน">
        <ul className={cn(appMobileDockGridClass, "grid-cols-3")}>
          {ADMIN_HUB_MENU_ORDER.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={cn(
                    dockLinkBase,
                    active
                      ? "bg-white/85 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
                      : "text-slate-500 hover:bg-white/45 hover:text-slate-800",
                  )}
                >
                  <AdminHubMenuIcon name={item.icon} className="h-[1.15rem] w-[1.15rem]" />
                  <span className="max-w-full truncate px-0.5 text-[9px] font-black leading-tight">{item.dockLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>
    </>
  );
}
