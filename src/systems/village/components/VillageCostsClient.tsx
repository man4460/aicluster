"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { VillageFinanceQuickTabs } from "@/systems/village/components/VillageFinanceQuickTabs";
import { villageBtnPrimary, villageBtnSecondary } from "@/systems/village/village-ui";

type Props = {
  baseUrl: string;
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

function CostToolbarButtons({
  toolbar,
  busy,
}: {
  toolbar: BarberCostToolbarApi | null;
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

export function VillageCostsClient({ baseUrl }: Props) {
  const [categories, setCategories] = useState<BarberCostCategory[]>([]);
  const [entries, setEntries] = useState<BarberCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<BarberCostToolbarApi | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [cats, ents] = await Promise.all([fetchVillageCostCategories(), fetchVillageCostEntries()]);
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

  return (
    <VillagePageStack>
      <VillageFinanceQuickTabs />
      <VillagePanelCard
        title="ต้นทุน / รายจ่าย"
        description={
          <>
            <span className="sm:hidden">บันทึกต้นทุนและรายจ่าย</span>
            <span className="hidden sm:inline">บันทึกตามหมวด แนบสลิป — เปรียบเทียบกับรายรับค่าส่วนกลางได้ที่หน้ารายปี</span>
          </>
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CostToolbarButtons toolbar={toolbar} busy={loading} />
            <Link
              href="/dashboard/village/annual"
              className={`${villageBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
              aria-label="ไปหน้ารายปี"
              title="ไปหน้ารายปี"
            >
              <IconAnnual className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">ไปหน้ารายปี</span>
            </Link>
          </div>
        }
      >
        <BarberCostPanel
          baseUrl={baseUrl}
          categories={categories}
          entries={entries}
          onRefresh={load}
          listLoading={loading}
          fetchError={err}
          onToolbarReady={setToolbar}
          costPanelOps={villageCostPanelOps}
          formAriaIdPrefix="village-cost"
          renderWithoutOuterSection
        />
      </VillagePanelCard>
    </VillagePageStack>
  );
}
