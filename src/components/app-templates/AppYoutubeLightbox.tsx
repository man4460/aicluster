"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { extractYoutubeVideoId, youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/youtube-url";
import {
  appSafeAreaOverlayExpandedHeaderPadClass,
  appSafeAreaOverlayPadAllClass,
} from "@/components/app-templates/safe-area-tokens";

export type AppYoutubeLightboxProps = {
  /** watch / embed / youtu.be / video id */
  youtubeUrl: string | null;
  title?: string;
  onClose: () => void;
};

function nativeFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    fullscreenEnabled?: boolean;
  };
  return Boolean(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled);
}

/**
 * Template กลาง — เล่น YouTube ในป๊อปอัป (พื้นมืด · Esc · ปิด · เต็มจอ)
 * มือถือ/iOS: ใช้โหมดขยายเต็มพื้นที่ (CSS) เมื่อ browser fullscreen ใช้ไม่ได้
 * iframe มี allowFullScreen ให้ปุ่มเต็มจอของ YouTube ใช้ได้
 */
export function AppYoutubeLightbox({
  youtubeUrl,
  title = "วิดีโอ YouTube",
  onClose,
}: AppYoutubeLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [cssExpanded, setCssExpanded] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoId = youtubeUrl?.trim() ? extractYoutubeVideoId(youtubeUrl.trim()) : null;
  const open = Boolean(videoId);
  const embed = videoId ? youtubeEmbedUrl(videoId, true) : null;
  const watch = videoId ? youtubeWatchUrl(videoId) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCssExpanded(false);
      setNativeFs(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (cssExpanded) {
          setCssExpanded(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, cssExpanded]);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const active = Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement);
      setNativeFs(active);
      if (!active) setCssExpanded(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as EventListener);
    };
  }, []);

  const exitNativeFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      else if (doc.msExitFullscreen) await doc.msExitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    /** มือถือ/iOS ส่วนใหญ่ไม่รองรับ requestFullscreen บน div — ขยายด้วย CSS */
    if (!nativeFullscreenSupported()) {
      setCssExpanded(true);
      return;
    }

    const targets: (HTMLElement | null)[] = [iframeRef.current, stageRef.current];
    for (const el of targets) {
      if (!el) continue;
      const anyEl = el as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          return;
        }
        if (anyEl.webkitRequestFullscreen) {
          await anyEl.webkitRequestFullscreen();
          return;
        }
        if (anyEl.msRequestFullscreen) {
          await anyEl.msRequestFullscreen();
          return;
        }
      } catch {
        /* try next target */
      }
    }
    setCssExpanded(true);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (nativeFs) {
      await exitNativeFullscreen();
      return;
    }
    if (cssExpanded) {
      setCssExpanded(false);
      return;
    }
    await enterFullscreen();
  }, [cssExpanded, enterFullscreen, exitNativeFullscreen, nativeFs]);

  if (!open || !mounted || !embed) return null;

  const expanded = cssExpanded || nativeFs;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[240] flex items-center justify-center overflow-hidden bg-slate-950/90",
        expanded
          ? "p-0"
          : cn(appSafeAreaOverlayPadAllClass),
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative flex w-full flex-col overflow-hidden border border-white/20 bg-black shadow-2xl",
          expanded
            ? "h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0"
            : "max-h-[min(100dvh,920px)] max-w-5xl rounded-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#1e1b4b] px-3 py-2",
            expanded && appSafeAreaOverlayExpandedHeaderPadClass,
          )}
        >
          <p className="min-w-0 truncate text-sm font-bold text-white">{title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-xs font-bold text-white hover:bg-white/20 sm:min-w-0"
              aria-label={expanded ? "ย่อจากเต็มจอ" : "ดูเต็มจอ"}
              aria-pressed={expanded}
              title={expanded ? "ย่อ" : "ดูเต็มจอ"}
              onClick={() => void toggleFullscreen()}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" aria-hidden />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden />
              )}
              <span className="hidden sm:inline">{expanded ? "ย่อ" : "เต็มจอ"}</span>
            </button>
            {watch ? (
              <a
                href={watch}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center rounded-lg bg-white/10 px-2.5 text-xs font-bold text-white hover:bg-white/20"
              >
                YouTube
              </a>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label="ปิดวิดีโอ"
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div
          ref={stageRef}
          className={cn(
            "relative w-full min-h-0 bg-black",
            expanded ? "flex-1" : "aspect-video max-h-[min(70dvh,calc(100dvh-5.5rem))]",
          )}
        >
          <iframe
            ref={iframeRef}
            title={title}
            src={embed}
            className="absolute inset-0 h-full w-full"
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
