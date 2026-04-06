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
  /** แท่งและตัวอักษรเล็กลง — เหมาะดูภาพรวมหลายจุดบนหน้าจอ */
  compact?: boolean;
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
  compact = false,
}: AppRevenueCostColumnChartProps) {
  const titleCls = "text-[#2e2a58]";
  const subCls = "text-[#66638c]";
  const track = "bg-[#ecebff]/40";
  const barRev = "bg-gradient-to-t from-[#4d47b6] via-[#7c3aed]/90 to-[#a78bfa]/80";
  const barCost = "bg-gradient-to-t from-rose-600 via-rose-500 to-rose-300";
  const emptyCls = "border-[#d8d6ec] bg-[#faf9ff] text-[#66638c]";

  const hChart = compact ? "h-24" : "h-36";
  const titleSz = compact ? "text-xs" : "text-sm";
  const subSz = compact ? "text-[10px]" : "text-xs";
  const legendWrap = compact ? "mt-1 gap-2 text-[9px]" : "mt-2 gap-3 text-[10px]";
  const scrollMt = compact ? "mt-2" : "mt-3";
  const scrollGap = compact ? "gap-0.5" : "gap-1";
  const colClass = compact ? "w-7 gap-0 sm:w-9" : "w-9 gap-0.5 sm:w-11";
  const labelSz = compact ? "max-w-[2.35rem] text-[8px] sm:text-[9px]" : "max-w-[3rem] text-[9px] sm:text-[10px]";
  const trackPad = compact ? "gap-px px-px" : "gap-0.5 px-0.5";
  const barPairClass = (fill: string) =>
    compact ?
      cn("mx-auto w-full max-w-[9px] rounded-t-sm transition-all sm:max-w-[10px]", fill)
    : cn("w-full rounded-t-sm transition-all", fill);
  const barColClass = compact ? "flex h-full min-w-0 max-w-[48%] flex-1 flex-col items-stretch justify-end" : "flex h-full min-w-0 flex-1 flex-col items-stretch justify-end";
  const dotSz = compact ? "h-1.5 w-1.5" : "h-2 w-2";
  const emptyPy = compact ? "py-4 text-xs" : "py-6 text-sm";
  const emptyMt = compact ? "mt-2" : "mt-3";

  if (buckets.length === 0) {
    return (
      <div className={className}>
        {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
        {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
        <p className={cn("rounded-xl border border-dashed text-center", emptyMt, emptyPy, emptyCls)}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
      {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
      <div className={cn("flex flex-wrap items-center text-[#66638c]", legendWrap)}>
        <span className="inline-flex items-center gap-1">
          <span className={cn("rounded-sm bg-[#6d28d9]", dotSz)} aria-hidden />
          รายได้
        </span>
        <span className="inline-flex items-center gap-1">
          <span className={cn("rounded-sm bg-rose-500", dotSz)} aria-hidden />
          รายจ่าย / ต้นทุน
        </span>
      </div>
      <div
        className={cn(
          "flex max-w-full overflow-x-auto pb-1 pt-0.5 [-webkit-overflow-scrolling:touch]",
          scrollMt,
          scrollGap,
        )}
      >
        {buckets.map((b) => (
          <div
            key={b.key}
            className={cn("flex shrink-0 flex-col items-center", colClass)}
            title={
              formatTitle ?
                formatTitle(b)
              : `${b.label} — รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
            }
          >
            <div
              className={cn(
                "flex w-full items-end justify-center rounded-t-md pt-0.5",
                trackPad,
                hChart,
                track,
              )}
            >
              <div className={barColClass}>
                <div className={barPairClass(barRev)} style={{ height: `${Math.max(4, b.revenuePct)}%` }} />
              </div>
              <div className={barColClass}>
                <div className={barPairClass(barCost)} style={{ height: `${Math.max(4, b.costPct)}%` }} />
              </div>
            </div>
            <span
              className={cn(
                "truncate text-center font-medium leading-tight text-[#66638c]",
                labelSz,
              )}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
