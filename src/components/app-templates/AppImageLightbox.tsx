"use client";

import { useEffect } from "react";

export type AppImageLightboxProps = {
  src: string | null;
  alt?: string;
  onClose: () => void;
};

/**
 * Template กลาง — ดูรูปเต็มจอ (พื้นหลังมืด, ปิด / พื้นที่นอกรูป / Esc)
 * ใช้ร่วมกับ AppImageThumb + useAppImageLightbox ในทุกโมดูล
 */
export function AppImageLightbox({ src, alt = "ภาพ", onClose }: AppImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 px-[max(12px,env(safe-area-inset-left))] pb-[max(12px,env(safe-area-inset-bottom))] pr-[max(12px,env(safe-area-inset-right))] pt-14 sm:px-5 sm:pb-5 sm:pt-16"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-lg hover:bg-white sm:right-5 sm:top-5"
      >
        ปิด
      </button>
      <div
        className="flex min-h-0 min-w-0 max-h-full max-w-full items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-auto w-auto max-h-[min(85dvh,calc(100dvh-7rem))] max-w-[min(92dvw,calc(100dvw-1.5rem))] rounded-xl object-contain shadow-2xl ring-1 ring-white/20"
        />
      </div>
    </div>
  );
}
