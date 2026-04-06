"use client";

import { cn } from "@/lib/cn";

export type AppDualColumnBarBucket = {
  key: string;
  label: string;
  seriesA: { amount: number; pct: number };
  seriesB: { amount: number; pct: number };
};

export type AppColumnBarDualSparkChartProps = {
  buckets: AppDualColumnBarBucket[];
  title?: string;
  subtitle?: string;
  seriesALabel: string;
  seriesBLabel: string;
  emptyText: string;
  formatGroupTitle?: (b: AppDualColumnBarBucket) => string;
  className?: string;
  /** ใช้โทนหัวข้อเดียวกับกราฟแบรนด์ (คู่กับ AppColumnBarSparkChart variant=brand) */
  titleTone?: "slate" | "brand";
  compact?: boolean;
};

/**
 * กราฟแท่งคู่ต่อช่วง (เช่น หักแพ็ก vs เงินสด) — เลื่อนแนวนอน
 */
export function AppColumnBarDualSparkChart({
  buckets,
  title,
  subtitle,
  seriesALabel,
  seriesBLabel,
  emptyText,
  formatGroupTitle,
  className,
  titleTone = "slate",
  compact = false,
}: AppColumnBarDualSparkChartProps) {
  const track = "bg-[#ecebff]/50";
  const barA = "bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300";
  const barB = "bg-gradient-to-t from-emerald-700 via-emerald-500 to-emerald-300";
  const titleCls = titleTone === "brand" ? "text-[#2e2a58]" : "text-slate-900";
  const subCls = titleTone === "brand" ? "text-[#66638c]" : "text-slate-500";
  const legendCls = titleTone === "brand" ? "text-[#66638c]" : "text-slate-600";
  const emptyBorder = titleTone === "brand" ? "border-[#d8d6ec] bg-[#faf9ff]/80" : "border-slate-200 bg-slate-50/50";
  const emptyTextCls = titleTone === "brand" ? "text-[#66638c]" : "text-slate-600";

  const hChart = compact ? "h-24" : "h-36";
  const titleSz = compact ? "text-xs" : "text-sm";
  const subSz = compact ? "text-[10px]" : "text-xs";
  const legendMt = compact ? "mt-1" : "mt-2";
  const legendMinH = compact ? "min-h-[1.5rem]" : "min-h-[2.25rem]";
  const legendText = compact ? "gap-x-2 gap-y-0.5 text-[9px]" : "gap-x-3 gap-y-1 text-[10px]";
  const dotSz = compact ? "h-1.5 w-1.5" : "h-2 w-2";
  const scrollMt = compact ? "mt-2" : "mt-3";
  const scrollGap = compact ? "gap-px" : "gap-1.5";
  const scrollPad = compact ? "px-0 pb-0.5 pt-0" : "pb-2 pl-0.5 pr-1 pt-1";
  const colW = compact ? "w-[1.55rem] sm:w-[2.05rem]" : "w-[2.75rem] sm:w-[3.5rem]";
  const pairGap = compact ? "gap-0 px-0 pt-0" : "gap-0.5 px-0.5";
  const barThin = compact ? "mx-auto max-w-[9px] sm:max-w-[10px]" : "";
  const rowGap = compact ? "gap-0.5" : "gap-1.5";
  const labelSz = compact ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]";
  const trackRound = compact ? "rounded-t-sm" : "rounded-t-lg";
  const barMinPct = compact ? 4 : 6;
  const emptyPy = compact ? "py-4 text-xs" : "py-6 text-sm";
  const emptyMt = compact ? "mt-2" : "mt-3";

  if (buckets.length === 0) {
    return (
      <div className={className}>
        {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
        {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
        <div className={cn(legendMt, legendMinH)} aria-hidden />
        <p
          className={cn(
            "rounded-xl border border-dashed text-center",
            emptyMt,
            emptyPy,
            emptyBorder,
            emptyTextCls,
          )}
        >
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title ? <h3 className={cn("font-semibold", titleSz, titleCls)}>{title}</h3> : null}
      {subtitle ? <p className={cn("mt-0.5", subSz, subCls)}>{subtitle}</p> : null}
      <div
        className={cn(
          "flex flex-wrap items-center",
          legendMt,
          legendMinH,
          legendText,
          legendCls,
        )}
      >
        <span className="inline-flex items-center gap-1">
          <span className={cn("shrink-0 rounded-sm bg-amber-500", dotSz)} aria-hidden />
          {seriesALabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className={cn("shrink-0 rounded-sm bg-emerald-500", dotSz)} aria-hidden />
          {seriesBLabel}
        </span>
      </div>
      <div
        className={cn(
          "flex max-w-full touch-pan-x overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          scrollMt,
          scrollGap,
          scrollPad,
          "[scrollbar-width:thin]",
        )}
        role="region"
        aria-label={title ?? "กราฟแท่งคู่รายช่วง"}
      >
        {buckets.map((b) => (
          <div
            key={b.key}
            className={cn("flex shrink-0 flex-col items-center", colW, rowGap)}
            title={
              formatGroupTitle ?
                formatGroupTitle(b)
              : `${b.label}: ${seriesALabel} ${b.seriesA.amount} · ${seriesBLabel} ${b.seriesB.amount}`
            }
          >
            <div
              className={cn(
                "flex w-full items-end justify-center",
                pairGap,
                hChart,
                trackRound,
                track,
              )}
            >
              <div className="flex h-full min-w-0 flex-1 flex-col items-stretch justify-end">
                <div
                  className={cn("w-full rounded-t-sm transition-all", barThin, barA)}
                  style={{ height: `${Math.max(barMinPct, b.seriesA.pct)}%` }}
                />
              </div>
              <div className="flex h-full min-w-0 flex-1 flex-col items-stretch justify-end">
                <div
                  className={cn("w-full rounded-t-sm transition-all", barThin, barB)}
                  style={{ height: `${Math.max(barMinPct, b.seriesB.pct)}%` }}
                />
              </div>
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
