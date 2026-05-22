"use client";

import { cn } from "@/lib/cn";

export type HomeFinanceStatTone = "slate" | "blue" | "green" | "amber" | "rose" | "violet";

const toneStyles: Record<HomeFinanceStatTone, string> = {
  violet:
    "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
  blue: "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-700 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
  green:
    "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",
  amber:
    "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",
  rose: "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)]",
  slate:
    "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)]",
};

export function HomeFinanceStatCard({
  title,
  value,
  tone = "slate",
  icon,
  className,
}: {
  title: string;
  value: string;
  tone?: HomeFinanceStatTone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-6",
        toneStyles[tone],
        className,
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
          {icon ? <div className="opacity-40">{icon}</div> : null}
        </div>
        <p className="mt-4 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{value}</p>
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}
