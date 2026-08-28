"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DORMITORY_FINANCE_HREF } from "@/systems/dormitory/dormitory-module-nav";
import { cn } from "@/lib/cn";
import { formatPeriodMonthLabelStable } from "@/lib/dormitory/format-display-stable";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { dormFilterChipClass, dormListRowCardWarnClass, dormSegmentShellClass } from "@/systems/dormitory/dorm-ui-tokens";

export type DormOverdueDashboardRow = {
  roomId: string;
  roomNumber: string;
  tenantId: string;
  tenantName: string;
  month: string;
  balance: number;
};

function monthTabClass(active: boolean) {
  return cn(
    "inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold sm:text-sm",
    dormFilterChipClass(active),
  );
}

function OverdueRowList({
  rows,
  roomDetailHref,
  onRoomAction,
}: {
  rows: DormOverdueDashboardRow[];
  roomDetailHref?: (roomId: string, month: string) => string;
  onRoomAction?: (roomId: string, month: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-amber-200/80 bg-amber-50/40 px-4 py-8 text-center text-sm font-medium text-amber-900/80">
        ไม่มีรายการค้างในงวดนี้
      </p>
    );
  }

  return (
    <>
      <ul className="grid list-none gap-2 md:hidden">
        {rows.map((row) => (
          <li key={`${row.tenantId}-${row.month}`} className={dormListRowCardWarnClass}>
            <div className="flex items-start justify-between gap-2 pt-0.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-amber-950">{row.tenantName}</p>
                <p className="mt-0.5 text-[11px] text-amber-900/80">
                  ห้อง <span className="font-bold tabular-nums">{row.roomNumber}</span>
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums text-red-700">
                {row.balance.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
              </p>
            </div>
            {onRoomAction ? (
              <button
                type="button"
                onClick={() => onRoomAction(row.roomId, row.month)}
                className="mt-2 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#5b61ff] py-2 text-center text-xs font-bold text-white shadow-sm active:scale-[0.99]"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ดำเนินการ
              </button>
            ) : (
            <Link
              href={
                roomDetailHref
                  ? roomDetailHref(row.roomId, row.month)
                  : `/dashboard/dormitory/rooms/${row.roomId}?month=${encodeURIComponent(row.month)}`
              }
              className="mt-2 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#5b61ff] py-2 text-center text-xs font-bold text-white shadow-sm active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ดำเนินการ
            </Link>
            )}
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-amber-100/90 bg-white/95 shadow-inner md:block [-webkit-overflow-scrolling:touch]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-amber-50/90 text-[11px] font-bold text-amber-900/75">
            <tr>
              <th className="whitespace-nowrap px-3 py-2">ผู้เข้าพัก</th>
              <th className="whitespace-nowrap px-3 py-2">ห้อง</th>
              <th className="whitespace-nowrap px-3 py-2 text-right">ค้าง (บาท)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.tenantId}-${row.month}`} className="text-slate-800">
                <td className="px-3 py-2 font-medium">{row.tenantName}</td>
                <td className="px-3 py-2 tabular-nums">{row.roomNumber}</td>
                <td className="px-3 py-2 text-right tabular-nums text-red-700">
                  {row.balance.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2">
                  {onRoomAction ? (
                    <button
                      type="button"
                      onClick={() => onRoomAction(row.roomId, row.month)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0000BF]/10 px-2.5 py-1.5 text-xs font-bold text-[#0000BF] hover:bg-[#0000BF]/15"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      ดำเนินการ
                    </button>
                  ) : (
                  <Link
                    href={
                      roomDetailHref
                        ? roomDetailHref(row.roomId, row.month)
                        : `/dashboard/dormitory/rooms/${row.roomId}?month=${encodeURIComponent(row.month)}`
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0000BF]/10 px-2.5 py-1.5 text-xs font-bold text-[#0000BF] hover:bg-[#0000BF]/15"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    ดำเนินการ
                  </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function DormOverdueDashboardPanel({
  rows,
  roomDetailHref,
  onRoomAction,
  hideFinanceLink = false,
}: {
  rows: DormOverdueDashboardRow[];
  roomDetailHref?: (roomId: string, month: string) => string;
  onRoomAction?: (roomId: string, month: string) => void;
  hideFinanceLink?: boolean;
}) {
  const months = useMemo(() => {
    const set = new Set(rows.map((r) => r.month));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const countsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.month, (map.get(row.month) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => months[0] ?? "");

  useEffect(() => {
    if (months.length === 0) {
      setSelectedMonth("");
      return;
    }
    if (!months.includes(selectedMonth)) {
      setSelectedMonth(months[0]!);
    }
  }, [months, selectedMonth]);

  const filteredRows = useMemo(
    () => rows.filter((r) => r.month === selectedMonth),
    [rows, selectedMonth],
  );

  const monthTotal = useMemo(
    () => filteredRows.reduce((sum, row) => sum + row.balance, 0),
    [filteredRows],
  );

  if (rows.length === 0) {
    return <p className="text-center text-sm font-medium text-emerald-700">ไม่มีรายการค้างจากงวดที่ผ่านมา</p>;
  }

  const tabId = (month: string) => `dorm-overdue-tab-${month.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const panelId = (month: string) => `dorm-overdue-panel-${month.replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <div className="space-y-3">
      <nav
        aria-label="เลือกงวดค้างชำระ"
        role="tablist"
        className={cn(dormSegmentShellClass, "flex flex-wrap gap-1")}
      >
        {months.map((month) => {
          const active = month === selectedMonth;
          const count = countsByMonth.get(month) ?? 0;
          return (
            <button
              key={month}
              type="button"
              role="tab"
              id={tabId(month)}
              aria-selected={active}
              aria-controls={panelId(month)}
              className={monthTabClass(active)}
              onClick={() => setSelectedMonth(month)}
            >
              <span>{formatPeriodMonthLabelStable(month)}</span>
              <span className={cn("tabular-nums text-[10px] font-black sm:text-xs", active ? "text-white/90" : "text-[#66638c]")}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100/80 bg-amber-50/50 px-3 py-2 text-xs text-amber-950 sm:text-sm">
        <p>
          งวด <span className="font-bold">{formatPeriodMonthLabelStable(selectedMonth)}</span>
          <span className="mx-1.5 text-amber-400" aria-hidden>
            ·
          </span>
          <span className="font-semibold tabular-nums">{filteredRows.length}</span> รายการ
        </p>
        <p className="font-bold tabular-nums text-red-700">
          รวม {monthTotal.toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท
        </p>
      </div>

      <div role="tabpanel" id={panelId(selectedMonth)} aria-labelledby={tabId(selectedMonth)}>
        <OverdueRowList rows={filteredRows} roomDetailHref={roomDetailHref} onRoomAction={onRoomAction} />
      </div>

      {hideFinanceLink ? null : (
      <div className="flex justify-end pt-1">
        <Link href={DORMITORY_FINANCE_HREF} className={cn(dormBtnSecondary, "inline-flex gap-1.5")}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
            <path d="M3 4v3h3M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          ดูประวัติทั้งหมด
        </Link>
      </div>
      )}
    </div>
  );
}
