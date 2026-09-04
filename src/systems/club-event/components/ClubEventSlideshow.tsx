"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Slide = { id: string; imageUrl: string; fileName?: string };

type Props = {
  slides: Slide[];
  open: boolean;
  onClose: () => void;
  title?: string;
  intervalMs?: number;
};

export function ClubEventSlideshow({ slides, open, onClose, title, intervalMs = 5000 }: Props) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setPlaying(true);
  }, [open, slides]);

  useEffect(() => {
    if (!open || !playing || slides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [open, playing, slides.length, intervalMs]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % Math.max(slides.length, 1));
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % Math.max(slides.length, 1));
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, slides.length]);

  const enterFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
      else if (anyEl.msRequestFullscreen) await anyEl.msRequestFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  if (!open || slides.length === 0 || !mounted) return null;

  const current = slides[index] ?? slides[0];
  if (!current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center overflow-hidden bg-slate-950/85 p-[max(12px,env(safe-area-inset-top),env(safe-area-inset-bottom),env(safe-area-inset-left),env(safe-area-inset-right))] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "สไลด์โชว์"}
      onClick={onClose}
    >
      <div
        ref={stageRef}
        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-black text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#1e1b4b] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{title ?? "สไลด์โชว์"}</p>
            <p className="text-[11px] font-semibold text-white/70">
              {index + 1} / {slides.length}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label={playing ? "หยุดชั่วคราว" : "เล่นต่อ"}
              title={playing ? "หยุดชั่วคราว" : "เล่นต่อ"}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-xs font-bold text-white hover:bg-white/20"
              aria-label="ดูเต็มจอ"
              title="ดูเต็มจอ"
              onClick={() => void enterFullscreen()}
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">เต็มจอ</span>
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label="ปิดสไลด์โชว์"
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black p-3 sm:p-4" style={{ minHeight: "min(70vh, 520px)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.id}
            src={current.imageUrl}
            alt={current.fileName ?? "ภาพกิจกรรม"}
            className="max-h-[min(70vh,520px)] max-w-full object-contain transition-opacity duration-500"
          />
          {slides.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 sm:left-3 sm:min-h-11 sm:min-w-11"
                aria-label="ภาพก่อนหน้า"
                onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 sm:right-3 sm:min-h-11 sm:min-w-11"
                aria-label="ภาพถัดไป"
                onClick={() => setIndex((i) => (i + 1) % slides.length)}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </button>
            </>
          ) : null}
        </div>

        {slides.length > 1 ? (
          <div className="flex gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  "h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 sm:h-14 sm:w-14",
                  i === index ? "border-white" : "border-transparent opacity-60",
                )}
                aria-label={`ไปภาพที่ ${i + 1}`}
                onClick={() => setIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
