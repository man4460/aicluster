"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LandingAndroidInstallGuide } from "@/app/landing/LandingAndroidInstallGuide";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type Props = {
  displayName: string;
  className?: string;
};

/** ส่วนหัวหน้าแดชบอร์ด — ปุ่มติดตั้งแอปอยู่ข้าง «ดูระบบทั้งหมด» */
export function DashboardMobileAppInstallCard({ displayName, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      if (window.location.hash === "#download-app") setOpen(true);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return (
    <header
      id="download-app"
      className={cn(
        "app-surface scroll-mt-24 overflow-hidden rounded-[1.35rem] border border-[#e8e6fc]/80 p-4 sm:p-5",
        className,
      )}
    >
      <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 pl-0.5 sm:pl-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Workspace</p>
          <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#2e2a58] sm:text-2xl">
            สวัสดี, <span className="app-gradient-text">{displayName}</span>
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="dashboard-mobile-app-install-panel"
            className={cn(
              "inline-flex h-10 min-w-[40px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black transition active:scale-[0.99] sm:px-4",
              open
                ? cn(appTemplateOutlineButtonClass, "border-[#0000BF]/35 bg-[#0000BF]/10 text-[#2e2a58]")
                : cn("text-white shadow-sm", appDashboardBrandGradientFillClass),
            )}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden className="text-sm leading-none">
              📱
            </span>
            <span className="hidden sm:inline">{open ? "ซ่อนคู่มือแอป" : "ติดตั้งแอป"}</span>
            <span className="sm:hidden">{open ? "ซ่อน" : "แอป"}</span>
          </button>
          <Link
            href="/dashboard/modules"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#0000BF]/20 bg-[#0000BF]/10 px-3 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 active:scale-[0.99] sm:px-4"
          >
            ดูระบบทั้งหมด
          </Link>
        </div>
      </div>

      <div
        id="dashboard-mobile-app-install-panel"
        hidden={!open}
        className={cn(
          "mt-4 border-t border-[#e8e6fc]/80 pt-4",
          open ? "block" : "hidden",
        )}
      >
        {open ? <LandingAndroidInstallGuide variant="section" /> : null}
      </div>
    </header>
  );
}
