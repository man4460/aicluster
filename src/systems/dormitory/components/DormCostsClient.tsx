"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { bangkokDateKey } from "@/lib/time/bangkok";
import Link from "next/link";
import {
  BarberCostPanel,
  type BarberCostToolbarApi,
} from "@/systems/barber/components/BarberCostPanel";
import {
  dormCostPanelOps,
  fetchDormCostCategories,
  fetchDormCostEntries,
} from "@/systems/dormitory/dorm-cost-client";
import type { BarberCostCategory, BarberCostEntry } from "@/systems/barber/barber-cost-client";
import { DORMITORY_FINANCE_HREF } from "@/systems/dormitory/dormitory-module-nav";
import { DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { dormBtnPrimary, dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";

type Props = {
  baseUrl: string;
  /** ฝังในหน้าการเงิน — ไม่ห่อ DormPageStack */
  embedded?: boolean;
  /** โหมดรายการอย่างเดียว — หัวการ์ด/toolbar อยู่ที่ shell หลัก */
  listOnly?: boolean;
  refreshSignal?: number;
  onToolbarReady?: (toolbar: BarberCostToolbarApi | null) => void;
  onLoadingChange?: (loading: boolean) => void;
  onCategoriesReady?: (categories: BarberCostCategory[]) => void;
  filterCategoryId?: number | "all";
  dateFrom?: string;
  dateTo?: string;
};

export function CostToolbarButtons({
  toolbar,
  busy,
  compact = false,
}: {
  toolbar: BarberCostToolbarApi | null;
  busy?: boolean;
  compact?: boolean;
}) {
  if (!toolbar) {
    return (
      <span className="inline-flex min-h-[40px] items-center text-xs font-medium text-[#66638c]">
        กำลังเตรียมปุ่ม…
      </span>
    );
  }
  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openManageCategories()}
        className={cn(
          appTemplateOutlineButtonClass,
          "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
        )}
        aria-label="จัดการหมวดหมู่รายจ่าย"
        title="หมวดหมู่"
      >
        {compact ? "หมวด" : "หมวดหมู่"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className={cn(dormBtnPrimary, "min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4")}
        aria-label="เพิ่มรายจ่าย"
      >
        <span className="sm:hidden">+</span>
        <span className="hidden sm:inline">+ เพิ่มรายจ่าย</span>
      </button>
    </div>
  );
}

export function DormCostsClient({
  baseUrl,
  embedded = false,
  listOnly = false,
  refreshSignal = 0,
  onToolbarReady,
  onLoadingChange,
  onCategoriesReady,
  filterCategoryId = "all",
  dateFrom,
  dateTo,
}: Props) {
  const [categories, setCategories] = useState<BarberCostCategory[]>([]);
  const [entries, setEntries] = useState<BarberCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<BarberCostToolbarApi | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const [cats, ents] = await Promise.all([fetchDormCostCategories(), fetchDormCostEntries()]);
      setCategories(cats);
      setEntries(ents);
      onCategoriesReady?.(cats);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setCategories([]);
      setEntries([]);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange, onCategoriesReady]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  const handleToolbarReady = useCallback(
    (api: BarberCostToolbarApi | null) => {
      setToolbar(api);
      onToolbarReady?.(api);
    },
    [onToolbarReady],
  );

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterCategoryId !== "all" && e.category_id !== filterCategoryId) return false;
      const ymd = bangkokDateKey(new Date(e.spent_at));
      if (dateFrom && ymd < dateFrom) return false;
      if (dateTo && ymd > dateTo) return false;
      return true;
    });
  }, [entries, filterCategoryId, dateFrom, dateTo]);

  const panel = (
    <BarberCostPanel
      baseUrl={baseUrl}
      categories={categories}
      entries={filteredEntries}
      onRefresh={load}
      listLoading={loading}
      fetchError={err}
      onToolbarReady={listOnly ? handleToolbarReady : setToolbar}
      costPanelOps={dormCostPanelOps}
      formAriaIdPrefix="dorm-cost"
      renderWithoutOuterSection
    />
  );

  if (listOnly) return panel;

  const inner = (
    <>
      <DormPanelCard
        title="ต้นทุน / รายจ่าย"
        description="บันทึกตามหมวด แนบสลิป — เปรียบเทียบกับรายรับได้ที่แท็บประวัติ / รายรับ"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CostToolbarButtons toolbar={toolbar} busy={loading} />
            {!embedded ? (
              <Link
                href={`${DORMITORY_FINANCE_HREF}?panel=history`}
                className={`${dormBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
              >
                ไปหน้าประวัติ
              </Link>
            ) : null}
          </div>
        }
      >
        {panel}
      </DormPanelCard>
    </>
  );

  if (embedded) return inner;
  return <DormPageStack>{inner}</DormPageStack>;
}
