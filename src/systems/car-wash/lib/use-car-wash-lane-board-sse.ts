"use client";

import { useEffect, useRef } from "react";

const FALLBACK_POLL_MS = 20_000;
const OFFLINE_POLL_MS = 3_000;

const STREAM_URL = "/api/car-wash/session/lane/stream";

/**
 * SSE ลานล้างวันนี้ + soft-poll เมื่อต่อ SSE ได้ / poll ถี่เมื่อหลุด
 * เรียก `onRefresh` เมื่อมี event หรือตามช่วงเวลาสำรอง
 * `streamQuery` — ต่อท้าย query string (ลิงก์พนักงาน: ownerId/t/k/du)
 */
export function useCarWashLaneBoardSse(
  onRefresh: () => void,
  enabled = true,
  streamQuery?: string,
): void {
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

    const url = streamQuery ? `${STREAM_URL}?${streamQuery}` : STREAM_URL;
    try {
      es = new EventSource(url);
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
  }, [enabled, streamQuery]);
}
