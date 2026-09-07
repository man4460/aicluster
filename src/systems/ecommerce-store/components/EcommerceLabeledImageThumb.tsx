"use client";

import {
  AppLabeledImageThumb,
  type AppLabeledImageThumbKind,
} from "@/components/app-templates";

export type EcommerceImageThumbKind = Extract<AppLabeledImageThumbKind, "slip" | "product">;

/**
 * @deprecated ใช้ `AppLabeledImageThumb` จาก `@/components/app-templates` โดยตรง
 * คง wrapper นี้เพื่อไม่พัง import เดิมในโมดูลร้านออนไลน์
 */
export function EcommerceLabeledImageThumb({
  src,
  kind,
  alt,
  onOpen,
  className,
}: {
  src: string;
  kind: EcommerceImageThumbKind;
  alt: string;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <AppLabeledImageThumb
      src={src}
      kind={kind}
      alt={alt}
      onOpen={onOpen}
      className={className}
      objectFit={kind === "slip" ? "contain" : "cover"}
    />
  );
}
