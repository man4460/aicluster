"use client";

import { cn } from "@/lib/cn";
import { laundryRefreshIconButtonClass } from "@/systems/laundry/lib/ui-tokens";

export function LaundryIconRefresh({ className, spinning }: { className?: string; spinning?: boolean }) {
  return (
    <svg
      className={cn(className, spinning && "animate-spin")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

type LaundryRefreshButtonProps = {
  refreshing?: boolean;
  onClick: () => void | Promise<void>;
  /** ค่าเริ่ม: รีเฟรชข้อมูล */
  ariaLabel?: string;
  /** @deprecated ไม่แสดงข้อความแล้ว — คงไว้เพื่อไม่พัง caller เก่า */
  label?: string;
  /** header / inline ใช้ขนาดเดียวกัน (ไอคอนล้วน) */
  variant?: "header" | "inline";
  className?: string;
  title?: string;
};

/** ปุ่มรีเฟรชมาตรฐานโมดูลซักผ้า — ไอคอนล้วน · ขนาด/มนเท่าปุ่ม compact ของโมดูล */
export function LaundryRefreshButton({
  refreshing = false,
  onClick,
  ariaLabel = "รีเฟรชข้อมูล",
  variant: _variant = "header",
  className,
  title = "รีเฟรช",
}: LaundryRefreshButtonProps) {
  void _variant;
  const resolvedAriaLabel = refreshing ? `กำลัง${ariaLabel}` : ariaLabel;

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={refreshing}
      aria-busy={refreshing}
      aria-label={resolvedAriaLabel}
      title={title}
      className={cn(laundryRefreshIconButtonClass, className)}
    >
      <LaundryIconRefresh className="h-4 w-4 shrink-0" spinning={refreshing} />
    </button>
  );
}
