"use client";

import { AppImageThumb } from "./AppImageThumb";
import { cn } from "@/lib/cn";

export type AppLabeledImageThumbKind = "slip" | "product" | "photo";

const KIND_LABEL: Record<AppLabeledImageThumbKind, string> = {
  slip: "สลิป",
  product: "สินค้า",
  photo: "รูป",
};

const KIND_BADGE_CLASS: Record<AppLabeledImageThumbKind, string> = {
  slip: "bg-emerald-600/95 text-white",
  product: "bg-[#4d47b6]/95 text-white",
  photo: "bg-slate-700/90 text-white",
};

export type AppLabeledImageThumbProps = {
  src: string;
  kind: AppLabeledImageThumbKind;
  alt: string;
  onOpen: () => void;
  className?: string;
  /** ค่าเริ่ม cover — สลิปแนะนำ contain */
  objectFit?: "cover" | "contain";
};

/**
 * รูปย่อพร้อมป้ายมุมล่าง («สลิป» / «สินค้า» / «รูป») — แบบร้านออนไลน์
 * ป้ายอยู่บนรูป ไม่กินพื้นที่ข้างชื่อ
 */
export function AppLabeledImageThumb({
  src,
  kind,
  alt,
  onOpen,
  className,
  objectFit = kind === "slip" ? "contain" : "cover",
}: AppLabeledImageThumbProps) {
  const label = KIND_LABEL[kind];
  return (
    <div className="relative shrink-0">
      <AppImageThumb
        src={src}
        alt={`${label} · ${alt}`}
        onOpen={onOpen}
        objectFit={objectFit}
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
