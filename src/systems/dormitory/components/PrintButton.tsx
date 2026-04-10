"use client";

import { dormBtnPrimary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";

export function PrintButton({ label = "พิมพ์ใบเสร็จ" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={cn(dormBtnPrimary, "w-full justify-center sm:w-auto")}>
      {label}
    </button>
  );
}
