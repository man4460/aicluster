"use client";

import { useEffect, useState } from "react";
import { LandingAndroidInstallGuide } from "@/app/landing/LandingAndroidInstallGuide";
import {
  appDashboardBrandGradientFillClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

/** การ์ดติดตั้งแอปมือถือ — กดปุ่มแล้วค่อยแสดงคู่มือ */
export function DashboardMobileAppInstallCard({ className }: { className?: string }) {
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
    <section
      id="download-app"
      className={cn(
        "app-surface scroll-mt-24 overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 pl-0.5 sm:pl-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66638c]">Mobile app</p>
          <p className="mt-1 text-sm font-black text-[#2e2a58] sm:text-base">ติดตั้งแอปบนมือถือ</p>
          <p className="mt-0.5 text-xs font-medium text-[#66638c]">
            Android ดาวน์โหลดติดตั้งได้ · iPhone / iPad มีคู่มือในปุ่ม
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="dashboard-mobile-app-install-panel"
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition active:scale-[0.99]",
            open
              ? cn(appTemplateOutlineButtonClass, "border-[#0000BF]/35 bg-[#0000BF]/10 text-[#2e2a58]")
              : cn("text-white shadow-sm", appDashboardBrandGradientFillClass),
          )}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="text-base leading-none">
            📱
          </span>
          {open ? "ซ่อนคู่มือ" : "แสดงวิธีติดตั้ง"}
        </button>
      </div>

      <div
        id="dashboard-mobile-app-install-panel"
        hidden={!open}
        className={cn("mt-4 border-t border-[#e8e6fc]/80 pt-4", open ? "block" : "hidden")}
      >
        {open ? <LandingAndroidInstallGuide variant="section" /> : null}
      </div>
    </section>
  );
}
