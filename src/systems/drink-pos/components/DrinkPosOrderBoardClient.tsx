"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import {
  drinkPosFulfillmentLabel,
  drinkPosFulfillmentTone,
  drinkPosOrderTicketLabel,
  DRINK_POS_FULFILLMENT_STATUSES,
  type DrinkPosFulfillmentStatus,
  type DrinkPosStationRole,
} from "@/systems/drink-pos/lib/fulfillment-status";
import type { DrinkPosOrderBoardRow } from "@/systems/drink-pos/lib/order-board";
import { drinkPosCtaClass } from "@/systems/drink-pos/lib/ui-tokens";

const FALLBACK_POLL_MS = 20_000;
const OFFLINE_POLL_MS = 3_000;

type Props = {
  mode: "dashboard" | "station";
  role?: DrinkPosStationRole;
  ownerId?: string;
  trialParam?: string | null;
  shopName?: string | null;
  className?: string;
};

function sameBoard(a: DrinkPosOrderBoardRow[], b: DrinkPosOrderBoardRow[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].fulfillmentStatus !== b[i].fulfillmentStatus || a[i].statusUpdatedAt !== b[i].statusUpdatedAt) {
      return false;
    }
  }
  return true;
}

export function DrinkPosOrderBoardClient({ mode, role = "kitchen", ownerId, trialParam, className }: Props) {
  const [orders, setOrders] = useState<DrinkPosOrderBoardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState<"sse" | "poll">("poll");
  const mounted = useRef(true);
  const liveModeRef = useRef<"sse" | "poll">("poll");

  const load = useCallback(async () => {
    try {
      const url =
        mode === "dashboard"
          ? "/api/drink-pos/orders/board"
          : `/api/drink-pos/public/station/orders?ownerId=${encodeURIComponent(ownerId ?? "")}${
              trialParam ? `&t=${encodeURIComponent(trialParam)}` : ""
            }`;
      const res = await fetch(url, { credentials: mode === "dashboard" ? "include" : "omit", cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        orders?: DrinkPosOrderBoardRow[];
        serverTime?: string;
        shopName?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "โหลดคิวไม่สำเร็จ");
      if (!mounted.current) return;
      const next = Array.isArray(j.orders) ? j.orders : [];
      setOrders((prev) => (sameBoard(prev, next) ? prev : next));
      setLastSync(j.serverTime ?? new Date().toISOString());
      setError(null);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "โหลดคิวไม่สำเร็จ");
    }
  }, [mode, ownerId, trialParam]);

  useEffect(() => {
    mounted.current = true;
    void load();

    const streamUrl =
      mode === "dashboard"
        ? "/api/drink-pos/orders/board/stream"
        : `/api/drink-pos/public/station/orders/stream?ownerId=${encodeURIComponent(ownerId ?? "")}`;

    let es: EventSource | null = null;

    const markPoll = () => {
      liveModeRef.current = "poll";
      setLiveMode("poll");
    };
    const markSse = () => {
      liveModeRef.current = "sse";
      setLiveMode("sse");
    };

    try {
      es = new EventSource(streamUrl);
      es.onopen = () => {
        if (!mounted.current) return;
        markSse();
      };
      es.onmessage = () => {
        if (!mounted.current) return;
        markSse();
        void load();
      };
      es.onerror = () => {
        if (!mounted.current) return;
        markPoll();
      };
    } catch {
      markPoll();
    }

    // สำรอง: ถ้า SSE หลุด โพลทุก 3 วินาที · ถ้า SSE ติด โพลเบาทุก 20 วินาที
    const pollTimer = window.setInterval(() => {
      if (!mounted.current) return;
      if (liveModeRef.current === "sse") return;
      void load();
    }, OFFLINE_POLL_MS);

    const softTimer = window.setInterval(() => {
      if (!mounted.current) return;
      if (liveModeRef.current !== "sse") return;
      void load();
    }, FALLBACK_POLL_MS);

    return () => {
      mounted.current = false;
      es?.close();
      window.clearInterval(pollTimer);
      window.clearInterval(softTimer);
    };
  }, [load, mode, ownerId]);

  const grouped = useMemo(() => {
    const map: Record<DrinkPosFulfillmentStatus, DrinkPosOrderBoardRow[]> = {
      RECEIVED: [],
      MAKING: [],
      DONE: [],
    };
    for (const o of orders) {
      const key = (DRINK_POS_FULFILLMENT_STATUSES.includes(o.fulfillmentStatus as DrinkPosFulfillmentStatus)
        ? o.fulfillmentStatus
        : "RECEIVED") as DrinkPosFulfillmentStatus;
      map[key].push(o);
    }
    // รับออเดอร์ / กำลังทำ — มาก่อนอยู่ด้านบน
    const oldestFirst = (a: DrinkPosOrderBoardRow, b: DrinkPosOrderBoardRow) =>
      +new Date(a.statusUpdatedAt) - +new Date(b.statusUpdatedAt) || +new Date(a.createdAt) - +new Date(b.createdAt);
    map.RECEIVED.sort(oldestFirst);
    map.MAKING.sort(oldestFirst);
    // เสร็จแล้ว — พึ่งเสร็จอยู่ด้านบน
    map.DONE.sort((a, b) => +new Date(b.statusUpdatedAt) - +new Date(a.statusUpdatedAt));
    return map;
  }, [orders]);

  async function setStatus(orderId: string, status: DrinkPosFulfillmentStatus) {
    setBusyId(orderId);
    setError(null);
    try {
      const res =
        mode === "dashboard"
          ? await fetch(`/api/drink-pos/orders/${encodeURIComponent(orderId)}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ status }),
            })
          : await fetch("/api/drink-pos/public/station/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ownerId,
                saleId: orderId,
                status,
                t: trialParam ?? null,
              }),
            });
      const j = (await res.json().catch(() => ({}))) as { order?: DrinkPosOrderBoardRow; error?: string };
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "อัปเดตไม่สำเร็จ");
      if (j.order) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== j.order!.id) return o;
            const next = j.order!;
            // กันกรณี API คืน lines ว่าง — คงรายการเมนูเดิมไว้
            return next.lines.length > 0 ? next : { ...next, lines: o.lines };
          }),
        );
      } else {
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปเดตไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  const liveLabel =
    liveMode === "sse" ? "อัปเดตทันที (SSE)" : "โหมดสำรอง — โพลทุก 3 วินาที";
  const lastSyncLabel = lastSync
    ? new Date(lastSync).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" })
    : null;

  const columns: { status: DrinkPosFulfillmentStatus; borderClass: string }[] = [
    { status: "RECEIVED", borderClass: "border-sky-300/80" },
    { status: "MAKING", borderClass: "border-amber-300/80" },
    { status: "DONE", borderClass: "border-emerald-300/80" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">
          {error}
        </div>
      ) : null}

      {/* มือถือเรียงแนวตั้ง ความสูงต่อคอลัมน์พอเห็นรายการ · เดสก์ท็อป 3 คอลัมน์สูงพอดีจอ */}
      <div className="grid gap-3 md:h-[calc(100dvh-8.5rem)] md:min-h-[22rem] md:grid-cols-3 md:gap-4">
        {columns.map(({ status, borderClass }) => {
          const list = grouped[status];
          const tone = drinkPosFulfillmentTone(status);
          const isDone = status === "DONE";
          return (
            <section
              key={status}
              className={cn(
                "relative flex min-h-[20rem] flex-col overflow-hidden rounded-[1.75rem] border-2 p-3 shadow-md ring-1 ring-inset ring-white/50 sm:rounded-[2rem] sm:p-4 md:h-full md:min-h-0",
                tone.card,
                borderClass,
              )}
              aria-label={drinkPosFulfillmentLabel(status)}
            >
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2 border-b border-white/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={cn("h-3.5 w-3.5 rounded-full shadow-sm", tone.bar)} aria-hidden />
                  <h3 className="text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">
                    {drinkPosFulfillmentLabel(status)}
                  </h3>
                </div>
                <span className={cn("rounded-full px-3 py-1 text-sm font-black tabular-nums", tone.badge)}>
                  {list.length}
                </span>
              </div>

              {list.length === 0 ? (
                <div
                  className={cn(
                    "flex min-h-[12rem] flex-1 flex-col justify-center md:min-h-0",
                    isDone && "pb-16",
                  )}
                >
                  <AppEmptyState tone="violet" className="py-10 text-xs">
                    ยังไม่มีรายการ
                  </AppEmptyState>
                </div>
              ) : (
                <ul
                  className={cn(
                    "min-h-[12rem] flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch] md:min-h-0",
                    isDone && "pb-16",
                  )}
                >
                  {list.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      busy={busyId === order.id}
                      role={role}
                      onSetStatus={(s) => void setStatus(order.id, s)}
                    />
                  ))}
                </ul>
              )}

              {isDone ? (
                <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1 sm:bottom-4 sm:right-4">
                  <p className="max-w-[11rem] rounded-lg bg-white/85 px-2 py-0.5 text-right text-[10px] font-semibold text-[#66638c] shadow-sm backdrop-blur-sm">
                    {liveLabel}
                    {lastSyncLabel ? ` · ${lastSyncLabel}` : ""}
                  </p>
                  <DrinkPosButton
                    type="button"
                    className={cn(
                      drinkPosCtaClass,
                      "pointer-events-auto min-h-[44px] min-w-[44px] rounded-2xl px-3 text-sm shadow-[0_10px_24px_-8px_rgba(55,48,163,0.5)] sm:min-w-0 sm:px-4",
                    )}
                    onClick={() => void load()}
                    aria-label="รีเฟรชคิวออเดอร์"
                    title="รีเฟรช"
                  >
                    <span className="sm:hidden" aria-hidden>
                      ↻
                    </span>
                    <span className="hidden sm:inline">รีเฟรช</span>
                  </DrinkPosButton>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  busy,
  role,
  onSetStatus,
}: {
  order: DrinkPosOrderBoardRow;
  busy: boolean;
  role: DrinkPosStationRole;
  onSetStatus: (status: DrinkPosFulfillmentStatus) => void;
}) {
  const tone = drinkPosFulfillmentTone(order.fulfillmentStatus);
  const quickNext = tone.nextStatus;

  const secondaryActions: { status: DrinkPosFulfillmentStatus; label: string }[] = [];
  if (order.fulfillmentStatus !== "RECEIVED") {
    secondaryActions.push({ status: "RECEIVED", label: "รับออเดอร์" });
  }
  if (order.fulfillmentStatus !== "MAKING") {
    secondaryActions.push({ status: "MAKING", label: "กำลังทำ" });
  }
  if (order.fulfillmentStatus !== "DONE") {
    secondaryActions.push({ status: "DONE", label: "เสร็จแล้ว" });
  }

  const primary =
    role === "serve" && order.fulfillmentStatus !== "DONE"
      ? { status: "DONE" as const, label: "เสร็จแล้ว / พร้อมเสิร์ฟ" }
      : quickNext
        ? { status: quickNext, label: tone.nextLabel ?? drinkPosFulfillmentLabel(quickNext) }
        : null;

  return (
    <li className="rounded-2xl border border-white/70 bg-white/90 p-3.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-[#1e1b4b] sm:text-base">{drinkPosOrderTicketLabel(order.id, order.createdAt)}</p>
          {order.memberPhone ? (
            <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">ลูกค้า {order.memberPhone}</p>
          ) : null}
          {order.note ? <p className="mt-0.5 text-[11px] font-semibold text-[#4d47b6]">{order.note}</p> : null}
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black", tone.badge)}>
          {drinkPosFulfillmentLabel(order.fulfillmentStatus)}
        </span>
      </div>
      <ul className="mt-2 space-y-1 border-t border-[#e8e6fc]/80 pt-2 text-xs font-semibold text-[#2e2a58] sm:text-sm">
        {order.lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">
              {l.productName}
              {l.sizeLabel ? ` (${l.sizeLabel})` : ""}
            </span>
            <span className="shrink-0 tabular-nums">×{l.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {primary ? (
          <DrinkPosButton
            type="button"
            disabled={busy}
            className={cn(drinkPosCtaClass, "min-h-[44px] flex-1 px-3 text-xs sm:text-sm")}
            onClick={() => onSetStatus(primary.status)}
          >
            {busy ? "…" : primary.label}
          </DrinkPosButton>
        ) : null}
        {secondaryActions
          .filter((a) => !primary || a.status !== primary.status)
          .map((a) => (
            <DrinkPosButton
              key={a.status}
              type="button"
              disabled={busy}
              className="min-h-[44px] rounded-xl border border-[#0000BF]/20 bg-white/90 px-2.5 text-[11px] font-black text-[#4d47b6]"
              onClick={() => onSetStatus(a.status)}
            >
              {a.label}
            </DrinkPosButton>
          ))}
      </div>
    </li>
  );
}
