"use client";

import { cn } from "@/lib/cn";
import {
  homeFinanceStatInlineClass,
} from "@/systems/home-finance/lib/ui-tokens";

export type HomeFinanceStatTone = "slate" | "blue" | "green" | "amber" | "rose" | "violet" | "red";

const toneBorder: Record<HomeFinanceStatTone, string> = {
  violet: "border-l-[3px] border-l-violet-500",
  blue: "border-l-[3px] border-l-sky-500",
  green: "border-l-[3px] border-l-emerald-500",
  amber: "border-l-[3px] border-l-amber-500",
  rose: "border-l-[3px] border-l-rose-500",
  red: "border-l-[3px] border-l-rose-500",
  slate: "border-l-[3px] border-l-slate-400",
};

const toneValue: Record<HomeFinanceStatTone, string> = {
  violet: "text-[#1e1b4b]",
  blue: "text-[#1e1b4b]",
  green: "text-emerald-700",
  amber: "text-amber-700",
  rose: "text-rose-600",
  red: "text-rose-600",
  slate: "text-[#1e1b4b]",
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
    <div className={cn(homeFinanceStatInlineClass, toneBorder[tone], className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#66638c]">{title}</p>
        {icon ? <div className="opacity-50">{icon}</div> : null}
      </div>
      <p className={cn("text-lg font-black tabular-nums tracking-tight sm:text-xl", toneValue[tone])}>{value}</p>
    </div>
  );
}
