"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SmartPoliceMobileDock } from "@/systems/smart-police/components/SmartPoliceMobileDock";
import { IconSpCase } from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  smartPoliceIconButtonClass,
  smartPoliceModuleShellClass,
} from "@/systems/smart-police/lib/ui-tokens";
import {
  SMART_POLICE_HEADER_COLLAPSE_EVENT,
  SMART_POLICE_MODULE_DISPLAY_NAME,
  readSmartPoliceHeaderCollapsed,
  writeSmartPoliceHeaderCollapsed,
} from "@/systems/smart-police/smart-police-nav";

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      aria-hidden
    >
      {collapsed ? (
        <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
      ) : (
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      )}
    </svg>
  );
}

/**
 * Chrome Smart Police — เดสก์ท็อป: เมนูโมดูลอยู่ป๊อปอัปรูปโปรไฟล์ (DashboardShell)
 * มือถือ: ใช้ dock ล่าง
 */
export function SmartPoliceShell({ children }: { children: React.ReactNode }) {
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
    <div className={cn("flex min-w-0 flex-col gap-4 sm:gap-6", "max-lg:pb-24 lg:pb-0")}>
      <header
        className={cn(
          smartPoliceModuleShellClass,
          "flex flex-col px-4 py-4 sm:px-6 sm:py-5",
          headerCollapsed && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0000BF] via-[#5b61ff] to-[#ec4899] text-white shadow-sm"
              aria-hidden
            >
              <IconSpCase className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d47b6]">
                กลุ่ม 2 · 1 โทเคน/วัน
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e1b4b] sm:text-2xl">
                {SMART_POLICE_MODULE_DISPLAY_NAME}
              </h1>
              <p className="mt-0.5 hidden text-xs font-medium leading-relaxed text-[#66638c] md:block">
                เมนูโมดูลอยู่แถบซ้าย · มือถือใช้แถบล่าง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHeaderCollapse}
            className={smartPoliceIconButtonClass}
            aria-pressed={headerCollapsed}
            aria-label="ซ่อนส่วนหัวโมดูล"
            title="ซ่อนส่วนหัวโมดูล"
            suppressHydrationWarning
          >
            <HeaderCollapseGlyph collapsed={headerCollapsed} />
          </button>
        </div>
      </header>

      {children}
      <SmartPoliceMobileDock />
    </div>
  );
}
