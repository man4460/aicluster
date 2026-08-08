"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AppImageLightboxProps = {
  src: string | null;
  /** ชุดรูปสำหรับเลื่อนดู — ถ้ามี จะใช้แทน src เดี่ยว + ปุ่มก่อน/ถัดไป + ปัดนิ้ว */
  sources?: string[] | null;
  /** ดัชนีเริ่มต้นเมื่อเปิดด้วย sources */
  initialIndex?: number;
  alt?: string;
  onClose: () => void;
};

/**
 * Template กลาง — ดูรูปเต็มจอ (พื้นหลังมืด, ปิด / พื้นที่นอกรูป / Esc)
 * รองรับเลื่อนหลายรูป (ลูกศร · ปุ่ม · ปัดซ้าย–ขวา)
 * ใช้ร่วมกับ AppImageThumb + useAppImageLightbox ในทุกโมดูล
 */
export function AppImageLightbox({
  src,
  sources = null,
  initialIndex = 0,
  alt = "ภาพ",
  onClose,
}: AppImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const gallery = (sources?.length ? sources : src ? [src] : [])
    .map((u) => u.trim())
    .filter(Boolean);
  const open = gallery.length > 0;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const start = Math.max(0, Math.min(initialIndex, gallery.length - 1));
    setIndex(start);
  }, [open, initialIndex, gallery.length, src, sources]);

  const goPrev = useCallback(() => {
    setIndex((i) => (gallery.length <= 1 ? i : (i - 1 + gallery.length) % gallery.length));
  }, [gallery.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (gallery.length <= 1 ? i : (i + 1) % gallery.length));
  }, [gallery.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, goPrev, goNext]);

  if (!open || !mounted) return null;

  const current = gallery[Math.max(0, Math.min(index, gallery.length - 1))] ?? null;
  if (!current) return null;
  const multi = gallery.length > 1;

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
        className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-10 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-lg hover:bg-white sm:right-5 sm:top-5"
      >
        ปิด
      </button>

      {multi ? (
        <p className="absolute left-1/2 top-[max(12px,env(safe-area-inset-top))] z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white sm:top-5">
          {index + 1} / {gallery.length}
        </p>
      ) : null}

      {multi ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-[max(8px,env(safe-area-inset-left))] top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg hover:bg-white sm:left-5"
            aria-label="รูปก่อนหน้า"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-[max(8px,env(safe-area-inset-right))] top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg hover:bg-white sm:right-5"
            aria-label="รูปถัดไป"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      ) : null}

      <div
        className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null || !multi) return;
          const end = e.changedTouches[0]?.clientX ?? start;
          const dx = end - start;
          if (Math.abs(dx) < 48) return;
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current}
          src={current}
          alt={multi ? `${alt} (${index + 1}/${gallery.length})` : alt}
          className="h-auto w-auto max-h-[calc(100dvh-1.5rem)] max-w-[calc(100dvw-1.5rem)] rounded-xl object-contain shadow-2xl ring-1 ring-white/20 sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-[calc(100dvw-2.5rem)]"
          draggable={false}
        />
      </div>
    </div>,
    document.body,
  );
}
