"use client";

import { cn } from "@/lib/cn";
import { SmartPoliceMobileDock } from "@/systems/smart-police/components/SmartPoliceMobileDock";

/**
 * Chrome Smart Police — ไม่มีหัวโมดูลซ้ำ (เมนูอยู่ sidebar ซ้าย / dock มือถือ)
 * เนื้อหาขวา: ยืดเต็มความกว้าง·สูงที่เหลือจาก shell
 */
export function SmartPoliceShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col",
        /** dock มือถือเท่านั้น — เดสก์ท็อป (md+) มี sidebar แล้ว ห้ามเหลือ pb-24 ว่างล่าง */
        "max-md:pb-24 md:pb-0",
      )}
    >
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>
      <SmartPoliceMobileDock />
    </div>
  );
}
