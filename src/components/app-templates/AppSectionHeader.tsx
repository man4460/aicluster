"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AppSectionHeaderProps = {
  title: string;
  /** ใส่ `id` ที่ `<h2>` เพื่อผูก `aria-labelledby` / `aria-describedby` กับฟอร์มหรือโมดัล */
  titleId?: string;
  description?: ReactNode;
  action?: ReactNode;
  /** คลาสห่อ `action` (ค่าเริ่มต้น shrink-0) — ใช้ flex-1 เมื่อต้องการให้แถวปุ่มกินความกว้างที่เหลือ */
  actionWrapClassName?: string;
  /** โทนหัวข้อ — violet ใช้กับ POS / แบรนด์ม่วง */
  tone?: "slate" | "violet";
  className?: string;
};

/** หัวข้อแผงแดชบอร์ด + คำอธิบาย + ปุ่มด้านขวา */
export function AppSectionHeader({
  title,
  titleId,
  description,
  action,
  actionWrapClassName,
  tone = "slate",
  className,
}: AppSectionHeaderProps) {
  const titleClass =
    tone === "violet" ? "text-lg font-bold text-[#2e2a58]" : "text-sm font-semibold text-slate-900";
  const descClass = tone === "violet" ? "mt-1 text-xs text-[#66638c]" : "mt-0.5 text-xs text-slate-500";

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 id={titleId} className={titleClass}>
          {title}
        </h2>
        {description ? <div className={descClass}>{description}</div> : null}
      </div>
      {action ? (
        <div className={cn(actionWrapClassName ?? "shrink-0")}>{action}</div>
      ) : null}
    </div>
  );
}
