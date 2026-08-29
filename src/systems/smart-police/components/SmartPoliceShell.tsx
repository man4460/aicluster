"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SmartPoliceMobileDock } from "@/systems/smart-police/components/SmartPoliceMobileDock";
import {
  IconSpCase,
  IconSpHome,
  IconSpReport,
  IconSpSettings,
  IconSpTemplate,
} from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  SMART_POLICE_HEADER_COLLAPSE_EVENT,
  SMART_POLICE_MODULE_DISPLAY_NAME,
  readSmartPoliceHeaderCollapsed,
  smartPoliceMainKeyFromPathname,
  smartPoliceMainMenuItems,
  writeSmartPoliceHeaderCollapsed,
  type SmartPoliceMainKey,
} from "@/systems/smart-police/smart-police-nav";

const navItemBase =
  "flex min-h-[44px] w-full min-w-0 touch-manipulation select-none items-center justify-center gap-1.5 rounded-2xl px-2 text-center text-xs font-semibold transition-colors active:opacity-90 sm:gap-2 sm:px-3 sm:text-sm";

function navIcon(key: SmartPoliceMainKey) {
  if (key === "overview") return IconSpHome;
  if (key === "cases") return IconSpCase;
  if (key === "templates") return IconSpTemplate;
  if (key === "reports") return IconSpReport;
  return IconSpSettings;
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {collapsed ? <path d="M6 9l6 6 6-6" /> : <path d="M6 15l6-6 6 6" />}
    </svg>
  );
}

export function SmartPoliceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const activeMain = smartPoliceMainKeyFromPathname(pathname);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readSmartPoliceHeaderCollapsed());
    sync();
    window.addEventListener(SMART_POLICE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SMART_POLICE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writeSmartPoliceHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <div className="-mt-1 max-w-full space-y-4 pb-24 sm:mt-0 sm:space-y-6 sm:pb-0">
      <header
        className={cn(
          "-mx-3 app-surface rounded-[2rem] px-4 py-4 sm:mx-0 sm:rounded-[2.5rem] sm:px-6 sm:py-5 print:hidden",
          headerCollapsed && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b87b8]">
              กลุ่ม 2 (Silver) · 1 โทเคน/วัน
            </p>
            <h1 className="bg-gradient-to-r from-[#1e1b4b] to-[#4d47b6] bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              {SMART_POLICE_MODULE_DISPLAY_NAME}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
              สำนวนคดี · คำให้การ · หมายเรียก · พิมพ์เอกสาร · รายงานสรุป — อิงรูปแบบ SmartPolice
            </p>
          </div>
          <button
            type="button"
            onClick={toggleHeaderCollapse}
            className="inline-flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
            aria-pressed={headerCollapsed}
            aria-label="ซ่อนส่วนหัวโมดูล"
            title="ซ่อนส่วนหัวโมดูล"
            suppressHydrationWarning
          >
            <HeaderCollapseGlyph collapsed={headerCollapsed} />
          </button>
        </div>
        <nav
          aria-label="เมนู Smart Police"
          className="mt-3 hidden border-t border-white/60 pt-3 sm:mt-4 sm:block sm:pt-4"
        >
          <ul className="grid grid-cols-5 gap-2">
            {smartPoliceMainMenuItems.map((item) => {
              const active = activeMain === item.key;
              const Icon = navIcon(item.key);
              return (
                <li key={item.key} className="min-w-0">
                  <Link
                    href={item.href}
                    className={cn(
                      navItemBase,
                      active
                        ? "bg-gradient-to-br from-[#ede9ff] via-white to-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                        : "app-btn-soft text-[#66638c]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <div className="-mx-3 sm:mx-0">{children}</div>
      <SmartPoliceMobileDock />
    </div>
  );
}
