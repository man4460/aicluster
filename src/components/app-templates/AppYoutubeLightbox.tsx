"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { extractYoutubeVideoId } from "@/lib/youtube-url";
import {
  appSafeAreaOverlayExpandedHeaderPadClass,
  appSafeAreaOverlayPadAllClass,
} from "@/components/app-templates/safe-area-tokens";
import { AppSecureYoutubePlayer } from "./AppSecureYoutubePlayer";

export type AppYoutubeLightboxProps = {
  /** watch / embed / youtu.be / video id */
  youtubeUrl: string | null;
  title?: string;
  onClose: () => void;
};

const headerIconClass =
  "inline-flex h-9 w-9 touch-manipulation items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition active:scale-95 active:opacity-80";

/**
 * Template กลาง — เล่น YouTube ในป๊อปอัปด้วย AppSecureYoutubePlayer (แบบ LMS)
 * ไม่ใช้ iframe ดิบ — กันมือถือเปิดแอป YouTube · ไม่มีลิงก์ watch · ไอคอนเต็มจอในตัวเครื่องเล่น
 */
export function AppYoutubeLightbox({
  youtubeUrl,
  title = "วิดีโอ",
  onClose,
}: AppYoutubeLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const trimmed = youtubeUrl?.trim() || "";
  const videoId = trimmed ? extractYoutubeVideoId(trimmed) : null;
  const open = Boolean(videoId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      /** เครื่องเล่นกำลังเต็มจอ CSS — ให้เครื่องเล่นย่อเองก่อน */
      if (document.documentElement.dataset.appYtCssFs === "1") return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted || !trimmed) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[240] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-950/90",
        appSafeAreaOverlayPadAllClass,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#1e1b4b] px-3 py-2",
            appSafeAreaOverlayExpandedHeaderPadClass,
          )}
        >
          <p className="min-w-0 truncate text-sm font-bold text-white">{title}</p>
          <button
            type="button"
            className={headerIconClass}
            aria-label="ปิดวิดีโอ"
            title="ปิด"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="bg-slate-50 p-2 sm:p-3">
          <AppSecureYoutubePlayer
            youtubeUrl={trimmed}
            title={title}
            autoPlay
            lockSeekToWatched={false}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
