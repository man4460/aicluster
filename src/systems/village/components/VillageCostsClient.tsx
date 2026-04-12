"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
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
import { VillagePageStack } from "@/systems/village/components/VillagePageChrome";
import { villageBtnPrimary, villageBtnSecondary } from "@/systems/village/village-ui";

type Props = {
  baseUrl: string;
};

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
      >
        จัดการหมวด
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className={`${villageBtnPrimary} min-h-[44px] px-4 py-2.5 text-sm font-semibold`}
      >
        บันทึกรายจ่าย
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
      <PageHeader
        compact
        title="ต้นทุน / รายจ่าย"
        description="บันทึกตามหมวด แนบสลิป — เปรียบเทียบกับรายรับค่าส่วนกลางได้ที่หน้ารายปี"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CostToolbarButtons toolbar={toolbar} busy={loading} />
            <Link
              href="/dashboard/village/annual"
              className={`${villageBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
            >
              ไปหน้ารายปี
            </Link>
          </div>
        }
      />
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
      />
    </VillagePageStack>
  );
}
