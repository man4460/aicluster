"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { appDashboardSectionSlateClass, appDashboardSectionVioletClass } from "./dashboard-tokens";

export type AppDashboardSectionProps = {
  children: ReactNode;
  tone?: "slate" | "violet";
  className?: string;
  as?: "section" | "div";
};

/** การ์ดหลักแดชบอร์ด (ขอบมน + padding) — โทนเดียวกับรายรับ–รายจ่าย / POS */
export function AppDashboardSection({
  children,
  tone = "slate",
  className,
  as: Tag = "section",
}: AppDashboardSectionProps) {
  return (
    <Tag className={cn(tone === "violet" ? appDashboardSectionVioletClass : appDashboardSectionSlateClass, className)}>
      {children}
    </Tag>
  );
}
