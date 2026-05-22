"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { parkingField } from "@/systems/parking/parking-ui";
import { parkingValetCardClass } from "@/systems/parking/parking-valet-ui";

const HISTORY_PATH = "/dashboard/parking/history";

function filterActiveCount(q: string, status: string, from: string, to: string): number {
  let n = 0;
  if (q.trim()) n += 1;
  if (status && status !== "ALL") n += 1;
  if (from.trim()) n += 1;
  if (to.trim()) n += 1;
  return n;
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-6.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ParkingHistoryFilterSection({
  q,
  status,
  from,
  to,
}: {
  q: string;
  status: string;
  from: string;
  to: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeFilters = useMemo(() => filterActiveCount(q, status, from, to), [q, status, from, to]);

  return (
    <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
      <AppSectionHeader
        tone="slate"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        title="ประวัติการใช้บริการ"
        description="สืบค้นตามทะเบียน ช่วงเวลาเช็คอิน และสถานะ"
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(
                "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl border sm:hidden",
                activeFilters > 0
                  ? "border-[#5b61ff]/40 bg-[#eef0ff] text-[#5b61ff] ring-2 ring-[#5b61ff]/25"
                  : "border-white/60 bg-white/80 text-[#4d47b6]",
              )}
              aria-label="เปิดตัวกรอง"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <FilterIcon className="h-5 w-5" />
              {activeFilters > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#5b61ff] px-1 text-[10px] font-bold leading-none text-white">
                  {activeFilters > 9 ? "9+" : activeFilters}
                </span>
              ) : null}
            </button>
            <Link
              href="/dashboard/parking"
              aria-label="กลับภาพรวมลานจอด"
              title="ภาพรวม"
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-4 text-sm font-semibold sm:min-w-0",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="h-5 w-5 sm:hidden"
                aria-hidden
              >
                <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
              </svg>
              <span className="hidden sm:inline">← ภาพรวม</span>
            </Link>
          </div>
        }
      />

      <form
        method="get"
        action={HISTORY_PATH}
        className={cn("hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4", parkingValetCardClass)}
      >
        <div>
          <label htmlFor="parking-h-q-desk" className="block text-xs font-semibold text-[#5f5a8a]">
            ทะเบียน
          </label>
          <input
            id="parking-h-q-desk"
            name="q"
            defaultValue={q}
            className={`${parkingField} mt-1`}
            placeholder="ค้นหา"
          />
        </div>
        <div>
          <label htmlFor="parking-h-status-desk" className="block text-xs font-semibold text-[#5f5a8a]">
            สถานะ
          </label>
          <select
            id="parking-h-status-desk"
            name="status"
            defaultValue={status}
            className={`${parkingField} mt-1`}
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="ACTIVE">กำลังจอด</option>
            <option value="COMPLETED">เสร็จแล้ว</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
        </div>
        <div>
          <label htmlFor="parking-h-from-desk" className="block text-xs font-semibold text-[#5f5a8a]">
            เช็คอินตั้งแต่
          </label>
          <input
            id="parking-h-from-desk"
            name="from"
            type="datetime-local"
            defaultValue={from}
            className={`${parkingField} mt-1`}
          />
        </div>
        <div>
          <label htmlFor="parking-h-to-desk" className="block text-xs font-semibold text-[#5f5a8a]">
            ถึง
          </label>
          <input
            id="parking-h-to-desk"
            name="to"
            type="datetime-local"
            defaultValue={to}
            className={`${parkingField} mt-1`}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="app-btn-primary app-tap-feedback rounded-2xl px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-105"
          >
            ค้นหา
          </button>
        </div>
      </form>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[200] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parking-history-filter-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#1e1b4b]/40"
            aria-label="ปิดตัวกรอง"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-3 bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+5.25rem))] flex max-h-[min(78vh,32rem)] flex-col overflow-hidden rounded-[2rem] border border-white/55 bg-[#fbfcff]/98 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 [-webkit-overflow-scrolling:touch]">
              <p id="parking-history-filter-title" className="text-base font-black tracking-tight text-[#1e1b4b]">
                กรองข้อมูล
              </p>
              <form method="get" action={HISTORY_PATH} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="parking-h-q-m" className="block text-xs font-semibold text-[#5f5a8a]">
                    ทะเบียน
                  </label>
                  <input
                    id="parking-h-q-m"
                    name="q"
                    defaultValue={q}
                    className={`${parkingField} mt-1`}
                    placeholder="ค้นหา"
                  />
                </div>
                <div>
                  <label htmlFor="parking-h-status-m" className="block text-xs font-semibold text-[#5f5a8a]">
                    สถานะ
                  </label>
                  <select
                    id="parking-h-status-m"
                    name="status"
                    defaultValue={status}
                    className={`${parkingField} mt-1`}
                  >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="ACTIVE">กำลังจอด</option>
                    <option value="COMPLETED">เสร็จแล้ว</option>
                    <option value="CANCELLED">ยกเลิก</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="parking-h-from-m" className="block text-xs font-semibold text-[#5f5a8a]">
                    เช็คอินตั้งแต่
                  </label>
                  <input
                    id="parking-h-from-m"
                    name="from"
                    type="datetime-local"
                    defaultValue={from}
                    className={`${parkingField} mt-1`}
                  />
                </div>
                <div>
                  <label htmlFor="parking-h-to-m" className="block text-xs font-semibold text-[#5f5a8a]">
                    ถึง
                  </label>
                  <input
                    id="parking-h-to-m"
                    name="to"
                    type="datetime-local"
                    defaultValue={to}
                    className={`${parkingField} mt-1`}
                  />
                </div>
                <button
                  type="submit"
                  className="app-btn-primary app-tap-feedback mt-2 w-full rounded-2xl py-3 text-sm font-bold text-white shadow-md hover:brightness-105"
                >
                  ค้นหา
                </button>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Link
                    href={HISTORY_PATH}
                    className="text-sm font-semibold text-[#4d47b6]"
                    onClick={() => setSheetOpen(false)}
                  >
                    ล้างตัวกรอง
                  </Link>
                  <button
                    type="button"
                    className="rounded-xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-[#66638c]"
                    onClick={() => setSheetOpen(false)}
                  >
                    ปิด
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </AppDashboardSection>
  );
}
