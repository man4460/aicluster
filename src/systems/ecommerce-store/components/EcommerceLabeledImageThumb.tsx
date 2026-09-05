"use client";

import { AppImageThumb } from "@/components/app-templates";
import { cn } from "@/lib/cn";

export type EcommerceImageThumbKind = "slip" | "product";

const KIND_LABEL: Record<EcommerceImageThumbKind, string> = {
  slip: "สลิป",
  product: "สินค้า",
};

const KIND_BADGE_CLASS: Record<EcommerceImageThumbKind, string> = {
  slip: "bg-emerald-600/95 text-white",
  product: "bg-[#4d47b6]/95 text-white",
};

/**
 * รูปย่อพร้อมป้าย «สลิป» / «สินค้า» — กันงงว่ารูปไหนคือหลักฐานโอนหรือรูปสินค้า
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
  const label = KIND_LABEL[kind];
  return (
    <div className="relative shrink-0">
      <AppImageThumb
        src={src}
        alt={`${label} · ${alt}`}
        onOpen={onOpen}
        className={cn("h-14 w-14 rounded-lg sm:h-16 sm:w-16", className)}
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg px-0.5 py-0.5 text-center text-[9px] font-black leading-none tracking-wide",
          KIND_BADGE_CLASS[kind],
        )}
        aria-hidden
      >
        {label}
      </span>
    </div>
  );
}
