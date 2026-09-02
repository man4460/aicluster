"use client";

import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { laundryInlineSubNavBtnClass } from "@/systems/laundry/lib/ui-tokens";

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
  /** ข้อความบน sm+ — ค่าเริ่ม: รีเฟรช */
  label?: string;
  /** header = มุมการ์ด/แถบหัว · inline = แถบย่อยในการ์ด */
  variant?: "header" | "inline";
  className?: string;
  title?: string;
};

/** ปุ่มรีเฟรชมาตรฐานโมดูลซักผ้า — มือถือไอคอน · sm+ ไอคอน+ข้อความ */
export function LaundryRefreshButton({
  refreshing = false,
  onClick,
  ariaLabel = "รีเฟรชข้อมูล",
  label = "รีเฟรช",
  variant = "header",
  className,
  title = "รีเฟรช",
}: LaundryRefreshButtonProps) {
  const resolvedAriaLabel = refreshing ? `กำลัง${ariaLabel}` : ariaLabel;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={refreshing}
        aria-busy={refreshing}
        aria-label={resolvedAriaLabel}
        title={title}
        className={cn(laundryInlineSubNavBtnClass(false), "disabled:opacity-50", className)}
      >
        <LaundryIconRefresh className="h-3.5 w-3.5 shrink-0" spinning={refreshing} />
        <span className="hidden sm:inline">{refreshing ? "กำลังรีเฟรช…" : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={refreshing}
      aria-busy={refreshing}
      aria-label={resolvedAriaLabel}
      title={title}
      className={cn(
        appTemplateOutlineButtonClass,
        "inline-flex min-h-[40px] min-w-[40px] items-center justify-center px-0 text-[#4d47b6] disabled:opacity-60 sm:min-w-0 sm:px-3",
        className,
      )}
    >
      <LaundryIconRefresh className="h-5 w-5 shrink-0 sm:mr-1.5" spinning={refreshing} />
      <span className="hidden text-sm font-semibold sm:inline">
        {refreshing ? "กำลังรีเฟรช…" : label}
      </span>
    </button>
  );
}
