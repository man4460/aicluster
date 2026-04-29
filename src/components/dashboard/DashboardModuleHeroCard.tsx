"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates";
import { isSafeModuleCardImageUrl } from "@/lib/module-card-image";
import { cn } from "@/lib/cn";

/** แกนรูปแบบปุ่มหลัก — เปิดแผนผังระบบ / เข้าใช้งาน */
export const dashboardModulePrimaryButtonCore = cn(
  "inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

/** ปุ่มเต็มความกว้าง (การ์ดแดชบอร์ด) */
export const dashboardModulePrimaryCtaClass = cn(dashboardModulePrimaryButtonCore, "w-full");

/** ปุ่ม Subscribe — ไล่สีเดียวกับปุ่ม «เปิดแผนผังระบบ» ขนาดคอมแพ็กต์ในแถวปุ่ม */
export const dashboardModuleSubscribeButtonClass = cn(
  "inline-flex min-h-[44px] flex-1 min-w-[6.5rem] items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-md shadow-fuchsia-500/25 transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

function GroupIcon({ groupId, className }: { groupId: number; className?: string }) {
  if (groupId === 1) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M8 4h4v4H8zM4 8h4v4H4zM8 12h4v4H8zM12 8h4v4h-4z" />
      </svg>
    );
  }
  if (groupId === 2) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </svg>
    );
  }
  if (groupId === 3) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19V9M10 19V5M16 19v-8M22 19V7" />
      </svg>
    );
  }
  if (groupId === 4) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 20l5-8 4 4 7-12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z" />
    </svg>
  );
}

function groupToneDot(groupId: number): string {
  if (groupId === 1) return "●";
  if (groupId === 2) return "◆";
  if (groupId === 3) return "▲";
  if (groupId === 4) return "■";
  return "★";
}

/** พื้นหลังเมื่อไม่มีรูป — โทนอ่อนสว่าง ให้เข้ากับเฟรมใหญ่ */
function fallbackPanelClass(groupId: number): string {
  if (groupId === 1) return "bg-gradient-to-br from-[#eef2ff] via-white to-[#fdf4ff]";
  if (groupId === 2) return "bg-gradient-to-br from-slate-100/90 via-white to-[#f1f5f9]";
  if (groupId === 3) return "bg-gradient-to-br from-amber-50 via-white to-orange-50/80";
  if (groupId === 4) return "bg-gradient-to-br from-fuchsia-50 via-white to-violet-50/90";
  return "bg-gradient-to-br from-rose-50 via-white to-[#f5f3ff]";
}

type Base = {
  imageUrl?: string | null;
  title: string;
  description: string;
  groupId: number;
  variant?: "module" | "systemMap";
  tall?: boolean;
};

type WithCta = Base & {
  href: string;
  ctaLabel: string;
  footer?: never;
};

type WithFooter = Base & {
  footer: ReactNode;
  href?: never;
  ctaLabel?: never;
};

export type DashboardModuleHeroCardProps = WithCta | WithFooter;

export function DashboardModuleHeroCard(props: DashboardModuleHeroCardProps) {
  const { imageUrl, title, description, groupId, variant = "module", tall = false } = props;
  const safe = imageUrl && isSafeModuleCardImageUrl(imageUrl) ? imageUrl : null;
  const hasFooter = "footer" in props && props.footer != null;

  const imageMaxH = tall ? "max-h-[min(15rem,42vw)]" : "max-h-[min(12.5rem,38vw)]";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-[#fcfbff] to-[#fffbfc] shadow-[0_12px_40px_-20px_rgba(79,70,229,0.15)] ring-1 ring-[#e8e4ff]/50 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-12px_rgba(79,70,229,0.25)]",
        variant === "systemMap" &&
          "border-2 border-dashed border-[#c8c4ff]/60 ring-2 ring-[#ddd6fe]/30 ring-offset-2 ring-offset-[#fbfaff]",
      )}
    >
      {/* Decorative Blur — แสดงเฉพาะเมื่อ Hover */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/5 blur-[40px] transition-opacity duration-500 group-hover:opacity-100" />

      {/* พื้นที่รูป — object-contain ให้เห็นภาพเต็มคงสัดส่วน */}
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#faf9ff] via-white/80 to-[#fdfcff] px-4 pt-5 pb-3",
          tall ? "min-h-[12rem]" : "min-h-[10.5rem]",
        )}
      >
        {safe ? (
          <div className="relative z-[1] w-full overflow-hidden rounded-2xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safe}
              alt=""
              className={cn(
                "w-full object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]",
                imageMaxH,
              )}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className={cn(
              "relative z-[1] flex w-full items-center justify-center rounded-2xl border border-white bg-white/40 shadow-inner backdrop-blur-sm",
              tall ? "min-h-[10.5rem]" : "min-h-[9rem]",
              fallbackPanelClass(groupId),
            )}
          >
            <div className="transition-transform duration-500 group-hover:scale-110">
              <GroupIcon groupId={groupId} className="h-16 w-16 opacity-[0.25] drop-shadow-sm" />
            </div>
          </div>
        )}
      </div>

      {/* โซนข้อความ — ไล่ขาวสว่างเข้ากับเฟรม */}
      <div className="relative flex flex-col gap-2.5 border-t border-white/80 bg-white/60 px-5 pb-5 pt-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" aria-hidden />
            Group {groupId}
          </span>
          <div className="rounded-full bg-slate-50 p-1.5 shadow-sm ring-1 ring-slate-100">
            <GroupIcon groupId={groupId} className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3
            className={cn(
              "line-clamp-2 font-black leading-snug tracking-tight text-[#1e1b4b] transition-colors group-hover:text-[#0000BF]",
              tall ? "text-base" : "text-[1.05rem]",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "line-clamp-2 whitespace-pre-line leading-relaxed text-[#66638c]",
              tall ? "min-h-[2.5rem] text-[11px]" : "min-h-[2.75rem] text-[13px]",
            )}
          >
            {description}
          </p>
        </div>

        <div className={cn("mt-2", tall ? "pt-1" : "pt-2")}>
          {hasFooter ? (
            props.footer
          ) : (
            <Link 
              href={(props as WithCta).href} 
              className={cn(
                dashboardModulePrimaryCtaClass,
                "transition-all duration-300 hover:scale-[1.02] hover:brightness-105 active:scale-95"
              )}
            >
              {(props as WithCta).ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
