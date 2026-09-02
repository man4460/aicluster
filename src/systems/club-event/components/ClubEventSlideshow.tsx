"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
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
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, slides.length]);

  if (!open || slides.length === 0) return null;

  const current = slides[index];

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-black text-white" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title ?? "Presentation"}</p>
          <p className="text-xs text-white/60">
            {index + 1} / {slides.length}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10"
            aria-label={playing ? "หยุดชั่วคราว" : "เล่นต่อ"}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10"
            aria-label="ปิดสไลด์โชว์"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        <img
          key={current.id}
          src={current.imageUrl}
          alt={current.fileName ?? "ภาพกิจกรรม"}
          className="max-h-full max-w-full object-contain transition-opacity duration-500"
        />
        <button
          type="button"
          className="absolute left-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40"
          aria-label="ภาพก่อนหน้า"
          onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          className="absolute right-3 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40"
          aria-label="ภาพถัดไป"
          onClick={() => setIndex((i) => (i + 1) % slides.length)}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto px-4 pb-4">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={cn(
              "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
              i === index ? "border-white" : "border-transparent opacity-60",
            )}
            aria-label={`ไปภาพที่ ${i + 1}`}
            onClick={() => setIndex(i)}
          >
            <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
