"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import {
  createBuildingPosSessionApiRepository,
  type PosIngredient,
  type PosPurchaseOrder,
} from "@/systems/building-pos/building-pos-service";
import { BuildingPosIngredientsPanel, BuildingPosPurchasesPanel } from "@/systems/building-pos/components/BuildingPosInventoryPanels";
import { BuildingPosDashboardBackLink } from "@/systems/building-pos/components/BuildingPosDashboardBackLink";
import { BuildingPosUnifiedMenuBar } from "@/systems/building-pos/components/BuildingPosUnifiedMenuBar";

export function BuildingPosCostsClient() {
  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const [ingredients, setIngredients] = useState<PosIngredient[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PosPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [ing, po] = await Promise.all([repo.listIngredients(), repo.listPurchaseOrders()]);
      setIngredients(ing);
      setPurchaseOrders(po);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setIngredients([]);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <div className="min-w-0 space-y-5">
      <BuildingPosUnifiedMenuBar onRefresh={() => void handleRefresh()} refreshing={refreshing} />

      <PageHeader
        compact
        title="ต้นทุน / รายจ่าย"
        description="จัดการรายการของ บันทึกรายจ่ายต่อครั้ง แนบสลิป — ราคาซื้อล่าสุดใช้คำนวณต้นทุนตามสูตรเมนู"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <BuildingPosDashboardBackLink />
          </div>
        }
      />

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{err}</p>
      ) : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />
      ) : (
        <div className="min-w-0 space-y-5">
          <BuildingPosIngredientsPanel ingredients={ingredients} onChanged={() => void load()} />
          <BuildingPosPurchasesPanel
            purchaseOrders={purchaseOrders}
            ingredients={ingredients}
            onChanged={() => void load()}
          />
        </div>
      )}
    </div>
  );
}
