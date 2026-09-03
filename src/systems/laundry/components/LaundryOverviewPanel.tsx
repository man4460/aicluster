"use client";

import { type ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { LaundryDashboardHeaderToolbar } from "@/systems/laundry/components/LaundryDashboardHeaderToolbar";
import { LaundryOrderCard } from "@/systems/laundry/components/LaundryOrderCard";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryOrder,
  type LaundryOrderStatus,
} from "@/systems/laundry/laundry-service";
import {
  laundryDashboardStatsGridClass,
  laundryOrderCardListGridClass,
} from "@/systems/laundry/laundry-dashboard-layout";
import {
  laundryFilterChipClass,
  laundryFilterChipShellClass,
  laundryPanelClass,
  laundryPanelDividerClass,
  laundryPanelSectionClass,
  laundrySectionHeadingClass,
  laundryStaffPanelSectionClass,
  laundryStaffPlainPanelClass,
  laundryStatInlineClass,
} from "@/systems/laundry/lib/ui-tokens";

const STAT_ACCENTS = {
  slate: "border-l-slate-400 text-slate-700",
  amber: "border-l-amber-500 text-amber-800",
  blue: "border-l-sky-500 text-sky-800",
  green: "border-l-emerald-500 text-emerald-800",
} as const;

type StatFilterKey = "today" | "waiting" | "active" | "revenue";

function orderDateKey(o: LaundryOrder): string {
  return new Date(o.order_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function isActiveOrder(o: LaundryOrder): boolean {
  return o.status !== "COMPLETED" && o.status !== "CANCELLED";
}

const LIST_TITLE: Record<StatFilterKey, string> = {
  today: "รับงานวันนี้",
  waiting: "รอรับผ้าวันนี้",
  active: "งานค้างวันนี้",
  revenue: "ออเดอร์รายรับวันนี้",
};

function LaundryStat({
  title,
  value,
  tone = "blue",
  icon,
  active,
  onClick,
  className,
}: {
  title: string;
  value: string;
  tone?: keyof typeof STAT_ACCENTS;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        laundryStatInlineClass,
        "w-full border-l-[3px] text-left transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35",
        STAT_ACCENTS[tone],
        active && "ring-2 ring-[#5b61ff]/30 ring-offset-1",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-75">
        <span className="text-current opacity-80" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      <p className="text-lg font-bold tabular-nums sm:text-xl">{value}</p>
    </button>
  );
}

export function LaundryOverviewPanel({
  orders,
  todayStats,
  loading,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onPrintOrder,
  staffQrLanding = false,
  refreshing = false,
  onRefresh,
}: {
  orders: LaundryOrder[];
  todayStats: {
    totalOrders: number;
    waitingPickup: number;
    activeOrders: number;
    revenue: number;
  };
  loading: boolean;
  onViewOrder: (o: LaundryOrder) => void;
  onEditOrder: (o: LaundryOrder) => void;
  onDeleteOrder: (o: LaundryOrder) => void | Promise<void>;
  onStatusChange: (id: number, status: LaundryOrderStatus) => void | Promise<void>;
  onPrintOrder?: (o: LaundryOrder) => void;
  staffQrLanding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}) {
  const [statFilter, setStatFilter] = useState<StatFilterKey | null>(null);
  const [statusFilter, setStatusFilter] = useState<LaundryOrderStatus | null>(null);
  const todayKey = bangkokDateKey();

  const statusCounts = useMemo(() => {
    const active = orders.filter(isActiveOrder);
    const map = new Map<LaundryOrderStatus, number>();
    for (const s of LAUNDRY_ORDER_STATUSES) map.set(s, 0);
    for (const o of active) {
      map.set(o.status, (map.get(o.status) ?? 0) + 1);
    }
    return LAUNDRY_ORDER_STATUSES.map((s) => ({ status: s, count: map.get(s) ?? 0 })).filter((x) => x.count > 0);
  }, [orders]);

  const baseOrders = useMemo(() => {
    if (!statFilter) {
      return orders.filter(isActiveOrder);
    }
    const todayRows = orders.filter((o) => orderDateKey(o) === todayKey);
    switch (statFilter) {
      case "today":
      case "revenue":
        return todayRows;
      case "waiting":
        return todayRows.filter((o) => o.status === "PENDING_PICKUP");
      case "active":
        return todayRows.filter(isActiveOrder);
      default:
        return todayRows.filter(isActiveOrder);
    }
  }, [orders, statFilter, todayKey]);

  const filteredOrders = useMemo(() => {
    let list = statusFilter ? baseOrders.filter((o) => o.status === statusFilter) : baseOrders;
    if (!statFilter && !statusFilter) {
      list = list.slice(0, 12);
    }
    return list;
  }, [baseOrders, statFilter, statusFilter]);

  const listTitle = statFilter ? LIST_TITLE[statFilter] : "งานล่าสุดที่ยังไม่จบ";

  function toggleStat(key: StatFilterKey) {
    setStatusFilter(null);
    setStatFilter((prev) => (prev === key ? null : key));
  }

  function toggleStatusFilter(status: LaundryOrderStatus) {
    setStatusFilter((prev) => (prev === status ? null : status));
  }

  return (
    <div className={staffQrLanding ? laundryStaffPlainPanelClass : laundryPanelClass}>
      <div className={staffQrLanding ? laundryStaffPanelSectionClass : laundryPanelSectionClass}>
        {!staffQrLanding ?
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">ภาพรวม</h2>
            <LaundryDashboardHeaderToolbar
              hideSubNav={staffQrLanding}
              staffQrLanding={staffQrLanding}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </div>
        : null}

        <div className={cn(laundryDashboardStatsGridClass, !staffQrLanding && "mt-4")}>
          <LaundryStat
            title="รับงานวันนี้"
            value={todayStats.totalOrders.toLocaleString("th-TH")}
            tone="slate"
            active={statFilter === "today"}
            onClick={() => toggleStat("today")}
            icon={
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              </svg>
            }
          />
          <LaundryStat
            title="รอรับผ้า"
            value={todayStats.waitingPickup.toLocaleString("th-TH")}
            tone="amber"
            active={statFilter === "waiting"}
            onClick={() => toggleStat("waiting")}
            icon={
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
          <LaundryStat
            title="งานค้าง"
            value={todayStats.activeOrders.toLocaleString("th-TH")}
            tone="blue"
            active={statFilter === "active"}
            onClick={() => toggleStat("active")}
            icon={
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            }
          />
          <LaundryStat
            title="รายรับวันนี้"
            value={`฿${todayStats.revenue.toLocaleString("th-TH")}`}
            tone="green"
            active={statFilter === "revenue"}
            onClick={() => toggleStat("revenue")}
            className="md:min-w-0"
            icon={
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
              </svg>
            }
          />
        </div>
      </div>

      <div className={cn(staffQrLanding ? laundryStaffPanelSectionClass : laundryPanelSectionClass, laundryPanelDividerClass)}>
        <div className="space-y-2">
          <h3 className={laundrySectionHeadingClass}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            </svg>
            {listTitle}
            <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#5f5a8a]">
              {filteredOrders.length}
            </span>
          </h3>

          {statusCounts.length > 0 ?
            <nav className={laundryFilterChipShellClass} aria-label="กรองตามสถานะงานค้าง" role="tablist">
              {statusCounts.map(({ status, count }) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => toggleStatusFilter(status)}
                    className={laundryFilterChipClass(active)}
                  >
                    {laundryOrderStatusLabelTh(status)}
                    <span
                      className={cn(
                        "rounded px-1 py-0.5 text-[9px] font-bold tabular-nums sm:text-[10px]",
                        active ? "bg-[#5b61ff]/15 text-indigo-900" : "bg-indigo-100 text-indigo-800",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          : null}
        </div>
        {loading ?
          <p className="mt-3 text-xs text-[#66638c]">กำลังโหลด…</p>
        : filteredOrders.length === 0 ?
          <p className="mt-3 text-sm text-[#66638c]">ไม่มีรายการตามตัวกรองนี้</p>
        : <ul className={cn(laundryOrderCardListGridClass, "mt-3")}>
            {filteredOrders.map((o) => (
              <li key={o.id} className="min-h-0 min-w-0">
                <LaundryOrderCard
                  order={o}
                  tone="violet"
                  showStatusSelect
                  showOrderedAt
                  compact={staffQrLanding}
                  onView={() => onViewOrder(o)}
                  onEdit={() => onEditOrder(o)}
                  onDelete={() => void onDeleteOrder(o)}
                  onPrint={onPrintOrder ? () => onPrintOrder(o) : undefined}
                  onStatusChange={onStatusChange}
                />
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}
