"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronsLeft, Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  extractYoutubeVideoId,
  normalizeSecureYoutubeEmbedUrl,
} from "@/lib/youtube-url";
import {
  appSafeAreaOverlayExpandedHeaderPadClass,
  appSafeAreaFixedBottomBarPadClass,
} from "@/components/app-templates/safe-area-tokens";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setSize?: (width: number, height: number) => void;
  destroy: () => void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
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

async function enterNativeFullscreen(el: HTMLElement): Promise<void> {
  const node = el as FullscreenElement;
  if (node.requestFullscreen) {
    await node.requestFullscreen();
    return;
  }
  if (node.webkitRequestFullscreen) {
    await node.webkitRequestFullscreen();
    return;
  }
  if (node.msRequestFullscreen) {
    await node.msRequestFullscreen();
  }
}

async function exitNativeFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  if (document.exitFullscreen && getFullscreenElement()) {
    await document.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
    return;
  }
  if (doc.msExitFullscreen) {
    await doc.msExitFullscreen();
  }
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string | undefined>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState?: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.body.appendChild(s);
    }
  });
  return ytApiPromise;
}

/** ไอคอนล้วน — โหมดซ้อนบนวิดีโอ (ขาว) */
const controlIconOnVideoClass =
  "pointer-events-auto inline-flex h-9 w-9 touch-manipulation items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] transition active:scale-95 active:opacity-80 disabled:opacity-35";

/** ไอคอนล้วน — แถบใต้จอ (ไม่บังเนื้อหา) */
const controlIconBelowClass =
  "inline-flex h-9 w-9 touch-manipulation items-center justify-center text-[#1e1b4b] transition active:scale-95 active:opacity-70 disabled:opacity-35";

type Props = {
  youtubeUrl: string;
  title: string;
  className?: string;
  /** เล่นอัตโนมัติเมื่อพร้อม (เช่น หลังจบบทก่อนหน้า) */
  autoPlay?: boolean;
  /**
   * true = เลื่อนได้เฉพาะช่วงที่ดูแล้ว (LMS)
   * false = เลื่อนอิสระ (lightbox ชมรม / โปรโมท)
   */
  lockSeekToWatched?: boolean;
  onProgress?: (watchedPercent: number, ended: boolean) => void;
};

/**
 * เล่น YouTube ในหน้า (inline) แบบ LMS — ปิด controls ของ YouTube · ไอคอนล้วน ·
 * เต็มจอ CSS บน iOS · ไม่มีลิงก์ watch / คัดลอกลิงก์ · ชั้นทับกัน iframe กันเปิดแอป YouTube
 */
export function AppSecureYoutubePlayer({
  youtubeUrl,
  title,
  className,
  autoPlay = false,
  lockSeekToWatched = true,
  onProgress,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onProgressRef = useRef(onProgress);
  const autoPlayRef = useRef(autoPlay);
  const maxWatchedRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [nativeFs, setNativeFs] = useState(false);
  const [cssExpanded, setCssExpanded] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [maxWatchedSec, setMaxWatchedSec] = useState(0);
  /** โหมดเต็มจอ — ซ่อนแถบควบคุมอัตโนมัติเวลาเล่น เพื่อไม่บังเนื้อหา */
  const [fsControlsVisible, setFsControlsVisible] = useState(true);
  const hideFsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const resumePlayRef = useRef(false);
  const resumeSecRef = useRef(0);
  const [portalReady, setPortalReady] = useState(false);
  /** ขนาดกล่อง 16:9 แบบ cover — เต็มจอทุกด้าน (อาจครอปขอบ) */
  const [coverBox, setCoverBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  /** visualViewport — บน iOS ต้องล็อกตำแหน่ง/ขนาดตามนี้ */
  const [vpBox, setVpBox] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const videoId = extractYoutubeVideoId(youtubeUrl.trim());
  const embedFallback = normalizeSecureYoutubeEmbedUrl(youtubeUrl);
  const expanded = cssExpanded || nativeFs;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    maxWatchedRef.current = 0;
    setCurrentSec(0);
    setDurationSec(0);
    setMaxWatchedSec(0);
    setCssExpanded(false);
  }, [videoId]);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = getFullscreenElement();
      setNativeFs(Boolean(active && shellRef.current && active === shellRef.current));
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!cssExpanded) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.dataset.appYtCssFs = "1";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
          resumeSecRef.current = playerRef.current?.getCurrentTime?.() ?? 0;
        } catch {
          /* ignore */
        }
        resumePlayRef.current = true;
        setCssExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      delete document.documentElement.dataset.appYtCssFs;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [cssExpanded]);

  const bumpFsControls = useCallback(() => {
    setFsControlsVisible(true);
    if (hideFsTimerRef.current) clearTimeout(hideFsTimerRef.current);
    hideFsTimerRef.current = setTimeout(() => {
      setFsControlsVisible(false);
    }, 2600);
  }, []);

  useEffect(() => {
    if (!expanded) {
      setFsControlsVisible(true);
      if (hideFsTimerRef.current) clearTimeout(hideFsTimerRef.current);
      return;
    }
    if (!playing) {
      setFsControlsVisible(true);
      if (hideFsTimerRef.current) clearTimeout(hideFsTimerRef.current);
      return;
    }
    bumpFsControls();
    return () => {
      if (hideFsTimerRef.current) clearTimeout(hideFsTimerRef.current);
    };
  }, [expanded, playing, bumpFsControls]);

  /** เต็มจอมือถือ: cover เต็ม visualViewport ซ้าย–ขวา–บน–ล่าง */
  useEffect(() => {
    if (!expanded) {
      setCoverBox({ w: 0, h: 0 });
      setVpBox({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const syncCover = () => {
      const vv = window.visualViewport;
      const width = Math.max(1, Math.round(vv?.width ?? window.innerWidth));
      const height = Math.max(1, Math.round(vv?.height ?? window.innerHeight));
      const top = Math.round(vv?.offsetTop ?? 0);
      const left = Math.round(vv?.offsetLeft ?? 0);
      setVpBox({ top, left, width, height });

      const ratio = 16 / 9;
      let w: number;
      let h: number;
      if (width / height > ratio) {
        w = width;
        h = Math.ceil(width / ratio);
      } else {
        h = height;
        w = Math.ceil(height * ratio);
      }
      setCoverBox({ w, h });
      try {
        playerRef.current?.setSize?.(w, h);
      } catch {
        /* ignore */
      }
    };

    syncCover();
    const t1 = window.setTimeout(syncCover, 50);
    const t2 = window.setTimeout(syncCover, 300);
    window.addEventListener("resize", syncCover);
    window.addEventListener("orientationchange", syncCover);
    window.visualViewport?.addEventListener("resize", syncCover);
    window.visualViewport?.addEventListener("scroll", syncCover);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", syncCover);
      window.removeEventListener("orientationchange", syncCover);
      window.visualViewport?.removeEventListener("resize", syncCover);
      window.visualViewport?.removeEventListener("scroll", syncCover);
    };
  }, [expanded, ready, videoId]);

  const seekWithinWatched = useCallback(
    (target: number) => {
      const p = playerRef.current;
      if (!p) return;
      const dur = p.getDuration?.() || durationSec || 0;
      const maxAllowed = lockSeekToWatched
        ? Math.max(maxWatchedRef.current, 0)
        : Math.max(dur, 0);
      const clamped = Math.max(0, Math.min(target, maxAllowed || target, dur || target));
      try {
        p.seekTo(clamped, true);
        setCurrentSec(clamped);
      } catch {
        /* ignore */
      }
    },
    [durationSec, lockSeekToWatched],
  );

  const rewind = useCallback(
    (seconds = 10) => {
      const p = playerRef.current;
      if (!p) return;
      const now = p.getCurrentTime?.() ?? currentSec;
      seekWithinWatched(now - seconds);
    },
    [currentSec, seekWithinWatched],
  );

  const toggleFullscreen = useCallback(async () => {
    if (nativeFs) {
      try {
        await exitNativeFullscreen();
      } catch {
        /* ignore */
      }
      return;
    }
    if (cssExpanded) {
      try {
        resumeSecRef.current = playerRef.current?.getCurrentTime?.() ?? currentSec;
      } catch {
        resumeSecRef.current = currentSec;
      }
      resumePlayRef.current = playing;
      setCssExpanded(false);
      return;
    }
    try {
      resumeSecRef.current = playerRef.current?.getCurrentTime?.() ?? currentSec;
    } catch {
      resumeSecRef.current = currentSec;
    }
    resumePlayRef.current = playing;
    /** iOS: ขยาย CSS เท่านั้น — อย่าเรียก requestFullscreen (iframe หาย/เพี้ยน) */
    if (preferCssFullscreenOnly() || !nativeFullscreenSupported()) {
      setCssExpanded(true);
      return;
    }
    const shell = shellRef.current;
    if (!shell) {
      setCssExpanded(true);
      return;
    }
    try {
      await enterNativeFullscreen(shell);
      if (!getFullscreenElement()) setCssExpanded(true);
    } catch {
      setCssExpanded(true);
    }
  }, [cssExpanded, nativeFs, playing, currentSec]);

  useEffect(() => {
    if (!videoId || !hostRef.current) return;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    void (async () => {
      await loadYoutubeApi();
      if (cancelled || !hostRef.current || !window.YT?.Player) return;

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          modestbranding: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          disablekb: 1,
          enablejsapi: 1,
          playsinline: 1,
          fs: 0,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setReady(true);
            try {
              const dur = e.target.getDuration?.() ?? 0;
              if (dur > 0) setDurationSec(dur);
            } catch {
              /* ignore */
            }
            const resumeAt = resumeSecRef.current;
            if (resumeAt > 0.25) {
              try {
                e.target.seekTo(resumeAt, true);
                setCurrentSec(resumeAt);
              } catch {
                /* ignore */
              }
            }
            if (autoPlayRef.current || resumePlayRef.current) {
              resumePlayRef.current = false;
              try {
                e.target.playVideo();
              } catch {
                /* autoplay may be blocked */
              }
            }
          },
          onStateChange: (e) => {
            const PLAYING = window.YT?.PlayerState?.PLAYING ?? 1;
            const PAUSED = window.YT?.PlayerState?.PAUSED ?? 2;
            const ENDED = window.YT?.PlayerState?.ENDED ?? 0;
            if (e.data === PLAYING) setPlaying(true);
            if (e.data === PAUSED) setPlaying(false);
            if (e.data === ENDED) {
              setPlaying(false);
              const dur = e.target.getDuration?.() ?? 0;
              if (dur > 0) {
                maxWatchedRef.current = dur;
                setMaxWatchedSec(dur);
                setCurrentSec(dur);
              }
              onProgressRef.current?.(100, true);
            }
          },
        },
      });

      poll = setInterval(() => {
        const p = playerRef.current;
        if (!p?.getCurrentTime || !p?.getDuration) return;
        const dur = p.getDuration();
        if (!dur || dur <= 0) return;
        const cur = p.getCurrentTime();
        if (cur > maxWatchedRef.current + 1.25) {
          try {
            p.seekTo(maxWatchedRef.current, true);
          } catch {
            /* ignore */
          }
          return;
        }
        if (cur > maxWatchedRef.current) {
          maxWatchedRef.current = cur;
          setMaxWatchedSec(cur);
        }
        setCurrentSec(cur);
        setDurationSec(dur);
        const pct = Math.min(100, Math.round((cur / dur) * 100));
        onProgressRef.current?.(pct, false);
      }, 500);
    })();

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      setReady(false);
      setPlaying(false);
    };
  }, [videoId, cssExpanded]);

  if (!videoId || !embedFallback) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-sm text-white/80",
          className,
        )}
      >
        ไม่พบวิดีโอ
      </div>
    );
  }

  const progressPct = durationSec > 0 ? Math.min(100, (currentSec / durationSec) * 100) : 0;
  const watchedPct = durationSec > 0 ? Math.min(100, (maxWatchedSec / durationSec) * 100) : 0;

  const seekBar = (tone: "onVideo" | "below") => {
    const trackIdle = tone === "onVideo" ? "bg-white/25" : "bg-slate-200";
    const timeClass =
      tone === "onVideo" ? "text-white/80" : "text-slate-500";
    return (
      <div>
        <label className="sr-only" htmlFor={`app-yt-seek-${videoId}-${tone}`}>
          ตำแหน่งวิดีโอ (ย้อนกลับได้ในส่วนที่ดูแล้ว)
        </label>
        <input
          id={`app-yt-seek-${videoId}-${tone}`}
          type="range"
          min={0}
          max={Math.max(1, Math.floor(durationSec) || 1)}
          step={1}
          value={
            lockSeekToWatched
              ? Math.min(Math.floor(currentSec), Math.floor(maxWatchedSec) || 0)
              : Math.floor(currentSec)
          }
          disabled={!ready || durationSec <= 0}
          className={cn(
            "lms-yt-seek h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#5b61ff] disabled:opacity-40",
            trackIdle,
          )}
          style={{
            background:
              tone === "onVideo"
                ? `linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) ${progressPct}%, rgba(255,255,255,0.35) ${progressPct}%, rgba(255,255,255,0.35) ${watchedPct}%, rgba(255,255,255,0.15) ${watchedPct}%, rgba(255,255,255,0.15) 100%)`
                : `linear-gradient(to right, #5b61ff 0%, #5b61ff ${progressPct}%, #c4c2e0 ${progressPct}%, #c4c2e0 ${watchedPct}%, #e8e7f2 ${watchedPct}%, #e8e7f2 100%)`,
          }}
          onChange={(e) => {
            seekWithinWatched(Number(e.target.value));
            if (expanded) bumpFsControls();
          }}
          aria-valuemin={0}
          aria-valuemax={Math.floor(durationSec) || 0}
          aria-valuenow={Math.floor(currentSec)}
          aria-valuetext={`${formatTime(currentSec)} จาก ${formatTime(durationSec)}`}
        />
        <div className={cn("mt-0.5 flex justify-between text-[10px] font-semibold tabular-nums", timeClass)}>
          <span>{formatTime(currentSec)}</span>
          <span>{formatTime(durationSec)}</span>
        </div>
      </div>
    );
  };

  const transportButtons = (tone: "onVideo" | "below") => {
    const btn = tone === "onVideo" ? controlIconOnVideoClass : controlIconBelowClass;
    return (
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className={btn}
          disabled={!ready || currentSec <= 0}
          onClick={() => {
            rewind(10);
            if (expanded) bumpFsControls();
          }}
          aria-label="ย้อนกลับ 10 วินาที"
          title="ย้อนกลับ 10 วินาที"
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className={btn}
          disabled={!ready}
          onClick={() => {
            const p = playerRef.current;
            if (!p) return;
            if (playing) p.pauseVideo();
            else p.playVideo();
            if (expanded) bumpFsControls();
          }}
          aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
          title={playing ? "หยุด" : "เล่น"}
        >
          {playing ? (
            <Pause className="h-5 w-5" aria-hidden strokeWidth={2.25} />
          ) : (
            <Play className="h-5 w-5" aria-hidden strokeWidth={2.25} />
          )}
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => void toggleFullscreen()}
          aria-label={expanded ? "ออกจากเต็มจอ" : "ขยายเต็มจอ"}
          title={expanded ? "ย่อ" : "เต็มจอ"}
          aria-pressed={expanded}
        >
          {expanded ? (
            <Minimize2 className="h-4 w-4" aria-hidden strokeWidth={2.25} />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden strokeWidth={2.25} />
          )}
        </button>
      </div>
    );
  };

  const shell = (
    <div
      ref={shellRef}
      className={cn(
        "relative isolate overflow-hidden bg-black",
        cssExpanded ? "rounded-none" : "aspect-video rounded-xl",
        nativeFs && !cssExpanded && "aspect-auto h-full min-h-full w-full rounded-none",
      )}
      style={
        cssExpanded
          ? {
              position: "fixed",
              top: vpBox.top || 0,
              left: vpBox.left || 0,
              width: vpBox.width || "100vw",
              height: vpBox.height || "100dvh",
              zIndex: 99999,
              margin: 0,
            }
          : undefined
      }
    >
      {/* โหมดเต็มจอ: cover เต็มจอทุกด้าน · ครอปขอบถ้าจอไม่ใช่ 16:9 */}
      <div
        className={cn(
          "z-0 overflow-hidden bg-black",
          expanded ? "absolute inset-0" : "absolute inset-0",
        )}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          if (expanded) {
            if (fsControlsVisible && playing) setFsControlsVisible(false);
            else bumpFsControls();
          }
        }}
      >
        <div
          ref={stageRef}
          className={cn(
            "overflow-hidden bg-black",
            expanded
              ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              : "relative h-full w-full",
          )}
          style={
            expanded && coverBox.w > 0
              ? { width: coverBox.w, height: coverBox.h }
              : expanded
                ? { width: "100%", height: "100%" }
                : undefined
          }
        >
          <div
            ref={hostRef}
            className="absolute inset-0 h-full w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
            title={title}
          />
          <div className="absolute inset-0 z-10" aria-hidden />
        </div>
      </div>

      {expanded ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 transition-opacity duration-300",
            fsControlsVisible ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={!fsControlsVisible}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 flex justify-end px-2",
              appSafeAreaOverlayExpandedHeaderPadClass,
            )}
          >
            <button
              type="button"
              className={cn(controlIconOnVideoClass, fsControlsVisible && "pointer-events-auto")}
              tabIndex={fsControlsVisible ? 0 : -1}
              onClick={() => void toggleFullscreen()}
              aria-label="ออกจากเต็มจอ"
              title="ย่อ"
            >
              <Minimize2 className="h-4 w-4" aria-hidden strokeWidth={2.25} />
            </button>
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-14",
              appSafeAreaFixedBottomBarPadClass,
              fsControlsVisible && "pointer-events-auto",
            )}
          >
            {seekBar("onVideo")}
            {transportButtons("onVideo")}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {cssExpanded ? <div className="aspect-video w-full" aria-hidden /> : null}
      <div className={cn(!expanded && "space-y-2", className)}>
        {cssExpanded && portalReady ? createPortal(shell, document.body) : shell}
        {!expanded ? (
          <div className="space-y-1.5 px-0.5">
            {seekBar("below")}
            {transportButtons("below")}
          </div>
        ) : null}
      </div>
    </>
  );
}
