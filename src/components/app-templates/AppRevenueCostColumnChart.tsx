"use client";

import { cn } from "@/lib/cn";

export type AppRevenueCostBucket = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  revenuePct: number;
  costPct: number;
};

export type AppRevenueCostColumnChartProps = {
  buckets: AppRevenueCostBucket[];
  title?: string;
  subtitle?: string;
  emptyText: string;
  formatTitle?: (b: AppRevenueCostBucket) => string;
  className?: string;
};

/**
 * กราฟแท่งคู่ต่อวัน: รายได้ vs รายจ่าย/ต้นทุน (สเกลเดียวกัน)
 */
export function AppRevenueCostColumnChart({
  buckets,
  title,
  subtitle,
  emptyText,
  formatTitle,
  className,
}: AppRevenueCostColumnChartProps) {
  const titleCls = "text-[#2e2a58]";
  const subCls = "text-[#66638c]";
  const track = "bg-[#ecebff]/40";
  const barRev = "bg-gradient-to-t from-[#4d47b6] via-[#7c3aed]/90 to-[#a78bfa]/80";
  const barCost = "bg-gradient-to-t from-rose-600 via-rose-500 to-rose-300";
  const emptyCls = "border-[#d8d6ec] bg-[#faf9ff] text-[#66638c]";

  if (buckets.length === 0) {
    return (
      <div className={className}>
        {title ? <h3 className={cn("text-sm font-semibold", titleCls)}>{title}</h3> : null}
        {subtitle ? <p className={cn("mt-0.5 text-xs", subCls)}>{subtitle}</p> : null}
        <p className={cn("mt-3 rounded-xl border border-dashed py-6 text-center text-sm", emptyCls)}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title ? <h3 className={cn("text-sm font-semibold", titleCls)}>{title}</h3> : null}
      {subtitle ? <p className={cn("mt-0.5 text-xs", subCls)}>{subtitle}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-[#66638c]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-[#6d28d9]" aria-hidden />
          รายได้
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-rose-500" aria-hidden />
          รายจ่าย / ต้นทุน
        </span>
      </div>
      <div className="mt-3 flex max-w-full gap-1.5 overflow-x-auto pb-2 pt-1 [-webkit-overflow-scrolling:touch]">
        {buckets.map((b) => (
          <div
            key={b.key}
            className="flex w-11 shrink-0 flex-col items-center gap-1 sm:w-14"
            title={
              formatTitle ?
                formatTitle(b)
              : `${b.label} — รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
            }
          >
            <div className={cn("flex h-36 w-full items-end justify-center gap-0.5 rounded-t-lg px-0.5 pt-1", track)}>
              <div className="flex h-full min-w-0 flex-1 flex-col items-stretch justify-end">
                <div
                  className={cn("w-full rounded-t-sm transition-all", barRev)}
                  style={{ height: `${Math.max(4, b.revenuePct)}%` }}
                />
              </div>
              <div className="flex h-full min-w-0 flex-1 flex-col items-stretch justify-end">
                <div
                  className={cn("w-full rounded-t-sm transition-all", barCost)}
                  style={{ height: `${Math.max(4, b.costPct)}%` }}
                />
              </div>
            </div>
            <span className="max-w-[3.5rem] truncate text-center text-[9px] font-medium leading-tight text-[#66638c] sm:text-[10px]">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
