"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { hotelResortStatIconBadgeClass } from "@/systems/hotel-resort/lib/ui-tokens";

export type HotelResortStatTone = "slate" | "indigo" | "emerald" | "amber" | "rose" | "violet";

const toneStyles: Record<HotelResortStatTone, string> = {
  slate:
    "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)]",
  indigo:
    "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-700 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
  violet:
    "border-white/60 bg-gradient-to-br from-white/60 via-violet-50/35 to-violet-100/30 text-violet-700 shadow-[0_18px_38px_-26px_rgba(124,58,237,0.4)]",
  emerald:
    "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",
  amber:
    "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",
  rose:
    "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)]",
};

export function HotelResortStatCard({
  title,
  value,
  tone = "indigo",
  icon,
  className,
}: {
  title: string;
  value: string;
  tone?: HotelResortStatTone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "relative list-none overflow-hidden rounded-[1.35rem] border p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.38)] sm:rounded-[2rem] sm:p-5",
        toneStyles[tone],
        className,
      )}
    >
      <div className="relative z-10 flex min-h-0 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[9px] font-black uppercase leading-tight tracking-[0.12em] opacity-70 sm:text-[10px] sm:tracking-widest">
            {title}
          </p>
          {icon ? <div className={hotelResortStatIconBadgeClass(tone)}>{icon}</div> : null}
        </div>
        <p className="mt-2 text-xl font-black tabular-nums tracking-tight sm:mt-4 sm:text-2xl lg:text-3xl">{value}</p>
      </div>
      <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-current opacity-[0.06] blur-2xl sm:h-20 sm:w-20" aria-hidden />
    </li>
  );
}
