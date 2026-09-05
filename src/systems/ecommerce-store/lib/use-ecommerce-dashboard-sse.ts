"use client";

import { useEffect, useRef } from "react";

const FALLBACK_POLL_MS = 20_000;
const OFFLINE_POLL_MS = 3_000;

const STREAM_URL = "/api/ecommerce-store/session/dashboard/stream";

/**
 * SSE แดชบอร์ดร้านออนไลน์ + soft-poll เมื่อต่อ SSE ได้ / poll ถี่เมื่อหลุด
 */
export function useEcommerceDashboardSse(onRefresh: () => void, enabled = true): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const liveModeRef = useRef<"sse" | "poll">("poll");

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let es: EventSource | null = null;

    const refresh = () => {
      if (!mounted) return;
      onRefreshRef.current();
    };

    const markPoll = () => {
      liveModeRef.current = "poll";
    };
    const markSse = () => {
      liveModeRef.current = "sse";
    };

    try {
      es = new EventSource(STREAM_URL);
      es.onopen = () => {
        if (!mounted) return;
        markSse();
      };
      es.onmessage = () => {
        if (!mounted) return;
        markSse();
        refresh();
      };
      es.onerror = () => {
        if (!mounted) return;
        markPoll();
      };
    } catch {
      markPoll();
    }

    const pollTimer = window.setInterval(() => {
      if (!mounted) return;
      if (document.hidden) return;
      if (liveModeRef.current === "sse") return;
      refresh();
    }, OFFLINE_POLL_MS);

    const softTimer = window.setInterval(() => {
      if (!mounted) return;
      if (document.hidden) return;
      if (liveModeRef.current !== "sse") return;
      refresh();
    }, FALLBACK_POLL_MS);

    return () => {
      mounted = false;
      es?.close();
      window.clearInterval(pollTimer);
      window.clearInterval(softTimer);
    };
  }, [enabled]);
}
