"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { laundryRowIconButtonClass } from "@/systems/laundry/lib/ui-tokens";

/** ปุ่มไอคอนมุมรายการ — พิมพ์ / ดู / แก้ไข / ลบ (เล็กกว่าปุ่มแถบหัว) */
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
        laundryRowIconButtonClass,
        variant === "danger" && "border-rose-200/90 text-rose-600 hover:bg-rose-50",
      )}
    >
      <span className="sr-only">{label}</span>
      <span className="flex h-3.5 w-3.5 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5">
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
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}
