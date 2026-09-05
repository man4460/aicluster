"use client";

import { useState } from "react";
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
  const [failed, setFailed] = useState(false);
  const s = typeof src === "string" ? src.trim() : "";
  const show = Boolean(s) && !failed;

  if (show) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.()}
        className={cn(
          "relative flex h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-slate-100 transition hover:ring-[#0000BF]/30",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s}
          alt={alt}
          className="h-full w-full min-h-0 min-w-0 object-cover object-center"
          onError={() => setFailed(true)}
        />
      </button>
    );
  }
  return (
    <div
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-center text-[10px] leading-tight text-slate-400 ring-2 ring-slate-100",
        className,
      )}
    >
      {emptyLabel}
    </div>
  );
}
