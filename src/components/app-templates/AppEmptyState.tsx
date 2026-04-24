"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AppEmptyStateProps = {
  children: ReactNode;
  className?: string;
  /** violet = กล่องเส้นประแบบ POS · glass = พื้นมืดโปร่ง */
  tone?: "slate" | "violet" | "glass";
};

/** ว่าง — กล่องเส้นประ (รายการ / กราฟไม่มีข้อมูล) */
export function AppEmptyState({ children, className, tone = "slate" }: AppEmptyStateProps) {
  return (
    <p
      className={cn(
        "rounded-xl border border-dashed py-6 text-center text-sm sm:py-10",
        tone === "glass"
          ? "border-white/15 bg-white/[0.04] text-slate-400"
          : tone === "violet"
            ? "border-[#d8d6ec] bg-[#faf9ff] text-[#66638c]"
            : "border-slate-200 bg-slate-50/40 text-slate-500",
        className,
      )}
    >
      {children}
    </p>
  );
}
