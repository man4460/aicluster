"use client";

import { cn } from "@/lib/cn";
import { AppIconPrint } from "@/components/app-templates/AppTemplateIcons";

export type AppSlipPrintIconButtonProps = {
  onClick: () => void;
  /** ค่าเริ่มต้น: พิมพ์สลิป */
  "aria-label"?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  /** ขนาดไอคอน */
  iconClassName?: string;
};

/** ปุ่มไอคอนพิมพ์สลิป — ใช้บนการ์ดออเดอร์ / รายการแดชบอร์ด */
export function AppSlipPrintIconButton({
  onClick,
  "aria-label": ariaLabel = "พิมพ์สลิป",
  title = "พิมพ์สลิป",
  disabled,
  className,
  iconClassName,
}: AppSlipPrintIconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg border border-white/60 bg-white/90 text-[#4d47b6] shadow-sm transition",
        "hover:bg-white hover:text-[#0000bf] disabled:pointer-events-none disabled:opacity-45 sm:min-h-[40px] sm:min-w-[40px] sm:rounded-xl",
        className,
      )}
    >
      <AppIconPrint className={cn("h-4 w-4", iconClassName)} />
    </button>
  );
}
