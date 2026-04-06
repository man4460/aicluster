"use client";

import { cn } from "@/lib/cn";

export type AppColumnBarBucket = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type AppColumnBarSparkChartProps = {
  buckets: AppColumnBarBucket[];
  title?: string;
  subtitle?: string;
  emptyText: string;
  /** แสดง tooltip บนแท่ง */
  formatTitle?: (b: AppColumnBarBucket) => string;
  variant?: "brand" | "emerald";
  className?: string;
  /**
   * จัดระยะให้สอดคล้องกับ AppColumnBarDualSparkChart (เว้นที่ legend + ความกว้างคอลัมน์/gap เดียวกัน)
   */
  pairedLayout?: boolean;
  compact?: boolean;
};

/**
 * กราฟแท่งแนวตั้งแบบเลื่อนแนวนอน (ยอดรายวัน / แนวโน้มสั้น ๆ)
 */
export function AppColumnBarSparkChart({
  buckets,
  title,
  subtitle,
  emptyText,
  formatTitle,
  variant = "brand",
  className,
  pairedLayout = false,
  compact = false,
}: AppColumnBarSparkChartProps) {
  const track = variant === "brand" ? "bg-[#ecebff]/50" : "bg-emerald-100/50";
  const bar =
    variant === "brand" ?
      "bg-gradient-to-t from-[#4d47b6] via-[#7c3aed]/90 to-[#f472b6]/85"
    : "bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-300";

  const titleCls = variant === "brand" ? "text-[#2e2a58]" : "text-slate-900";
  const subCls = variant === "brand" ? "text-[#66638c]" : "text-slate-500";
  const emptyCls =
    variant === "brand" ?
      "border-[#d8d6ec] bg-[#faf9ff] text-[#66638c]"
    : "border-emerald-200/80 bg-emerald-50/50 text-slate-600";

  const legendReserve =
    pairedLayout ?
      <div className={compact ? "mt-1 min-h-[1.5rem]" : "mt-2 min-h-[2.25rem]"} aria-hidden />
    : null;

  const colGap = compact ? "gap-px" : pairedLayout ? "gap-1.5" : "gap-1";
  const colW = compact ?
    pairedLayout ? "w-[1.55rem] sm:w-[2.05rem]"
    : "w-[1.3rem] sm:w-6"
  : pairedLayout ? "w-[2.75rem] sm:w-[3.5rem]"
  : "w-8 sm:w-10";

  const hChart = compact ? "h-24" : "h-36";
  const titleSz = compact ? "text-xs" : "text-sm";
  const subSz = compact ? "text-[10px]" : "text-xs";
  const scrollMt = compact ? "mt-2" : "mt-3";
  const scrollPad = compact ? "px-0 pb-0.5 pt-0" : "pb-2 pl-0.5 pr-1 pt-1";
  const rowGap = compact ? "gap-0.5" : "gap-1.5";
  const labelSz = compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]";
  const barMax =
    pairedLayout ? (compact ? "max-w-[10px] sm:max-w-[11px]" : "max-w-[18px]") : compact ? "max-w-[11px] sm:max-w-[12px]" : "max-w-[22px]";
  const trackRound = compact ? "rounded-t-sm" : "rounded-t-lg";
  const emptyPy = compact ? "py-4 text-xs" : "py-6 text-sm";
  const emptyMt = compact ? "mt-2" : "mt-3";

  if (buckets.length === 0) {
    return (
      <div className={className}>
        {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
        {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
        {legendReserve}
        <p className={cn("rounded-xl border border-dashed text-center", emptyMt, emptyPy, emptyCls)}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
      {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
      {legendReserve}
      <div
        className={cn(
          "flex max-w-full touch-pan-x overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          scrollMt,
          scrollPad,
          colGap,
          "[scrollbar-width:thin]",
        )}
        role="region"
        aria-label={title ?? "กราฟแท่งรายวัน"}
      >
        {buckets.map((b) => (
          <div
            key={b.key}
            className={cn("flex shrink-0 flex-col items-center", rowGap, colW)}
            title={formatTitle ? formatTitle(b) : `${b.label}: ${b.amount}`}
          >
            <div
              className={cn(
                "flex w-full items-end justify-center",
                compact ? "gap-0 px-0 pt-0" : "gap-0.5 px-0.5 pt-0.5",
                hChart,
                trackRound,
                track,
              )}
            >
              <div
                className={cn(
                  compact ? "rounded-t-sm transition-all" : "rounded-t-md transition-all",
                  pairedLayout ? "mx-auto w-full" : "w-full",
                  barMax,
                  bar,
                )}
                style={{ height: `${Math.max(8, b.pct)}%` }}
              />
            </div>
            <span
              className={cn(
                "max-w-full truncate text-center font-medium leading-tight text-[#66638c]",
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
