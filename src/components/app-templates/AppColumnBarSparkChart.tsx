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
      <div className="mt-4 flex max-w-full gap-1.5 overflow-x-auto pb-2 pt-1 [-webkit-overflow-scrolling:touch]">
        {buckets.map((b) => (
          <div
            key={b.key}
            className="flex w-10 shrink-0 flex-col items-center gap-1.5 sm:w-12"
            title={formatTitle ? formatTitle(b) : `${b.label}: ${b.amount}`}
          >
            <div className={cn("flex h-36 w-full items-end justify-center rounded-t-lg px-0.5 pt-1", track)}>
              <div
                className={cn("w-full max-w-[28px] rounded-t-md transition-all", bar)}
                style={{ height: `${Math.max(8, b.pct)}%` }}
              />
            </div>
            <span className="max-w-[3rem] truncate text-center text-[9px] font-medium leading-tight text-[#66638c] sm:text-[10px]">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
