"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { extractYoutubeVideoId, secureYoutubeEmbedUrl } from "@/lib/youtube-url";
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

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function nativeFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    fullscreenEnabled?: boolean;
  };
  return Boolean(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled);
}

/** iOS / iPad — requestFullscreen บน div มักพัง iframe YouTube */
function preferCssFullscreenOnly(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/i.test(ua)) return true;
  if (/Macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document) {
    return true;
  }
  return false;
}

const headerIconClass =
  "inline-flex h-9 w-9 touch-manipulation items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition active:scale-95 active:opacity-80";

/**
 * Template กลาง — เล่น YouTube ในป๊อปอัป (พื้นมืด · Esc · ปิด · เต็มจอ)
 * แบบ LMS: ไม่มีลิงก์ watch / คัดลอก · ปุ่มไอคอนล้วน · iOS ใช้ขยาย CSS
 */
export function AppYoutubeLightbox({
  youtubeUrl,
  title = "วิดีโอ",
  onClose,
}: AppYoutubeLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [cssExpanded, setCssExpanded] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoId = youtubeUrl?.trim() ? extractYoutubeVideoId(youtubeUrl.trim()) : null;
  const open = Boolean(videoId);
  const embed = videoId ? secureYoutubeEmbedUrl(videoId, true) : null;

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
      const active = Boolean(getFullscreenElement());
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
      if (document.exitFullscreen && getFullscreenElement()) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      else if (doc.msExitFullscreen) await doc.msExitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (preferCssFullscreenOnly() || !nativeFullscreenSupported()) {
      setCssExpanded(true);
      return;
    }

    const el = stageRef.current;
    if (!el) {
      setCssExpanded(true);
      return;
    }
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        if (!getFullscreenElement()) setCssExpanded(true);
        return;
      }
      if (anyEl.webkitRequestFullscreen) {
        await anyEl.webkitRequestFullscreen();
        if (!getFullscreenElement()) setCssExpanded(true);
        return;
      }
      if (anyEl.msRequestFullscreen) {
        await anyEl.msRequestFullscreen();
        if (!getFullscreenElement()) setCssExpanded(true);
        return;
      }
    } catch {
      /* fall through */
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
        expanded ? "p-0" : cn(appSafeAreaOverlayPadAllClass),
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
            "flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#1e1b4b]/95 px-3 py-2",
            expanded && appSafeAreaOverlayExpandedHeaderPadClass,
          )}
        >
          <p className="min-w-0 truncate text-sm font-bold text-white">{title}</p>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className={headerIconClass}
              aria-label={expanded ? "ย่อจากเต็มจอ" : "ดูเต็มจอ"}
              aria-pressed={expanded}
              title={expanded ? "ย่อ" : "ดูเต็มจอ"}
              onClick={() => void toggleFullscreen()}
            >
              {expanded ? (
                <Minimize2 className="h-5 w-5" aria-hidden />
              ) : (
                <Maximize2 className="h-5 w-5" aria-hidden />
              )}
            </button>
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
        </div>
        <div
          ref={stageRef}
          className={cn(
            "relative w-full min-h-0 bg-black",
            expanded ? "flex-1" : "aspect-video max-h-[min(70dvh,calc(100dvh-5.5rem))]",
          )}
        >
          <iframe
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
