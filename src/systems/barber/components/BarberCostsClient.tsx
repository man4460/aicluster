"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import {
  fetchBarberCostCategories,
  fetchBarberCostEntries,
  type BarberCostCategory,
  type BarberCostEntry,
} from "@/systems/barber/barber-cost-client";
import {
  BarberCostPanel,
  type BarberCostToolbarApi,
} from "@/systems/barber/components/BarberCostPanel";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

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
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        จัดการหมวด
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => toolbar.openRecordExpense()}
        className="app-btn-primary min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        บันทึกรายจ่าย
      </button>
    </div>
  );
}

export function BarberCostsClient({ baseUrl }: Props) {
  const [categories, setCategories] = useState<BarberCostCategory[]>([]);
  const [entries, setEntries] = useState<BarberCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<BarberCostToolbarApi | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [cats, ents] = await Promise.all([fetchBarberCostCategories(), fetchBarberCostEntries()]);
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
    <div className={barberPageStackClass}>
      <PageHeader
        compact
        title="ต้นทุน / รายจ่าย"
        description="บันทึกตามหมวด แนบสลิป — ยอดรวมในกราฟหน้ายอดขาย"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <CostToolbarButtons toolbar={toolbar} busy={loading} />
            <BarberDashboardBackLink />
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
      />
    </div>
  );
}
