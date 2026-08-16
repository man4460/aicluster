"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates";
import { isSafeModuleCardDisplayUrl } from "@/lib/module-card-image";
import type { ModuleUsageBadge } from "@/lib/modules/module-usage-badge";
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

/** พื้นหลังเมื่อไม่มีรูป — โทนอ่อน (ชั้นฮีโร่ aspect) */
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
  usageBadge?: ModuleUsageBadge | null;
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

function HeroUsagePill({ badge }: { badge: ModuleUsageBadge }) {
  if (badge.tone === "free") {
    return (
      <span
        className="rounded-full border border-emerald-300/50 bg-emerald-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md backdrop-blur-md sm:text-xs"
        title="ไม่หักโทเคนเมื่อเข้าใช้"
      >
        ฟรี
      </span>
    );
  }
  if (badge.tone === "monthly") {
    return (
      <span
        className="rounded-full border border-amber-200/60 bg-amber-400/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#1a0d3a] shadow-md backdrop-blur-md sm:text-xs"
        title="หัก 1 โทเคนต่อวันเมื่อเข้าใช้โมดูล (1 บาท = 1 โทเคน)"
      >
        {badge.label}
      </span>
    );
  }
  return (
    <span
      className="rounded-full border border-white/55 bg-white/90 px-2.5 py-1 text-[10px] font-black tracking-wide text-[#1e1b4b] shadow-md backdrop-blur-md sm:text-xs"
      title="รวมในแพ็กเกจเหมา — ไม่หักโทเคนรายวันต่อโมดูล"
    >
      {badge.label}
    </span>
  );
}

export function DashboardModuleHeroCard(props: DashboardModuleHeroCardProps) {
  const { imageUrl, title, description, groupId, variant = "module", usageBadge, tall = false } = props;
  const safe = imageUrl && isSafeModuleCardDisplayUrl(imageUrl) ? imageUrl : null;
  const hasFooter = "footer" in props && props.footer != null;

  const shellClass = cn(
    "group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-white/55 bg-white/75 shadow-[0_22px_55px_-30px_rgba(30,27,75,0.35)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition duration-500",
    "hover:-translate-y-1 hover:border-[#5b61ff]/30 hover:shadow-[0_28px_64px_-26px_rgba(91,97,255,0.38)]",
    "sm:rounded-[1.75rem]",
    variant === "systemMap" &&
      "border-2 border-dashed border-[#c8c4ff]/65 ring-2 ring-[#ddd6fe]/35 ring-offset-2 ring-offset-[#fbfaff]",
    !hasFooter && "focus-within:outline-none focus-within:ring-2 focus-within:ring-[#5b61ff]/50 focus-within:ring-offset-2 focus-within:ring-offset-[#f4f4ff]",
  );

  const hero = (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-[#ecebff] to-indigo-100/40",
        tall ? "aspect-[16/10]" : "aspect-[16/7]",
      )}
    >
      {safe ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL ผ่าน isSafeModuleCardDisplayUrl (local หรือ Unsplash ที่ไว้ใจ)
        <img
          src={safe}
          alt=""
          className="h-full w-full object-cover object-center transition duration-700 ease-out will-change-transform group-hover:scale-[1.045]"
          loading="lazy"
        />
      ) : (
        <div className={cn("flex h-full min-h-[8.5rem] w-full items-center justify-center", fallbackPanelClass(groupId))}>
          <GroupIcon groupId={groupId} className="h-14 w-14 opacity-35 text-[#4d47b6]" />
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1222]/95 via-[#1e1b4b]/4 to-[#312e81]/15"
        aria-hidden
      />
      {usageBadge ? (
        <div className="absolute right-3 top-3 z-[2] sm:right-4 sm:top-4">
          <HeroUsagePill badge={usageBadge} />
        </div>
      ) : null}
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-[1]", tall ? "p-4 sm:p-5" : "p-3 sm:p-4")}>
        <h3
          className={cn(
            "line-clamp-2 text-pretty font-black leading-snug text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]",
            tall ? "text-base sm:text-lg" : "text-[13px] sm:text-base",
          )}
        >
          {title}
        </h3>
      </div>
    </div>
  );

  const body = (
    <div className={cn("border-t border-white/50 bg-gradient-to-br from-white/90 to-indigo-50/20", tall ? "px-4 py-3.5 sm:px-5 sm:py-4" : "px-4 py-3")}>
      <p
        title={description}
        className={cn(
          "text-xs font-semibold leading-relaxed text-[#5f5a8a] sm:text-sm",
          // การ์ด «แนะนำ» (tall=false): แถวเดียวเสมอ — ความสูงการ์ดเท่ากัน
          tall ? "text-pretty line-clamp-4 whitespace-pre-line" : "truncate",
        )}
      >
        {description}
      </p>
      <div className={cn(tall ? "mt-3" : "mt-2")}>
        {hasFooter ? (
          props.footer
        ) : (
          <span
            className={cn(
              dashboardModulePrimaryCtaClass,
              "pointer-events-none text-center transition duration-300 group-hover:brightness-105",
            )}
          >
            {(props as WithCta).ctaLabel}
          </span>
        )}
      </div>
    </div>
  );

  if (!hasFooter) {
    const p = props as WithCta;
    return (
      <Link href={p.href} className={cn(shellClass, "block text-left")}>
        {hero}
        {body}
      </Link>
    );
  }

  return (
    <div className={shellClass}>
      {hero}
      {body}
    </div>
  );
}
