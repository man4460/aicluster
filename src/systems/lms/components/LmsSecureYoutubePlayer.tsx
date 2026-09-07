"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsLeft, Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  appSafeAreaOverlayExpandedHeaderPadClass,
  appSafeAreaFixedBottomBarPadClass,
} from "@/components/app-templates";
import {
  lmsSecureYoutubeEmbedSrc,
  lmsYoutubeVideoId,
} from "@/systems/lms/lib/youtube";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
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
  onProgress?: (watchedPercent: number, ended: boolean) => void;
};

export function LmsSecureYoutubePlayer({
  youtubeUrl,
  title,
  className,
  autoPlay = false,
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
  const videoId = lmsYoutubeVideoId(youtubeUrl);
  const embedFallback = lmsSecureYoutubeEmbedSrc(youtubeUrl);
  const expanded = cssExpanded || nativeFs;

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCssExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      window.removeEventListener("keydown", onKey);
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

  const seekWithinWatched = useCallback(
    (target: number) => {
      const p = playerRef.current;
      if (!p) return;
      const dur = p.getDuration?.() || durationSec || 0;
      const maxAllowed = Math.max(maxWatchedRef.current, 0);
      const clamped = Math.max(0, Math.min(target, maxAllowed, dur || target));
      try {
        p.seekTo(clamped, true);
        setCurrentSec(clamped);
      } catch {
        /* ignore */
      }
    },
    [durationSec],
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
      setCssExpanded(false);
      return;
    }
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
  }, [cssExpanded, nativeFs]);

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
            if (autoPlayRef.current) {
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
  }, [videoId]);

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
        <label className="sr-only" htmlFor={`lms-yt-seek-${videoId}-${tone}`}>
          ตำแหน่งวิดีโอ (ย้อนกลับได้ในส่วนที่ดูแล้ว)
        </label>
        <input
          id={`lms-yt-seek-${videoId}-${tone}`}
          type="range"
          min={0}
          max={Math.max(1, Math.floor(durationSec) || 1)}
          step={1}
          value={Math.min(Math.floor(currentSec), Math.floor(maxWatchedSec) || 0)}
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

  return (
    <>
      {cssExpanded ? <div className="aspect-video w-full" aria-hidden /> : null}
      <div className={cn(!expanded && "space-y-2", className)}>
        <div
          ref={shellRef}
          className={cn(
            "relative isolate overflow-hidden bg-black",
            cssExpanded
              ? "fixed inset-0 z-[300] h-[100dvh] max-h-[100dvh] w-full rounded-none"
              : "aspect-video rounded-xl",
            nativeFs && !cssExpanded && "aspect-auto h-full min-h-full w-full rounded-none",
          )}
        >
          <div className="absolute inset-0 z-0 overflow-hidden bg-black">
            <div
              ref={hostRef}
              className="h-full w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
              title={title}
            />
          </div>
          <div
            className="absolute inset-0 z-10"
            onContextMenu={(e) => e.preventDefault()}
            onClick={() => {
              if (expanded) {
                if (fsControlsVisible && playing) setFsControlsVisible(false);
                else bumpFsControls();
              }
            }}
            aria-hidden
          />

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

        {/* โหมดปกติ — เส้นเวลา/ปุ่มอยู่ใต้จอ ไม่ทับเนื้อหาวิดีโอ */}
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
