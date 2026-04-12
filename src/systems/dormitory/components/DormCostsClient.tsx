"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
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
import { DormPageStack } from "@/systems/dormitory/components/DormPageChrome";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";

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
        className={`${dormBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
      >
        จัดการหมวด
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className="min-h-[44px] rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        บันทึกรายจ่าย
      </button>
    </div>
  );
}

export function DormCostsClient({ baseUrl }: Props) {
  const [categories, setCategories] = useState<BarberCostCategory[]>([]);
  const [entries, setEntries] = useState<BarberCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<BarberCostToolbarApi | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [cats, ents] = await Promise.all([fetchDormCostCategories(), fetchDormCostEntries()]);
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
    <DormPageStack>
      <PageHeader
        compact
        title="ต้นทุน / รายจ่าย"
        description="บันทึกตามหมวด แนบสลิป — เปรียบเทียบกับรายรับได้ที่เมนูประวัติ"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CostToolbarButtons toolbar={toolbar} busy={loading} />
            <Link
              href="/dashboard/dormitory/history"
              className={`${dormBtnSecondary} min-h-[44px] px-3 py-2.5 text-sm font-semibold`}
            >
              ไปหน้าประวัติ
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
        costPanelOps={dormCostPanelOps}
        formAriaIdPrefix="dorm-cost"
      />
    </DormPageStack>
  );
}
