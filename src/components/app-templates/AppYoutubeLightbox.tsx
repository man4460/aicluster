"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { extractYoutubeVideoId, youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/youtube-url";

export type AppYoutubeLightboxProps = {
  /** watch / embed / youtu.be / video id */
  youtubeUrl: string | null;
  title?: string;
  onClose: () => void;
};

/**
 * Template กลาง — เล่น YouTube ในป๊อปอัป (พื้นมืด · Esc · ปิด · เต็มจอเบราว์เซอร์)
 * iframe มี allowFullScreen ให้ใช้ปุ่มเต็มจอของ YouTube ได้ด้วย
 */
export function AppYoutubeLightbox({
  youtubeUrl,
  title = "วิดีโอ YouTube",
  onClose,
}: AppYoutubeLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoId = youtubeUrl?.trim() ? extractYoutubeVideoId(youtubeUrl.trim()) : null;
  const open = Boolean(videoId);
  const embed = videoId ? youtubeEmbedUrl(videoId, true) : null;
  const watch = videoId ? youtubeWatchUrl(videoId) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  const enterFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
      else if (anyEl.msRequestFullscreen) await anyEl.msRequestFullscreen();
    } catch {
      /* ignore — ใช้ปุ่มเต็มจอใน YouTube แทน */
    }
    void doc;
  }, []);

  if (!open || !mounted || !embed) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center overflow-hidden bg-slate-950/85 p-[max(12px,env(safe-area-inset-top),env(safe-area-inset-bottom),env(safe-area-inset-left),env(safe-area-inset-right))] sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#1e1b4b] px-3 py-2">
          <p className="min-w-0 truncate text-sm font-bold text-white">{title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
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
            {watch ? (
              <a
                href={watch}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-lg bg-white/10 px-2.5 text-xs font-bold text-white hover:bg-white/20"
              >
                YouTube
              </a>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label="ปิดวิดีโอ"
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div ref={stageRef} className="aspect-video w-full bg-black">
          <iframe
            title={title}
            src={embed}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
