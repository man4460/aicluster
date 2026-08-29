"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import {
  BarberCostPanel,
  type BarberCostToolbarApi,
} from "@/systems/barber/components/BarberCostPanel";
import {
  fetchVillageCostCategories,
  fetchVillageCostEntries,
  villageCostPanelOps,
} from "@/systems/village/village-cost-client";
import type { BarberCostCategory, BarberCostEntry } from "@/systems/barber/barber-cost-client";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { villageBtnPrimary, villageBtnSecondary } from "@/systems/village/village-ui";

type Props = {
  baseUrl: string;
  /** ฝังในหน้าการเงิน — ไม่ห่อ VillagePageStack */
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

function IconCategory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="12" r="1" fill="currentColor" />
      <circle cx="7" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function IconExpense({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconAnnual({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  if (compact) {
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
          หมวด
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => toolbar.openRecordExpense()}
          className={cn(
            villageBtnPrimary,
            "min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4",
          )}
          aria-label="เพิ่มรายจ่าย"
        >
          <span className="sm:hidden">+</span>
          <span className="hidden sm:inline">+ เพิ่มรายจ่าย</span>
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openManageCategories()}
        className={`${villageBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
        aria-label="จัดการหมวด"
        title="จัดการหมวด"
      >
        <IconCategory className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">จัดการหมวด</span>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className={`${villageBtnPrimary} min-h-[44px] px-4 py-2.5 text-sm font-semibold`}
        aria-label="บันทึกรายจ่าย"
        title="บันทึกรายจ่าย"
      >
        <IconExpense className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">บันทึกรายจ่าย</span>
      </button>
    </div>
  );
}

export function VillageCostsClient({
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
      const [cats, ents] = await Promise.all([fetchVillageCostCategories(), fetchVillageCostEntries()]);
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
      onToolbarReady={handleToolbarReady}
      costPanelOps={villageCostPanelOps}
      formAriaIdPrefix="village-cost"
      renderWithoutOuterSection
    />
  );

  if (listOnly) return panel;

  const inner = (
    <VillagePanelCard
      title="ต้นทุน / รายจ่าย"
      description={
        <>
          <span className="sm:hidden">บันทึกต้นทุนและรายจ่าย</span>
          <span className="hidden sm:inline">บันทึกตามหมวด แนบสลิป — เปรียบเทียบกับรายรับได้ที่หน้าการเงิน</span>
        </>
      }
      action={
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <CostToolbarButtons toolbar={toolbar} busy={loading} />
          {!embedded ? (
            <Link
              href="/dashboard/village/finance?range=YEAR"
              className={`${villageBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
              aria-label="ไปหน้าการเงิน"
              title="ไปหน้าการเงิน"
            >
              <IconAnnual className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">ไปหน้าการเงิน</span>
            </Link>
          ) : null}
        </div>
      }
    >
      {panel}
    </VillagePanelCard>
  );

  if (embedded) return inner;
  return <VillagePageStack>{inner}</VillagePageStack>;
}
