"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { appSparkChartPanelClass, appSparkChartsTwoColumnGridClass } from "./spark-chart-layout-tokens";

export type AppSparkChartPanelProps = {
  children: ReactNode;
  className?: string;
};

/** เปลือกการ์ดเดียวรอบกราฟ spark (ใช้คลาสเดียวกันทุกโมดูล) */
export function AppSparkChartPanel({ children, className }: AppSparkChartPanelProps) {
  return <div className={cn(appSparkChartPanelClass, className)}>{children}</div>;
}

export type AppSparkChartsTwoColumnGridProps = {
  children: ReactNode;
  className?: string;
};

/** แถวกราฟสองคอลัมน์ — จอใหญ่เคียงข้าง จอเล็กเรียงแนวตั้ง */
export function AppSparkChartsTwoColumnGrid({ children, className }: AppSparkChartsTwoColumnGridProps) {
  return <div className={cn(appSparkChartsTwoColumnGridClass, className)}>{children}</div>;
}
