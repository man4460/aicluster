"use client";

import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "@/components/app-templates/dashboard-tokens";
import {
  APP_SLIP_PAPER_SIZE_OPTIONS,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";

export type AppSlipPaperSizeToolbarProps = {
  value: AppSlipPaperSize;
  onChange: (next: AppSlipPaperSize) => void;
  /** จำกัดตัวเลือก — ค่าเริ่มแสดง 58 + 80 */
  sizes?: AppSlipPaperSize[];
  className?: string;
  disabled?: boolean;
  /** aria-label ของกลุ่ม */
  "aria-label"?: string;
};

/**
 * แถบเลือกขนาดกระดาษสลิป/ใบเสร็จ — ใช้คู่กับ `printAppReceiptSlip`
 * ค่าเริ่มควรมากจาก `useAppSlipPaperSize` / โปรไฟล์ ไม่ hardcode
 */
export function AppSlipPaperSizeToolbar({
  value,
  onChange,
  sizes = ["SLIP_58", "SLIP_80"],
  className,
  disabled,
  "aria-label": ariaLabel = "ขนาดกระดาษพิมพ์",
}: AppSlipPaperSizeToolbarProps) {
  const options = APP_SLIP_PAPER_SIZE_OPTIONS.filter((o) => sizes.includes(o.value));
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              appTemplateOutlineButtonClass,
              "min-h-[40px] rounded-xl px-3 py-2 text-xs font-black",
              active && "border-[#0000BF]/45 bg-[#0000BF]/10 text-[#0000bf] ring-1 ring-[#0000BF]/25",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
