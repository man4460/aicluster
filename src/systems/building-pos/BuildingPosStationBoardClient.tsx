"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppEmptyState, AppSlipPrintIconButton, alertSlipPrintRequiresMonthlyPlan, resolveAppSlipPaperSize, useAppSlipPaperSize, type AppSlipPaperSize } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { PosOrder } from "@/systems/building-pos/building-pos-service";
import { printBuildingPosOrderTicket } from "@/systems/building-pos/building-pos-order-ticket-print";
import {
  buildingPosColumnStatusesForRole,
  buildingPosDashboardQueueColumnTone,
  buildingPosStationColumnHint,
  buildingPosStationStatusLabel,
  buildingPosStationStatusTone,
  BUILDING_POS_DASHBOARD_QUEUE_COLUMNS,
  BUILDING_POS_KITCHEN_STATUSES,
  BUILDING_POS_SERVE_STATUSES,
  BUILDING_POS_STATION_BOARD_STATUSES,
  type BuildingPosStationRole,
  type BuildingPosStationStatus,
} from "@/systems/building-pos/lib/station-role";

const FALLBACK_POLL_MS = 20_000;
const OFFLINE_POLL_MS = 3_000;

type Props = {
  mode?: "dashboard" | "station";
  role?: BuildingPosStationRole;
  ownerId?: string;
  trialParam?: string | null;
  /** แผนกครัวย่อย — กรองรายการอาหารของแผนกนั้น */
  departmentId?: number | null;
  departmentName?: string | null;
  className?: string;
};

function ticketLabel(order: PosOrder): string {
  const d = new Date(order.created_at);
  const hh = Number.isNaN(d.getTime())
    ? "--"
    : d.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
  const table = order.table_no.trim() || "—";
  return `โต๊ะ ${table} · ${hh}`;
}

function sameBoard(a: PosOrder[], b: PosOrder[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].board_key !== b[i].board_key ||
      a[i].status !== b[i].status ||
      a[i].total_amount !== b[i].total_amount ||
      a[i].note !== b[i].note ||
      a[i].items.length !== b[i].items.length
    ) {
      return false;
    }
    for (let j = 0; j < a[i].items.length; j++) {
      if (
        a[i].items[j].kitchen_status !== b[i].items[j].kitchen_status ||
        a[i].items[j].serve_status !== b[i].items[j].serve_status ||
        a[i].items[j].qty !== b[i].items[j].qty
      ) {
        return false;
      }
    }
  }
  return true;
}

function isStationBoardStatus(s: string): s is BuildingPosStationStatus {
  return (BUILDING_POS_STATION_BOARD_STATUSES as readonly string[]).includes(s);
}

export function BuildingPosStationBoardClient({
  mode = "station",
  role = "kitchen",
  ownerId,
  trialParam,
  departmentId = null,
  departmentName = null,
  className,
}: Props) {
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(false);
  const { paper: profileSlipPaper } = useAppSlipPaperSize();
  const [orderTicketPaper, setOrderTicketPaper] = useState<AppSlipPaperSize | null>(null);
  const slipPaper = orderTicketPaper ?? profileSlipPaper;
  const mounted = useRef(true);
  const liveModeRef = useRef<"sse" | "poll">("poll");

  const load = useCallback(async () => {
    try {
      const url =
        mode === "dashboard"
          ? "/api/building-pos/session/orders"
          : (() => {
              const qs = new URLSearchParams({ ownerId: ownerId ?? "" });
              if (trialParam) qs.set("t", trialParam);
              if (departmentId != null && departmentId > 0) {
                qs.set("departmentId", String(departmentId));
              }
              if (role === "serve") qs.set("stationRole", "serve");
              return `/api/building-pos/public/station/orders?${qs}`;
            })();
      const res = await fetch(url, {
        credentials: mode === "dashboard" ? "include" : "omit",
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as {
        orders?: PosOrder[];
        serverTime?: string;
        orderTicketSlipPaperSize?: string | null;
        features?: { slipPrint?: boolean };
        error?: string;
      };
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "โหลดคิวไม่สำเร็จ");
      if (!mounted.current) return;
      const list = Array.isArray(j.orders) ? j.orders : [];
      const columnSet = new Set<string>(buildingPosColumnStatusesForRole(role));
      const next =
        mode === "dashboard"
          ? list.filter((o) => columnSet.has(o.status))
          : list.filter((o) => columnSet.has(o.status));
      setOrders((prev) => (sameBoard(prev, next) ? prev : next));
      if (j.orderTicketSlipPaperSize) {
        setOrderTicketPaper(resolveAppSlipPaperSize(j.orderTicketSlipPaperSize));
      }
      setSlipPrintEnabled(j.features?.slipPrint === true);
      setError(null);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "โหลดคิวไม่สำเร็จ");
    }
  }, [departmentId, mode, ownerId, role, trialParam]);

  useEffect(() => {
    mounted.current = true;
    void load();

    const streamUrl =
      mode === "dashboard"
        ? "/api/building-pos/session/orders/board/stream"
        : `/api/building-pos/public/station/orders/stream?ownerId=${encodeURIComponent(ownerId ?? "")}`;

    let es: EventSource | null = null;

    const markPoll = () => {
      liveModeRef.current = "poll";
    };
    const markSse = () => {
      liveModeRef.current = "sse";
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

  async function setStatus(
    orderId: number,
    status: BuildingPosStationStatus,
    fromStatus?: BuildingPosStationStatus,
  ) {
    setBusyId(orderId);
    setError(null);
    try {
      const res =
        mode === "dashboard"
          ? await fetch(`/api/building-pos/session/orders?id=${orderId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ status }),
            })
          : await fetch("/api/building-pos/public/station/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ownerId,
                orderId,
                status,
                departmentId: departmentId && departmentId > 0 ? departmentId : undefined,
                fromServeStatus: role === "serve" ? fromStatus ?? status : undefined,
                t: trialParam || undefined,
              }),
            });
      const j = (await res.json().catch(() => ({}))) as {
        order?: PosOrder;
        reloadBoard?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "อัปเดตไม่สำเร็จ");
      if (role === "serve" || j.reloadBoard) {
        await load();
      } else if (j.order) {
        const columnSet = new Set<string>(buildingPosColumnStatusesForRole(role));
        setOrders((prev) => {
          let next = prev.map((o) => (o.id === orderId ? j.order! : o));
          if (j.order!.status === "PAID" || !columnSet.has(j.order!.status)) {
            next = next.filter((o) => o.id !== orderId);
          }
          return next;
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

  const grouped = useMemo(() => {
    if (role === "queue") {
      return BUILDING_POS_DASHBOARD_QUEUE_COLUMNS.map((col) => ({
        columnKey: col.key,
        title: col.label,
        hint: col.hint,
        list: orders.filter((o) => (col.statuses as readonly string[]).includes(o.status)),
        toneStatus: col.statuses[0] as BuildingPosStationStatus,
      }));
    }
    const columns = buildingPosColumnStatusesForRole(role);
    const buckets = Object.fromEntries(columns.map((st) => [st, [] as PosOrder[]])) as Record<
      BuildingPosStationStatus,
      PosOrder[]
    >;
    for (const o of orders) {
      if (isStationBoardStatus(o.status) && buckets[o.status]) {
        buckets[o.status].push(o);
      }
    }
    return columns.map((st) => ({
      columnKey: st,
      title: buildingPosStationStatusLabel(st, role),
      hint: buildingPosStationColumnHint(st, role),
      list: buckets[st] ?? [],
      toneStatus: st,
    }));
  }, [orders, role]);

  const gridColsClass =
    role === "queue"
      ? "md:grid-cols-2 xl:grid-cols-4"
      : "md:grid-cols-3";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2 sm:gap-3", className)}>
      {departmentName?.trim() ? (
        <p className="shrink-0 rounded-2xl border border-sky-200/80 bg-sky-50/90 px-3 py-1.5 text-xs font-black text-sky-900 sm:rounded-[1.25rem] sm:text-sm">
          ครัว · {departmentName.trim()}
        </p>
      ) : null}
      {error ? (
        <p className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 sm:rounded-[1.25rem] sm:py-2 sm:text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1 gap-2",
          mode === "station"
            ? cn("md:h-full md:gap-4", gridColsClass)
            : cn("md:h-[calc(100dvh-12rem)] md:min-h-[22rem] md:gap-4", gridColsClass),
        )}
      >
        {grouped.map(({ columnKey, title, hint, list, toneStatus }) => {
          const tone =
            role === "queue"
              ? buildingPosDashboardQueueColumnTone(
                  columnKey as (typeof BUILDING_POS_DASHBOARD_QUEUE_COLUMNS)[number]["key"],
                )
              : buildingPosStationStatusTone(toneStatus);
          return (
            <section
              key={columnKey}
              className={cn(
                "relative flex min-h-[12rem] flex-col overflow-hidden rounded-[1.25rem] border-2 p-2 shadow-md ring-1 ring-inset ring-white/50 sm:min-h-[16rem] sm:p-3 md:h-full md:min-h-0 md:p-4",
                tone.card,
              )}
              aria-label={hint ? `${title} — ${hint}` : title}
            >
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2 border-b border-white/50 pb-2 sm:mb-3 sm:items-start sm:pb-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base md:text-lg">{title}</h2>
                  {hint ? (
                    <p className="mt-0.5 hidden text-[11px] font-semibold leading-snug text-[#5f5a8a] sm:block sm:text-xs">
                      {hint}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-black tabular-nums sm:px-3 sm:py-1 sm:text-sm",
                    tone.badge,
                  )}
                >
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col justify-center">
                  <AppEmptyState className="py-4 text-xs sm:py-6">ยังไม่มีคิว</AppEmptyState>
                </div>
              ) : (
                <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain sm:space-y-2.5 [-webkit-overflow-scrolling:touch]">
                  {list.map((order) => (
                    <StationOrderCard
                      key={order.board_key ?? `${order.id}-${order.status}`}
                      order={order}
                      busy={busyId === order.id}
                      role={role}
                      onSetStatus={(st) =>
                        void setStatus(
                          order.id,
                          st,
                          isStationBoardStatus(order.status) ? order.status : undefined,
                        )
                      }
                      onPrintSlip={() => {
                        if (!slipPrintEnabled) {
                          alertSlipPrintRequiresMonthlyPlan();
                          return;
                        }
                        const kitchenLike = role === "kitchen" || role === "serve";
                        printBuildingPosOrderTicket(order, {
                          variant: kitchenLike ? "kitchen" : "receipt",
                          subtitle:
                            role === "serve"
                              ? "สลิปเสิร์ฟ · ส่งโต๊ะ"
                              : role === "kitchen"
                                ? "สลิปครัว · ส่งโต๊ะ"
                                : "ใบออเดอร์",
                          paper: slipPaper,
                        });
                      }}
                      slipPrintEnabled={slipPrintEnabled}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function StationOrderCard({
  order,
  busy,
  role,
  onSetStatus,
  onPrintSlip,
  slipPrintEnabled,
}: {
  order: PosOrder;
  busy: boolean;
  role: BuildingPosStationRole;
  onSetStatus: (status: BuildingPosStationStatus) => void;
  onPrintSlip: () => void;
  slipPrintEnabled: boolean;
}) {
  const tone = buildingPosStationStatusTone(order.status);
  const roleStatuses =
    role === "serve"
      ? BUILDING_POS_SERVE_STATUSES
      : role === "queue"
        ? BUILDING_POS_STATION_BOARD_STATUSES
        : BUILDING_POS_KITCHEN_STATUSES;

  const secondary = roleStatuses
    .filter((s) => s !== order.status)
    .map((s) => ({
      status: s,
      label: buildingPosStationStatusLabel(s, role),
    }));

  let primary: { status: BuildingPosStationStatus; label: string } | null = null;
  if (role === "serve") {
    if (order.status === "SERVED") {
      primary = { status: "SERVING", label: "เริ่มเสิร์ฟ" };
    } else if (order.status === "SERVING") {
      primary = { status: "DELIVERED", label: "เสิร์ฟเรียบร้อย" };
    }
  } else if (role === "queue") {
    if (order.status === "NEW") {
      primary = { status: "PREPARING", label: "ส่งครัวทำ" };
    } else if (order.status === "PREPARING") {
      primary = { status: "SERVED", label: "ครัวทำเสร็จ" };
    } else if (order.status === "SERVED") {
      primary = { status: "SERVING", label: "เริ่มเสิร์ฟ" };
    } else if (order.status === "SERVING") {
      primary = { status: "DELIVERED", label: "เสร็จแล้ว" };
    }
  } else if (role === "kitchen" && tone.nextStatus) {
    primary = {
      status: tone.nextStatus,
      label: tone.nextLabel ?? buildingPosStationStatusLabel(tone.nextStatus, role),
    };
  }

  const primaryMobileLabel =
    primary && (role === "kitchen" || role === "queue") && primary.status === "SERVED"
      ? "ทำเสร็จ"
      : primary && (role === "serve" || role === "queue") && primary.status === "DELIVERED"
        ? "เสร็จแล้ว"
        : primary && role === "queue" && primary.status === "PREPARING"
          ? "ส่งครัว"
          : primary && role === "queue" && primary.status === "SERVING"
            ? "เริ่มเสิร์ฟ"
            : primary?.label ?? null;

  const table = order.table_no.trim() || "—";

  return (
    <li className={cn("rounded-2xl border p-2 shadow-sm sm:rounded-[1.25rem] sm:p-3", tone.card)}>
      <div className="flex items-center justify-between gap-1.5 sm:items-start sm:gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-[#1e1b4b] sm:text-sm">{ticketLabel(order)}</p>
          {order.customer_name.trim() ? (
            <p className="mt-0 truncate text-[10px] font-semibold text-[#66638c] sm:mt-0.5 sm:text-[11px]">
              {order.customer_name}
            </p>
          ) : null}
          {order.note.trim() ? (
            <p className="mt-0 line-clamp-1 text-[10px] font-semibold text-[#4d47b6] sm:mt-0.5 sm:line-clamp-none sm:text-[11px]">
              {order.note}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <AppSlipPrintIconButton
            aria-label={
              slipPrintEnabled
                ? `พิมพ์สลิปโต๊ะ ${table} ออเดอร์ ${order.id}`
                : `พิมพ์สลิปต้องแพ็กเหมา 199 — โต๊ะ ${table}`
            }
            title={slipPrintEnabled ? "พิมพ์สลิป" : "ต้องแพ็กเหมารายเดือน 199"}
            disabled={busy}
            className={cn(
              "min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px]",
              !slipPrintEnabled && "opacity-45",
            )}
            onClick={onPrintSlip}
          />
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[9px] font-black sm:px-2 sm:py-0.5 sm:text-[10px]",
              tone.badge,
            )}
          >
            {buildingPosStationStatusLabel(order.status, role)}
          </span>
        </div>
      </div>
      <ul className="mt-1 space-y-0.5 border-t border-white/50 pt-1 text-[11px] font-semibold leading-snug text-[#2e2a58] sm:mt-2 sm:space-y-1 sm:pt-2 sm:text-xs">
        {order.items.map((it, idx) => (
          <li key={`${order.id}-${idx}`} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">{it.name}</span>
            <span className="shrink-0 tabular-nums">×{it.qty}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-3 sm:gap-1.5">
        {primary ? (
          <button
            type="button"
            disabled={busy}
            className="app-btn-primary min-h-[36px] flex-1 rounded-lg px-2.5 text-[11px] font-black disabled:opacity-50 sm:min-h-[44px] sm:rounded-xl sm:px-3 sm:text-xs md:text-sm"
            onClick={() => onSetStatus(primary.status)}
          >
            {busy ? "…" : (
              <>
                <span className="sm:hidden">{primaryMobileLabel}</span>
                <span className="hidden sm:inline">{primary.label}</span>
              </>
            )}
          </button>
        ) : null}
        {secondary
          .filter((a) => !primary || a.status !== primary.status)
          .map((a) => {
            const labelFull =
              role === "kitchen" && a.status === "SERVED"
                ? "ทำเสร็จแล้ว · ส่งต่อแผนกเสิร์ฟ"
                : role === "serve" && a.status === "SERVING"
                  ? "เริ่มเสิร์ฟ"
                  : role === "serve" && a.status === "DELIVERED"
                    ? "เสิร์ฟเรียบร้อย"
                    : a.label;
            const labelShort =
              role === "kitchen" && a.status === "SERVED"
                ? "ทำเสร็จ"
                : role === "serve" && a.status === "DELIVERED"
                  ? "เสร็จแล้ว"
                  : a.label;
            return (
              <button
                key={a.status}
                type="button"
                disabled={busy}
                className="min-h-[32px] rounded-lg border border-[#5b61ff]/20 bg-white/90 px-2 text-[10px] font-black text-[#4d47b6] disabled:opacity-50 sm:min-h-[44px] sm:rounded-xl sm:px-2.5 sm:text-[11px]"
                onClick={() => onSetStatus(a.status)}
              >
                <span className="sm:hidden">{labelShort}</span>
                <span className="hidden sm:inline">{labelFull}</span>
              </button>
            );
          })}
      </div>
    </li>
  );
}
