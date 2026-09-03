"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  lmsSecureYoutubeEmbedSrc,
  lmsYoutubeVideoId,
} from "@/systems/lms/lib/youtube";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
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
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoId = lmsYoutubeVideoId(youtubeUrl);
  const embedFallback = lmsSecureYoutubeEmbedSrc(youtubeUrl);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

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
              onProgressRef.current?.(100, true);
            }
          },
        },
      });

      poll = setInterval(() => {
        const p = playerRef.current as YTPlayer & {
          getCurrentTime?: () => number;
          getDuration?: () => number;
        };
        if (!p?.getCurrentTime || !p?.getDuration) return;
        const dur = p.getDuration();
        if (!dur || dur <= 0) return;
        const pct = Math.min(100, Math.round((p.getCurrentTime() / dur) * 100));
        onProgressRef.current?.(pct, false);
      }, 5000);
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
      <div
        className="absolute inset-0 z-10"
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/25 to-transparent p-3">
        <button
          type="button"
          className="pointer-events-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 text-sm font-semibold text-white shadow-none backdrop-blur-[2px] transition hover:bg-black/40"
          disabled={!ready}
          onClick={() => {
            const p = playerRef.current;
            if (!p) return;
            if (playing) p.pauseVideo();
            else p.playVideo();
          }}
          aria-label={playing ? "หยุดชั่วคราว" : "เล่น"}
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          <span>{playing ? "หยุด" : "เล่น"}</span>
        </button>
        <button
          type="button"
          className="pointer-events-auto inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 text-sm font-semibold text-white shadow-none backdrop-blur-[2px] transition hover:bg-black/40 sm:px-4"
          onClick={() => {
            const shell = shellRef.current;
            if (!shell) return;
            void (async () => {
              try {
                if (isFullscreen) await exitFullscreen();
                else await enterFullscreen(shell);
              } catch {
                /* browser may block fullscreen without gesture / unsupported */
              }
            })();
          }}
          aria-label={isFullscreen ? "ออกจากเต็มจอ" : "ขยายเต็มจอ"}
          title={isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden />
          )}
          <span className="hidden sm:inline">{isFullscreen ? "ย่อ" : "เต็มจอ"}</span>
        </button>
      </div>
    </div>
  );
}
