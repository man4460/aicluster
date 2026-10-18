"use client";

import { cn } from "@/lib/cn";
import { SmartPoliceMobileDock } from "@/systems/smart-police/components/SmartPoliceMobileDock";

/**
 * Chrome Smart Police — ไม่มีหัวโมดูลซ้ำ (เมนูอยู่ sidebar ซ้าย / dock มือถือ)
 */
export function SmartPoliceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col", "max-lg:pb-24 lg:pb-0")}>
      {children}
      <SmartPoliceMobileDock />
    </div>
  );
}
