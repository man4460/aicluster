"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { appTemplatePickGalleryImageButtonClass, appTemplateTakePhotoButtonClass } from "./dashboard-tokens";

export type AppPickGalleryImageButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
  children?: ReactNode;
};

/** ปุ่มเลือกรูป — สไตล์เดียวกับสลิป POS (`appTemplatePickGalleryImageButtonClass`) */
export function AppPickGalleryImageButton({
  className,
  children = "เลือกรูป",
  type = "button",
  ...props
}: AppPickGalleryImageButtonProps) {
  return (
    <button type={type} className={cn(appTemplatePickGalleryImageButtonClass, className)} {...props}>
      {children}
    </button>
  );
}

export type AppTakePhotoButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  className?: string;
  children?: ReactNode;
};

/** ปุ่มถ่ายรูป / เปิดกล้อง — สไตล์เดียวกับสลิป POS (`appTemplateTakePhotoButtonClass`) */
export function AppTakePhotoButton({
  className,
  children = "ถ่ายรูป",
  type = "button",
  ...props
}: AppTakePhotoButtonProps) {
  return (
    <button type={type} className={cn(appTemplateTakePhotoButtonClass, className)} {...props}>
      {children}
    </button>
  );
}
