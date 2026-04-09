"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { isSafeModuleCardImageUrl } from "@/lib/module-card-image";
import { cn } from "@/lib/cn";

/** แกนรูปแบบปุ่มหลัก — สีเดียวกับปุ่ม «อัปโหลดรูปการ์ดระบบ» */
export const dashboardModulePrimaryButtonCore =
  "inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0000a3] active:scale-[0.99] disabled:opacity-50";

/** ปุ่มเต็มความกว้าง (การ์ดแดชบอร์ด) */
export const dashboardModulePrimaryCtaClass = cn(dashboardModulePrimaryButtonCore, "w-full");

function groupIcon(groupId: number): string {
  if (groupId === 1) return "🧩";
  if (groupId === 2) return "⚙️";
  if (groupId === 3) return "📊";
  if (groupId === 4) return "🛠️";
  return "✨";
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
        "group flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-[#f7f6ff] to-[#fff8fc] shadow-[0_14px_44px_-18px_rgba(79,70,229,0.22)] ring-1 ring-[#e8e4ff]/55 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-16px_rgba(79,70,229,0.28)]",
        variant === "systemMap" &&
          "border-2 border-dashed border-[#c8c4ff]/70 ring-2 ring-[#ddd6fe]/40 ring-offset-2 ring-offset-[#f5f3ff]",
      )}
    >
      {/* พื้นที่รูป — object-contain ให้เห็นภาพเต็มคงสัดส่วน */}
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#faf8ff] via-white to-[#fffcff] px-3 pt-4 pb-2",
          tall ? "min-h-[11.5rem]" : "min-h-[10rem]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#f7f4ff]/80"
          aria-hidden
        />
        {safe ? (
          <div className="relative z-[1] w-full overflow-hidden rounded-2xl ring-1 ring-slate-200/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safe}
              alt=""
              className={cn(
                "w-full object-contain object-center transition duration-500 ease-out group-hover:scale-[1.02]",
                imageMaxH,
              )}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className={cn(
              "relative z-[1] flex w-full items-center justify-center rounded-2xl border border-white/70",
              tall ? "min-h-[10rem]" : "min-h-[8.5rem]",
              fallbackPanelClass(groupId),
            )}
          >
            <span
              className="text-[4.5rem] leading-none opacity-[0.22] drop-shadow-sm select-none"
              aria-hidden
            >
              {groupIcon(groupId)}
            </span>
          </div>
        )}
      </div>

      {/* โซนข้อความ — ไล่ขาวสว่างเข้ากับเฟรม */}
      <div className="relative flex flex-col gap-2 border-t border-white/90 bg-gradient-to-b from-white via-[#fffefd] to-[#f4f2ff] px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#0000BF]/18 bg-[#0000BF]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#0000BF]">
            <span className="opacity-80" aria-hidden>
              {groupToneDot(groupId)}
            </span>
            กลุ่ม {groupId}
          </span>
          <span className="text-lg leading-none opacity-90" aria-hidden>
            {groupIcon(groupId)}
          </span>
        </div>
        <h3
          className={cn(
            "line-clamp-2 font-bold leading-snug tracking-tight text-slate-900",
            tall ? "text-base" : "text-[1.05rem]",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "line-clamp-2 whitespace-pre-line leading-relaxed text-slate-600",
            tall ? "min-h-[2.5rem] text-xs" : "min-h-[2.875rem] text-sm",
          )}
        >
          {description}
        </p>
        <div className={cn("space-y-2", tall ? "mt-1" : "mt-2")}>
          {hasFooter ? (
            props.footer
          ) : (
            <Link href={(props as WithCta).href} className={dashboardModulePrimaryCtaClass}>
              {(props as WithCta).ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
