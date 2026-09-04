"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
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
  webkitExitFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function enterFullscreen(el: HTMLElement): Promise<void> {
  const node = el as FullscreenElement;
  if (node.requestFullscreen) {
    await node.requestFullscreen();
    return;
  }
  if (node.webkitRequestFullscreen) {
    await node.webkitRequestFullscreen();
  }
}

async function exitFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  if (document.exitFullscreen && getFullscreenElement()) {
    await document.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
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
          playerVars?: Record<string, number | string>;
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

const controlBtnClass =
  "pointer-events-auto inline-flex h-9 min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-2.5 text-[11px] font-semibold text-white shadow-none backdrop-blur-[2px] transition hover:bg-black/45 disabled:opacity-40 sm:text-xs";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [maxWatchedSec, setMaxWatchedSec] = useState(0);
  const videoId = lmsYoutubeVideoId(youtubeUrl);
  const embedFallback = lmsSecureYoutubeEmbedSrc(youtubeUrl);

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
  }, [videoId]);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = getFullscreenElement();
      setIsFullscreen(Boolean(active && shellRef.current && active === shellRef.current));
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    };
  }, []);

  const seekWithinWatched = useCallback((target: number) => {
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
  }, [durationSec]);

  const rewind = useCallback(
    (seconds = 10) => {
      const p = playerRef.current;
      if (!p) return;
      const now = p.getCurrentTime?.() ?? currentSec;
      seekWithinWatched(now - seconds);
    },
    [currentSec, seekWithinWatched],
  );

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
        playerVars: {
          modestbranding: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          disablekb: 1,
          enablejsapi: 1,
          playsinline: 1,
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
        // ห้ามกระโดดข้ามส่วนที่ยังไม่เคยดู — ถ้าเลย max ให้ดึงกลับ
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

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative aspect-video overflow-hidden rounded-xl bg-black",
        isFullscreen && "aspect-auto h-full min-h-full w-full rounded-none",
        className,
      )}
    >
      <div ref={hostRef} className="h-full w-full" title={title} />
      {/* บล็อกคลิกบน iframe — ใช้แถบควบคุมด้านล่างแทน (ย้อนกลับได้ · ห้ามข้ามไปข้างหน้า) */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-2 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-3 pt-10">
        <div className="pointer-events-auto">
          <label className="sr-only" htmlFor={`lms-yt-seek-${videoId}`}>
            ตำแหน่งวิดีโอ (ย้อนกลับได้ในส่วนที่ดูแล้ว)
          </label>
          <input
            id={`lms-yt-seek-${videoId}`}
            type="range"
            min={0}
            max={Math.max(1, Math.floor(durationSec) || 1)}
            step={1}
            value={Math.min(Math.floor(currentSec), Math.floor(maxWatchedSec) || 0)}
            disabled={!ready || durationSec <= 0}
            className="lms-yt-seek h-2 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white disabled:opacity-40"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) ${progressPct}%, rgba(255,255,255,0.35) ${progressPct}%, rgba(255,255,255,0.35) ${watchedPct}%, rgba(255,255,255,0.15) ${watchedPct}%, rgba(255,255,255,0.15) 100%)`,
            }}
            onChange={(e) => {
              seekWithinWatched(Number(e.target.value));
            }}
            aria-valuemin={0}
            aria-valuemax={Math.floor(durationSec) || 0}
            aria-valuenow={Math.floor(currentSec)}
            aria-valuetext={`${formatTime(currentSec)} จาก ${formatTime(durationSec)}`}
          />
          <div className="mt-1 flex justify-between text-[10px] font-semibold tabular-nums text-white/80">
            <span>{formatTime(currentSec)}</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            className={controlBtnClass}
            disabled={!ready || currentSec <= 0}
            onClick={() => rewind(10)}
            aria-label="ย้อนกลับ 10 วินาที"
            title="ย้อนกลับ 10 วินาที"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            <span>−10วิ</span>
          </button>
          <button
            type="button"
            className={cn(controlBtnClass, "min-w-[4.5rem] px-3")}
            disabled={!ready}
            onClick={() => {
              const p = playerRef.current;
              if (!p) return;
              if (playing) p.pauseVideo();
              else p.playVideo();
            }}
            aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            <span>{playing ? "หยุด" : "เล่น"}</span>
          </button>
          <button
            type="button"
            className={controlBtnClass}
            onClick={() => {
              const shell = shellRef.current;
              if (!shell) return;
              void (async () => {
                try {
                  if (isFullscreen) await exitFullscreen();
                  else await enterFullscreen(shell);
                } catch {
                  /* browser may block fullscreen */
                }
              })();
            }}
            aria-label={isFullscreen ? "ออกจากเต็มจอ" : "ขยายเต็มจอ"}
            title={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="hidden sm:inline">{isFullscreen ? "ย่อ" : "เต็มจอ"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
