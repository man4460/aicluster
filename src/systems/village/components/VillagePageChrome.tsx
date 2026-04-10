"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** คอลัมน์หลักของหน้า — ระยะห่างเดียวกับ CarWashDashboard */
export function VillagePageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-full space-y-4 sm:space-y-6", className)}>{children}</div>;
}

/** การ์ดเนื้อหาหลัก (แบบแผง «ลานล้างวันนี้») */
export function VillagePanelCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasHead = Boolean(title || description || action);
  return (
    <div className={cn("app-surface p-4 sm:p-5", className)}>
      {hasHead ? (
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold tracking-tight text-[#2e2a58]">{title}</h2> : null}
            {description ? <div className="mt-0.5 text-xs leading-relaxed text-[#66638c]">{description}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** สถิติแบบการ์ดย่อยสี่เหลี่ยม (โทนเดียวกับ CarWashStat) */
export function VillageStatTile({
  title,
  value,
  tone = "blue",
}: {
  title: string;
  value: string;
  tone?: "blue" | "green" | "red" | "slate" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
        ? "border-red-200 bg-red-50"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50"
          : tone === "slate"
            ? "border-slate-200 bg-slate-50"
            : "border-[#0000BF]/20 bg-[#0000BF]/[0.03]";
  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5", toneClass)}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">{value}</p>
    </div>
  );
}

/** พื้นที่ว่างแบบเส้นประ (แบบลานล้างว่าง) */
export function VillageEmptyDashed({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c]">
      {children}
    </div>
  );
}
