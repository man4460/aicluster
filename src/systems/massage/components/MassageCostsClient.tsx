"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import {
  fetchMassageCostCategories,
  fetchMassageCostEntries,
  type MassageCostCategory,
  type MassageCostEntry,
} from "@/systems/massage/MassageCostClient";
import {
  MassageCostPanel,
  type MassageCostToolbarApi,
} from "@/systems/massage/components/MassageCostPanel";
import { MassageDashboardBackLink } from "@/systems/massage/components/MassageDashboardBackLink";
import {
  massageCardSurfaceRadiusClass,
  massagePageStackClass,
} from "@/systems/massage/components/massage-ui-tokens";
import { cn } from "@/lib/cn";

type Props = {
  baseUrl: string;
  /** ใช้ภายในหน้า «การเงิน» — ไม่แสดง PageHeader ซ้ำ */
  embedded?: boolean;
  /** ซ่อนแถบปุ่มด้านบน (ใช้เมื่อวางปุ่มในแถบเดียวกับแท็บ รายรับ|รายจ่าย แบบคาร์แคร์) */
  hideEmbeddedToolbar?: boolean;
  /** เรียกเมื่อ MassageCostPanel พร้อม toolbar (สำหรับยกปุ่มไปไว้ใน header รวม) */
  onToolbarReady?: (api: MassageCostToolbarApi | null) => void;
  /** แจ้งสถานะโหลดรายการ (สำหรับปิดการใช้งานปุ่มในแถบรวม) */
  onBusyChange?: (busy: boolean) => void;
};

function CostToolbarButtons({
  toolbar,
  busy,
}: {
  toolbar: MassageCostToolbarApi | null;
  busy?: boolean;
}) {
  if (!toolbar) {
    return (
      <span className="inline-flex min-h-[44px] items-center text-xs font-medium text-[#66638c]">กำลังเตรียมปุ่ม…</span>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openManageCategories()}
        className={cn(
          massageCardSurfaceRadiusClass,
          "border border-[#e8e6f4]/90 bg-gradient-to-br from-white to-[#f5f3ff]/70 px-3 py-2.5 text-sm font-semibold text-[#2e2a58] shadow-sm transition hover:from-[#faf9ff] hover:to-white disabled:opacity-60",
        )}
      >
        จัดการหมวด
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className={cn(
          "app-btn-primary min-h-[44px] shadow-md shadow-indigo-600/15",
          massageCardSurfaceRadiusClass,
          "px-4 py-2.5 text-sm font-semibold disabled:opacity-60",
        )}
      >
        บันทึกรายจ่าย
      </button>
    </div>
  );
}

/** ปุ่มคู่แบบคาร์แคร์ — อยู่ซ้ายของแท็บ รายรับ|รายจ่าย */
export function MassageCostToolbarInline({
  toolbar,
  busy,
}: {
  toolbar: MassageCostToolbarApi | null;
  busy?: boolean;
}) {
  if (!toolbar) {
    return (
      <span className="mr-1.5 inline-flex min-h-8 items-center border-r border-[#e4e0f5]/90 pr-1.5 text-[10px] font-medium text-slate-500">
        กำลังโหลด…
      </span>
    );
  }
  return (
    <div className="mr-1.5 flex items-center gap-1 border-r border-[#e4e0f5]/90 pr-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openManageCategories()}
        className="inline-flex h-8 items-center gap-1.5 rounded-[1.25rem] bg-gradient-to-br from-white to-[#eef2ff]/90 px-2.5 text-xs font-bold text-[#3730a3] shadow-sm ring-1 ring-indigo-100/80 hover:from-[#f8f7ff] hover:to-white disabled:opacity-50"
        aria-label="จัดการหมวด"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span className="hidden sm:inline">หมวด</span>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className="inline-flex h-8 items-center gap-1.5 rounded-[1.25rem] bg-gradient-to-br from-[#6366f1] to-[#4f46e5] px-2.5 text-xs font-bold text-white shadow-sm ring-1 ring-indigo-400/40 hover:from-[#5b61ff] hover:to-[#4338ca] disabled:opacity-50"
        aria-label="บันทึกรายจ่าย"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="hidden sm:inline">เพิ่มรายการ</span>
      </button>
    </div>
  );
}

export function MassageCostsClient({
  baseUrl,
  embedded = false,
  hideEmbeddedToolbar = false,
  onToolbarReady,
  onBusyChange,
}: Props) {
  const [categories, setCategories] = useState<MassageCostCategory[]>([]);
  const [entries, setEntries] = useState<MassageCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<MassageCostToolbarApi | null>(null);

  const handleToolbarReady = useCallback(
    (api: MassageCostToolbarApi | null) => {
      setToolbar(api);
      onToolbarReady?.(api);
    },
    [onToolbarReady],
  );

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [cats, ents] = await Promise.all([fetchMassageCostCategories(), fetchMassageCostEntries()]);
      setCategories(cats);
      setEntries(ents);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setCategories([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onBusyChange?.(loading);
  }, [loading, onBusyChange]);

  const panel = (
    <MassageCostPanel
      baseUrl={baseUrl}
      categories={categories}
      entries={entries}
      onRefresh={load}
      listLoading={loading}
      fetchError={err}
      onToolbarReady={handleToolbarReady}
    />
  );

  if (embedded) {
    if (hideEmbeddedToolbar) {
      return <div className="min-w-0">{panel}</div>;
    }
    return (
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CostToolbarButtons toolbar={toolbar} busy={loading} />
        </div>
        {panel}
      </div>
    );
  }

  return (
    <div className={massagePageStackClass}>
      <PageHeader
        compact
        title="ต้นทุน / รายจ่าย"
        description="บันทึกตามหมวด แนบสลิป — ยอดรวมในกราฟหน้ายอดขาย"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CostToolbarButtons toolbar={toolbar} busy={loading} />
            <MassageDashboardBackLink />
          </div>
        }
      />
      {panel}
    </div>
  );
}
