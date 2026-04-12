"use client";

import type { CSSProperties } from "react";
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
  /**
   * จำนวนคอลัมน์มากเกินไป → ให้เลื่อนแนวนอน แต่ละคอลัมน์กว้างขั้นต่ำ (กันแท่งบีบเกินไป)
   * ค่าเริ่ม: ถ้ามากกว่า 18 จุด จะเลื่อนได้
   */
  scrollWhenBucketsOver?: number;
};

/**
 * กราฟแท่งคู่ต่อวัน: รายได้ vs รายจ่าย/ต้นทุน (สเกลเดียวกัน)
 */
function barHeightPct(value: number, pct: number): number {
  if (value <= 0) return 0;
  return Math.max(10, Math.min(100, pct));
}

export function AppRevenueCostColumnChart({
  buckets,
  title,
  subtitle,
  emptyText,
  formatTitle,
  className,
  compact = false,
  scrollWhenBucketsOver = 18,
}: AppRevenueCostColumnChartProps) {
  const titleCls = "text-[#2e2a58]";
  const subCls = "text-[#66638c]";
  const track = "bg-[#ecebff]/40";
  const barRev = "bg-gradient-to-t from-[#4d47b6] via-[#7c3aed]/90 to-[#a78bfa]/80";
  const barCost = "bg-gradient-to-t from-rose-600 via-rose-500 to-rose-300";
  const emptyCls = "border-[#d8d6ec] bg-[#faf9ff] text-[#66638c]";

  const n = buckets.length;
  const scrollMode = n > scrollWhenBucketsOver;
  const colMinRem = compact ? 2 : 2.5;

  /** โซนแท่งสูงขึ้นบนมือถือ — เดิม compact แค่ h-24 ทำให้แท่งเตี้ยมาก */
  const hChart = compact ? "min-h-[7.5rem] h-32 sm:min-h-[8.5rem] sm:h-40" : "min-h-[9rem] h-40 sm:h-44";
  const titleSz = compact ? "text-xs" : "text-sm";
  const subSz = compact ? "text-[10px]" : "text-xs";
  const legendWrap = compact ? "mt-1 gap-2 text-[9px]" : "mt-2 gap-3 text-[10px]";
  const scrollMt = compact ? "mt-2" : "mt-3";
  const gridGap = compact ? "gap-0.5 sm:gap-1" : "gap-1 sm:gap-1.5";
  const labelSz = compact ? "px-0.5 text-[7px] leading-tight sm:text-[8px]" : "px-0.5 text-[8px] leading-tight sm:text-[9px]";
  const trackPad = compact ? "gap-px px-0.5 sm:gap-0.5 sm:px-1" : "gap-0.5 px-1";
  const barPairClass = (fill: string) =>
    cn(
      "mx-auto w-full max-w-[46%] rounded-t-md transition-all sm:max-w-[44%]",
      compact ? "min-w-[3px] sm:min-w-[4px]" : "min-w-[4px]",
      fill,
    );
  const barColClass =
    "flex h-full min-w-0 max-w-[50%] flex-1 flex-col items-stretch justify-end";
  const dotSz = compact ? "h-1.5 w-1.5" : "h-2 w-2";
  const emptyPy = compact ? "py-4 text-xs" : "py-6 text-sm";
  const emptyMt = compact ? "mt-2" : "mt-3";

  const gridStyle: CSSProperties =
    n === 0 ?
      {}
    : scrollMode ?
      {
        gridTemplateColumns: `repeat(${n}, minmax(${colMinRem}rem, 1fr))`,
        minWidth: `${n * colMinRem}rem`,
      }
    : {
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        width: "100%",
      };

  if (n === 0) {
    return (
      <div className={cn("w-full min-w-0", className)}>
        {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
        {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
        <p className={cn("rounded-xl border border-dashed text-center", emptyMt, emptyPy, emptyCls)}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
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
          "w-full min-w-0 pt-0.5",
          scrollMt,
          scrollMode &&
            "overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]",
        )}
      >
        <div className={cn("grid w-full min-w-0", gridGap)} style={gridStyle}>
          {buckets.map((b) => (
            <div
              key={b.key}
              className="flex min-w-0 flex-col items-stretch"
              title={
                formatTitle ?
                  formatTitle(b)
                : `${b.label} — รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
              }
            >
              <div
                className={cn(
                  "flex w-full min-w-0 items-end justify-center rounded-t-md pt-0.5",
                  trackPad,
                  hChart,
                  track,
                )}
              >
                <div className={barColClass}>
                  <div
                    className={barPairClass(barRev)}
                    style={{ height: `${barHeightPct(b.revenue, b.revenuePct)}%` }}
                  />
                </div>
                <div className={barColClass}>
                  <div
                    className={barPairClass(barCost)}
                    style={{ height: `${barHeightPct(b.cost, b.costPct)}%` }}
                  />
                </div>
              </div>
              <span
                className={cn(
                  "mt-1 line-clamp-2 min-h-[2.25em] w-full text-balance text-center font-medium text-[#66638c]",
                  labelSz,
                )}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
