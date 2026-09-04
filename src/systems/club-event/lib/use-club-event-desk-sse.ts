"use client";

import { useEffect, useRef } from "react";

const FALLBACK_POLL_MS = 20_000;
const OFFLINE_POLL_MS = 3_000;

/** SSE จุดลงทะเบียนวันงาน + soft-poll สำรอง */
export function useClubEventDeskSse(
  eventId: string,
  onRefresh: () => void,
  enabled = true,
): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const liveModeRef = useRef<"sse" | "poll">("poll");

  useEffect(() => {
    if (!enabled || !eventId) return;

    let mounted = true;
    let es: EventSource | null = null;
    const streamUrl = `/api/club-event/session/events/${encodeURIComponent(eventId)}/desk/stream`;

    const refresh = () => {
      if (!mounted) return;
      onRefreshRef.current();
    };

    try {
      es = new EventSource(streamUrl);
      es.onopen = () => {
        if (!mounted) return;
        liveModeRef.current = "sse";
      };
      es.onmessage = (ev) => {
        if (!mounted) return;
        liveModeRef.current = "sse";
        try {
          const data = JSON.parse(String(ev.data ?? "{}")) as { type?: string };
          if (data.type === "hello") return;
        } catch {
          /* refresh anyway */
        }
        refresh();
      };
      es.onerror = () => {
        if (!mounted) return;
        liveModeRef.current = "poll";
      };
    } catch {
      liveModeRef.current = "poll";
    }

    const pollTimer = window.setInterval(() => {
      if (!mounted || document.hidden) return;
      if (liveModeRef.current === "sse") return;
      refresh();
    }, OFFLINE_POLL_MS);

    const softTimer = window.setInterval(() => {
      if (!mounted || document.hidden) return;
      if (liveModeRef.current !== "sse") return;
      refresh();
    }, FALLBACK_POLL_MS);

    return () => {
      mounted = false;
      es?.close();
      window.clearInterval(pollTimer);
      window.clearInterval(softTimer);
    };
  }, [enabled, eventId]);
}
