"use client";

import { cn } from "@/lib/cn";

export type AppWindowPrintButtonProps = {
  label?: string;
  className?: string;
};

/** พิมพ์หน้าปัจจุบัน (window.print) — สไตล์เดียวกับปุ่มพิมพ์ MAWELL */
export function AppWindowPrintButton({ label = "พิมพ์", className }: AppWindowPrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        "rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0000a6] touch-manipulation",
        className,
      )}
    >
      {label}
    </button>
  );
}
