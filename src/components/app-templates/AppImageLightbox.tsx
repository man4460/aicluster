"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!src || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center overflow-hidden bg-slate-950/85 p-[max(12px,env(safe-area-inset-top),env(safe-area-inset-bottom),env(safe-area-inset-left),env(safe-area-inset-right))] sm:p-5"
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
        className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-auto w-auto max-h-[calc(100dvh-1.5rem)] max-w-[calc(100dvw-1.5rem)] rounded-xl object-contain shadow-2xl ring-1 ring-white/20 sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-[calc(100dvw-2.5rem)]"
        />
      </div>
    </div>
    ,
    document.body,
  );
}
