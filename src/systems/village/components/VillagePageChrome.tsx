"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  villageEmptyDashedClass,
  villagePanelCardClass,
} from "@/systems/village/village-ui-tokens";

/** คอลัมน์หลักของหน้า */
export function VillagePageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-full space-y-4 sm:space-y-6", className)}>{children}</div>;
}

/** การ์ดเนื้อหาหลัก — glass แบบคาร์แคร์ */
export function VillagePanelCard({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const hasHead = Boolean(title || description || action);
  return (
    <div className={cn(villagePanelCardClass, "min-w-0 overflow-hidden", className)}>
      {hasHead ? (
        <div
          className={cn(
            "mb-4 flex flex-col gap-3 border-b border-white/50 pb-4 sm:flex-row sm:items-start sm:justify-between",
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title ? <h2 className="text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">{title}</h2> : null}
            {description ? <div className="mt-0.5 text-xs leading-relaxed text-[#66638c]">{description}</div> : null}
          </div>
          {action ? <div className="shrink-0 self-start pt-0.5 sm:pt-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

const statToneStyles = {
  blue: "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-700 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
  green:
    "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)]",
  red: "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)]",
  amber:
    "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)]",
  slate:
    "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)]",
  violet:
    "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-violet-100/30 text-indigo-800 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)]",
} as const;

/** สถิติแบบการ์ด — โทนเดียวกับ CarWashStat / DormStatCard */
export function VillageStatTile({
  title,
  value,
  tone = "blue",
  icon,
  className,
}: {
  title: string;
  value: string;
  tone?: keyof typeof statToneStyles;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:p-5",
        statToneStyles[tone],
        className,
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
          {icon ? <div className="opacity-40">{icon}</div> : null}
        </div>
        <p className="mt-3 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{value}</p>
      </div>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-current opacity-[0.03] blur-2xl" aria-hidden />
    </div>
  );
}

export function VillageEmptyDashed({ children }: { children: ReactNode }) {
  return <div className={villageEmptyDashedClass}>{children}</div>;
}
