"use client";

import { cn } from "@/lib/cn";

export type AppImageThumbProps = {
  src: string | null | undefined;
  alt?: string;
  emptyLabel?: string;
  onOpen?: () => void;
  className?: string;
};

/**
 * Template กลาง — รูปย่อ 64×64 คลิกแล้วให้ parent เปิด AppImageLightbox (ผ่าน onOpen)
 */
export function AppImageThumb({
  src,
  alt = "",
  emptyLabel = "ไม่มีรูป",
  onOpen,
  className,
}: AppImageThumbProps) {
  if (src) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.()}
        className={cn(
          "relative flex h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ring-slate-100 transition hover:ring-[#0000BF]/30",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full min-h-0 min-w-0 object-cover object-center"
        />
      </button>
    );
  }
  return (
    <div
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-center text-[10px] leading-tight text-slate-400 ring-2 ring-slate-100",
        className,
      )}
    >
      {emptyLabel}
    </div>
  );
}
