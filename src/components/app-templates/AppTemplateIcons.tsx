"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** ความหนาเส้น SVG มาตรฐาน — ปรับได้ต่อไอคอน */
export const APP_TEMPLATE_ICON_STROKE = "1.75";

export type AppTemplateIconProps = {
  className?: string;
  strokeWidth?: string | number;
};

function stroke(w: string | number | undefined) {
  return w ?? APP_TEMPLATE_ICON_STROKE;
}

export function AppIconUpload({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppIconImage({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppIconPencil({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppIconPower({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path d="M12 2v10" strokeLinecap="round" />
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppIconTrash({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}

export function AppIconCheck({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppIconUserX({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 4l-5 5M17 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppIconClose({ className, strokeWidth: sw }: AppTemplateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke(sw)}
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type AppIconToolbarButtonProps = {
  title: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

/** ปุ่มไอคอนแถบเครื่องมือ (แดชบอร์ด / รายการ) — ขนาดคงที่ 32px */
export function AppIconToolbarButton({
  title,
  ariaLabel,
  onClick,
  disabled,
  className,
  children,
}: AppIconToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6b6799] transition-colors",
        "hover:bg-white hover:text-[#4d47b6] disabled:pointer-events-none disabled:opacity-35",
        className,
      )}
    >
      {children}
    </button>
  );
}
