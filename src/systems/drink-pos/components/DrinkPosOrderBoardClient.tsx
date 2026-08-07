"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppEmptyState, AppSlipPrintIconButton, alertSlipPrintRequiresMonthlyPlan } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import {
  drinkPosFulfillmentLabel,
  drinkPosFulfillmentTone,
  drinkPosOrderTicketLabel,
  type DrinkPosFulfillmentStatus,
  type DrinkPosStationRole,
} from "@/systems/drink-pos/lib/fulfillment-status";
import type { DrinkPosOrderBoardRow } from "@/systems/drink-pos/lib/order-board";
import { printDrinkPosOrderTicket } from "@/systems/drink-pos/lib/drink-pos-order-ticket-print";
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
    if (
      a[i].id !== b[i].id ||
      a[i].fulfillmentStatus !== b[i].fulfillmentStatus ||
      a[i].statusUpdatedAt !== b[i].statusUpdatedAt ||
      Boolean(a[i].fromPreviousDay) !== Boolean(b[i].fromPreviousDay)
    ) {
      return false;
    }
  }
  return true;
}

export function DrinkPosOrderBoardClient({
  mode,
  role = "kitchen",
  ownerId,
  trialParam,
  shopName: shopNameProp,
  className,
}: Props) {
  const [orders, setOrders] = useState<DrinkPosOrderBoardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState<"sse" | "poll">("poll");
  const [shopName, setShopName] = useState<string | null>(shopNameProp?.trim() || null);
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(false);
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
        features?: { slipPrint?: boolean };
        error?: string;
      };
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "โหลดคิวไม่สำเร็จ");
      if (!mounted.current) return;
      const next = Array.isArray(j.orders) ? j.orders : [];
      setOrders((prev) => (sameBoard(prev, next) ? prev : next));
      setLastSync(j.serverTime ?? new Date().toISOString());
      if (typeof j.shopName === "string" && j.shopName.trim()) setShopName(j.shopName.trim());
      setSlipPrintEnabled(j.features?.slipPrint === true);
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
    const map: Record<"RECEIVED" | "MAKING" | "DONE", DrinkPosOrderBoardRow[]> = {
      RECEIVED: [],
      MAKING: [],
      DONE: [],
    };
    for (const o of orders) {
      if (o.fulfillmentStatus === "SERVED") continue;
      const key =
        o.fulfillmentStatus === "MAKING" || o.fulfillmentStatus === "DONE" ? o.fulfillmentStatus : "RECEIVED";
      map[key].push(o);
    }
    const oldestFirst = (a: DrinkPosOrderBoardRow, b: DrinkPosOrderBoardRow) =>
      +new Date(a.statusUpdatedAt) - +new Date(b.statusUpdatedAt) ||
      +new Date(a.createdAt) - +new Date(b.createdAt);
    map.RECEIVED.sort(oldestFirst);
    map.MAKING.sort(oldestFirst);
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
        setOrders((prev) => {
          const next = j.order!;
          if (next.fulfillmentStatus === "SERVED") {
            return prev.filter((o) => o.id !== next.id);
          }
          return prev.map((o) => {
            if (o.id !== next.id) return o;
            const merged = next.lines.length > 0 ? next : { ...next, lines: o.lines };
            return {
              ...merged,
              fromPreviousDay: merged.fromPreviousDay ?? o.fromPreviousDay,
            };
          });
        });
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

  const columns: { status: "RECEIVED" | "MAKING" | "DONE"; borderClass: string }[] = [
    { status: "RECEIVED", borderClass: "border-sky-300/80" },
    { status: "MAKING", borderClass: "border-amber-300/80" },
    { status: "DONE", borderClass: "border-emerald-300/80" },
  ];

  return (
    <div className={cn(mode === "station" ? "flex min-h-0 flex-1 flex-col gap-2" : "space-y-3", className)}>
      {error ? (
        <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">
          {error}
        </div>
      ) : null}

      {/* สถานี: เต็มจอ · แดชบอร์ด: สูงตามหน้า */}
      <div
        className={cn(
          "grid min-h-0 gap-2 sm:gap-3",
          mode === "station"
            ? "h-full flex-1 grid-rows-3 md:grid-rows-1 md:grid-cols-3"
            : "gap-3 md:h-[calc(100dvh-8.5rem)] md:min-h-[22rem] md:grid-cols-3 md:gap-4",
        )}
      >
        {columns.map(({ status, borderClass }) => {
          const list = grouped[status];
          const tone = drinkPosFulfillmentTone(status);
          const isDone = status === "DONE";
          const showRefreshChrome = mode === "dashboard" && isDone;
          return (
            <section
              key={status}
              className={cn(
                "relative flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border-2 p-3 shadow-md ring-1 ring-inset ring-white/50 sm:rounded-[2rem] sm:p-4",
                mode === "station" ? "h-full" : "min-h-[20rem] md:h-full md:min-h-0",
                tone.card,
                borderClass,
              )}
              aria-label={drinkPosFulfillmentLabel(status)}
            >
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2 border-b border-white/50 pb-2 sm:mb-3 sm:pb-3">
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
                    "flex min-h-0 flex-1 flex-col justify-center",
                    showRefreshChrome && "pb-16",
                    mode !== "station" && "min-h-[12rem] md:min-h-0",
                  )}
                >
                  <AppEmptyState tone="violet" className="py-6 text-xs sm:py-10">
                    ยังไม่มีรายการ
                  </AppEmptyState>
                </div>
              ) : (
                <ul
                  className={cn(
                    "min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]",
                    showRefreshChrome && "pb-16",
                    mode !== "station" && "min-h-[12rem] md:min-h-0",
                  )}
                >
                  {list.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      busy={busyId === order.id}
                      role={role}
                      shopLabel={shopName}
                      slipPrintEnabled={slipPrintEnabled}
                      onSetStatus={(s) => void setStatus(order.id, s)}
                    />
                  ))}
                </ul>
              )}

              {showRefreshChrome ? (
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

function formatOrderBoardDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrderCard({
  order,
  busy,
  role,
  shopLabel,
  slipPrintEnabled,
  onSetStatus,
}: {
  order: DrinkPosOrderBoardRow;
  busy: boolean;
  role: DrinkPosStationRole;
  shopLabel?: string | null;
  slipPrintEnabled: boolean;
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
    secondaryActions.push({ status: "DONE", label: "พร้อมรับ" });
  }
  if (order.fulfillmentStatus !== "SERVED") {
    secondaryActions.push({ status: "SERVED", label: "ส่งมอบแล้ว" });
  }

  const primary =
    order.fulfillmentStatus === "DONE"
      ? { status: "SERVED" as const, label: "ส่งมอบแล้ว" }
      : role === "serve" && order.fulfillmentStatus !== "SERVED"
        ? { status: "DONE" as const, label: "พร้อมรับ" }
        : quickNext
          ? { status: quickNext, label: tone.nextLabel ?? drinkPosFulfillmentLabel(quickNext) }
          : null;

  return (
    <li
      className={cn(
        "rounded-2xl border bg-white/90 p-3.5 shadow-sm backdrop-blur-sm",
        order.fromPreviousDay ? "border-amber-300/90 ring-1 ring-amber-200/70" : "border-white/70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            {order.fromPreviousDay ? (
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-white shadow-sm ring-2 ring-amber-200"
                title={`ออเดอร์วันที่ ${formatOrderBoardDate(order.createdAt)}`}
                aria-label={`แจ้งเตือน ออเดอร์วันที่ ${formatOrderBoardDate(order.createdAt)} ยังไม่ได้ส่งมอบ`}
              >
                !
              </span>
            ) : null}
            <p className="truncate text-sm font-black text-[#1e1b4b] sm:text-base">
              {drinkPosOrderTicketLabel(order.id, order.createdAt)}
            </p>
          </div>
          {order.fromPreviousDay ? (
            <p className="mt-0.5 inline-flex rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black text-amber-900 ring-1 ring-amber-400/40">
              {formatOrderBoardDate(order.createdAt)}
            </p>
          ) : null}
          {order.memberPhone ? (
            <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">ลูกค้า {order.memberPhone}</p>
          ) : null}
          {order.note ? <p className="mt-0.5 text-[11px] font-semibold text-[#4d47b6]">{order.note}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <AppSlipPrintIconButton
            aria-label={
              slipPrintEnabled
                ? `พิมพ์สลิปออเดอร์ ${order.id.slice(-6)}`
                : `พิมพ์สลิปต้องแพ็กเหมา 199 — ${order.id.slice(-6)}`
            }
            title={slipPrintEnabled ? "พิมพ์สลิป" : "ต้องแพ็กเหมารายเดือน 199"}
            disabled={busy}
            className={cn(!slipPrintEnabled && "opacity-45")}
            onClick={() => {
              if (!slipPrintEnabled) {
                alertSlipPrintRequiresMonthlyPlan();
                return;
              }
              printDrinkPosOrderTicket(order, { shopLabel });
            }}
          />
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", tone.badge)}>
            {drinkPosFulfillmentLabel(order.fulfillmentStatus)}
          </span>
        </div>
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
