"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AttendanceDashboardLogRow,
  AttendanceDashboardSseEvent,
  AttendanceDashboardStats,
} from "@/lib/attendance/dashboard-types";
import { bangkokDateKey } from "@/lib/time/bangkok";

export function mergeAttendanceDashboardLog(
  rows: AttendanceDashboardLogRow[],
  incoming: AttendanceDashboardLogRow,
): AttendanceDashboardLogRow[] {
  const idx = rows.findIndex((r) => r.id === incoming.id);
  if (idx === -1) return [incoming, ...rows];
  const next = rows.slice();
  next[idx] = incoming;
  return next;
}

export function useAttendanceDashboardLive(initialStats: AttendanceDashboardStats) {
  const today = bangkokDateKey();
  const [stats, setStats] = useState(initialStats);
  const [rows, setRows] = useState<AttendanceDashboardLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const sp = new URLSearchParams();
    sp.set("from", today);
    sp.set("to", today);
    const res = await fetch(`/api/attendance/logs?${sp}`, { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      logs?: AttendanceDashboardLogRow[];
      error?: string;
    };
    if (res.ok) {
      setLoadErr(null);
      setRows(j.logs ?? []);
    } else {
      setLoadErr(j.error ?? "โหลดรายชื่อไม่สำเร็จ");
      setRows([]);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        es = new EventSource("/api/attendance/dashboard/stream");
        es.onmessage = (ev) => {
          if (document.hidden) return;
          try {
            const data = JSON.parse(ev.data) as AttendanceDashboardSseEvent;
            if (data.type === "patch") {
              setStats(data.stats);
              setRows((prev) => mergeAttendanceDashboardLog(prev, data.log));
              setLoadErr(null);
              setLoading(false);
            }
          } catch {
            /* ignore malformed */
          }
        };
        es.onerror = () => {
          es?.close();
          es = null;
        };
      } catch {
        /* SSE ไม่พร้อม */
      }
    };

    connect();

    return () => {
      closed = true;
      es?.close();
    };
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      void loadAll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [loadAll]);

  return { stats, rows, loading, loadErr };
}
