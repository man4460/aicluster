"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AppSectionHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** โทนหัวข้อ — violet ใช้กับ POS / แบรนด์ม่วง */
  tone?: "slate" | "violet";
  className?: string;
};

/** หัวข้อแผงแดชบอร์ด + คำอธิบาย + ปุ่มด้านขวา */
export function AppSectionHeader({
  title,
  description,
  action,
  tone = "slate",
  className,
}: AppSectionHeaderProps) {
  const titleClass =
    tone === "violet" ? "text-lg font-bold text-[#2e2a58]" : "text-sm font-semibold text-slate-900";
  const descClass = tone === "violet" ? "mt-1 text-xs text-[#66638c]" : "mt-0.5 text-xs text-slate-500";

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 className={titleClass}>{title}</h2>
        {description ? <div className={descClass}>{description}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
