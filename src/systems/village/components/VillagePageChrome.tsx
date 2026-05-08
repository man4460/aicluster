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
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/58 via-white/42 to-indigo-50/28 p-4",
        "shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/55 sm:p-5",
        className,
      )}
    >
      {hasHead ? (
        <div className="mb-4 flex flex-col gap-3 border-b border-white/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-black tracking-tight text-[#1e1b4b]">{title}</h2> : null}
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
      ? "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl"
      : tone === "red"
        ? "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)] backdrop-blur-xl"
        : tone === "amber"
          ? "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)] backdrop-blur-xl"
          : tone === "slate"
            ? "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)] backdrop-blur-xl"
            : "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-700 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl";
  return (
    <div className={cn("rounded-[2rem] border p-4 ring-1 ring-inset ring-white/55 sm:p-5", toneClass)}>
      <p className="text-xs font-medium text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">{value}</p>
    </div>
  );
}

/** พื้นที่ว่างแบบเส้นประ (แบบลานล้างว่าง) */
export function VillageEmptyDashed({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-white/70 bg-white/45 px-4 py-10 text-center text-sm leading-relaxed text-[#66638c] backdrop-blur-sm">
      {children}
    </div>
  );
}
