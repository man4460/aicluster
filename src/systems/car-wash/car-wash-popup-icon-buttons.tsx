"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const popupIconBtnBase =
  "inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40";

export const popupIconBtnDanger =
  "border-red-200/90 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-900 disabled:opacity-40";

export const salesRowOpenDetailBtnClass =
  "inline-flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center rounded-lg border border-[#4d47b6]/30 bg-[#f5f3ff] text-[#4d47b6] shadow-sm hover:bg-[#ebe8ff] hover:border-[#4d47b6]/45 disabled:cursor-not-allowed disabled:opacity-45 [&>svg]:h-[17px] [&>svg]:w-[17px]";

function PopupIco({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
      {children}
    </span>
  );
}

export function PopupIconButton({
  label,
  busy,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; busy?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={busy ? `${label} (กำลังดำเนินการ)` : label}
      aria-busy={busy || undefined}
      className={cn(popupIconBtnBase, className)}
      {...rest}
    >
      {busy ?
        <span
          className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"
          aria-hidden
        />
      : <PopupIco>{children}</PopupIco>}
    </button>
  );
}

/** ปุ่มไอคอนเล็กเปิด popup รายละเอียด (รายการยอดขาย / การ์ดที่กรอง) */
export function SalesRowOpenDetailButton({
  label = "แสดงรายละเอียด",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(salesRowOpenDetailBtnClass, className)}
      {...rest}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    </button>
  );
}
