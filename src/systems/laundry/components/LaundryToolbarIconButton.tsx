"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** ปุ่มไอคอนมุมรายการ — ดู / แก้ไข / ลบ (โมดูลซักผ้า) */
export function LaundryToolbarIconButton({
  label,
  onClick,
  variant = "neutral",
  disabled,
  children,
}: {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "neutral" | "danger";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => void onClick()}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[0] transition-colors disabled:opacity-40 sm:h-9 sm:w-9 sm:rounded-xl",
        variant === "danger" ?
          "border-rose-200/90 bg-white text-rose-600 hover:bg-rose-50"
        : "border-[#e8e6f4] bg-white text-[#4d47b6] hover:bg-[#f4f3ff]",
      )}
    >
      <span className="sr-only">{label}</span>
      <span className="flex h-5 w-5 items-center justify-center max-sm:h-4 max-sm:w-4 [&>svg]:h-[18px] [&>svg]:w-[18px] max-sm:[&>svg]:h-[14px] max-sm:[&>svg]:w-[14px]">
        {children}
      </span>
    </button>
  );
}

export function LaundryIconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function LaundryIconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LaundryIconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M3 6h18M8 6V4h8v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LaundryIconPrint() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
