"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** แถวรายการแลกคะแนน — รูปซ้าย + ชื่อ/คะแนน + ปุ่มแลก */
export function LoyaltyRewardMenuCard({
  title,
  pointsCost,
  imageUrl,
  disabled,
  busy,
  onRedeem,
  className,
}: {
  title: string;
  pointsCost: number;
  imageUrl?: string | null;
  disabled?: boolean;
  busy?: boolean;
  onRedeem?: () => void;
  className?: string;
}) {
  const src = (imageUrl ?? "").trim();
  return (
    <li
      className={cn(
        "flex min-h-[44px] items-center gap-2 rounded-lg border border-[#eceaf8]/90 bg-white/90 px-1.5 py-1",
        className,
      )}
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-slate-100 to-violet-50">
        {src ?
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover object-center" />
        : <div className="flex h-full w-full items-center justify-center text-slate-300" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16M14 14l1.5-1.5a2 2 0 012.8 0L20 14M6 8h.01" strokeLinecap="round" />
              <rect x="3" y="5" width="18" height="14" rx="2" />
            </svg>
          </div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#1e1b4b]">{title}</p>
        <p className="text-[11px] font-bold tabular-nums text-[#4d47b6]">
          {pointsCost.toLocaleString("th-TH")} คะแนน
        </p>
      </div>
      {onRedeem ?
        <button
          type="button"
          disabled={busy || disabled}
          className="min-h-[36px] shrink-0 rounded-lg bg-[#5b61ff] px-2.5 text-[11px] font-black text-white disabled:opacity-40"
          onClick={onRedeem}
        >
          แลก
        </button>
      : null}
    </li>
  );
}

export function LoyaltyRewardMenuGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn("space-y-1.5", className)}>{children}</ul>;
}
