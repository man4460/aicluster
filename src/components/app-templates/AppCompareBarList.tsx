"use client";

import { cn } from "@/lib/cn";

export type AppCompareBarRow = {
  key: string;
  label: string;
  amount: number;
  /** 0–100 ความกว้างแถบ */
  pct: number;
};

export type AppCompareBarListProps = {
  title: string;
  subtitle?: string;
  emptyText: string;
  rows: AppCompareBarRow[];
  formatAmount: (amount: number) => string;
  /** brand = ม่วง POS, emerald = รายรับ, slate = นิวตรัล */
  variant?: "brand" | "emerald" | "slate";
  className?: string;
};

const track: Record<string, string> = {
  brand: "bg-[#ecebff]",
  emerald: "bg-emerald-100",
  slate: "bg-slate-100",
};

const fill: Record<string, string> = {
  brand: "bg-gradient-to-r from-[#4d47b6] to-[#7c3aed]/90",
  emerald: "bg-emerald-500",
  slate: "bg-slate-500",
};

const titleTone: Record<string, string> = {
  brand: "text-[#2e2a58]",
  emerald: "text-slate-900",
  slate: "text-slate-900",
};

const subTone: Record<string, string> = {
  brand: "text-[#66638c]",
  emerald: "text-slate-500",
  slate: "text-slate-500",
};

const amtTone: Record<string, string> = {
  brand: "text-emerald-700",
  emerald: "text-emerald-700",
  slate: "text-slate-800",
};

/**
 * กราฟแท่งแนวนอบเปรียบเทียบหลายแถว (ยอดตามหมวด / โต๊ะ / หมวดรายจ่าย ฯลฯ)
 */
export function AppCompareBarList({
  title,
  subtitle,
  emptyText,
  rows,
  formatAmount,
  variant = "brand",
  className,
}: AppCompareBarListProps) {
  const v = variant;

  if (rows.length === 0) {
    return (
      <div className={className}>
        <h3 className={cn("text-sm font-semibold", titleTone[v])}>{title}</h3>
        {subtitle ? <p className={cn("mt-0.5 text-xs", subTone[v])}>{subtitle}</p> : null}
        <p
          className={cn(
            "mt-3 rounded-xl border border-dashed py-6 text-center text-sm",
            v === "brand" ? "border-[#d8d6ec] bg-[#faf9ff] text-[#66638c]" : "border-slate-200 bg-slate-50/40 text-slate-500",
          )}
        >
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className={cn("text-sm font-semibold", titleTone[v])}>{title}</h3>
      {subtitle ? <p className={cn("mt-0.5 text-xs", subTone[v])}>{subtitle}</p> : null}
      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
              <span className={cn("min-w-0 truncate font-medium", titleTone[v])} title={r.label}>
                {r.label}
              </span>
              <span className={cn("shrink-0 font-semibold tabular-nums", amtTone[v])}>{formatAmount(r.amount)}</span>
            </div>
            <div className={cn("mt-1 h-2 overflow-hidden rounded-full", track[v])}>
              <div
                className={cn("h-full rounded-full transition-all", fill[v])}
                style={{ width: `${Math.max(4, r.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
