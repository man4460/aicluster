"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBuildingPosSessionApiRepository,
  type PosCategory,
  type PosMenuItem,
  type PosOrder,
} from "@/systems/building-pos/building-pos-service";
import { BuildingPosUnifiedMenuBar } from "@/systems/building-pos/components/BuildingPosUnifiedMenuBar";
import { AppImageLightbox, useAppImageLightbox } from "@/components/app-templates";
import { BuildingPosSalesHistoryPanel } from "@/systems/building-pos/BuildingPosSalesAnalytics";

export function BuildingPosSalesHistoryPageClient() {
  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const slipLightbox = useAppImageLightbox();

  const loadOrders = useCallback(async () => {
    setLoadError(null);
    try {
      const o = await repo.listOrders();
      setOrders(o);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "โหลดออเดอร์ไม่สำเร็จ");
    }
  }, [repo]);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [c, m, o] = await Promise.all([repo.listCategories(), repo.listMenuItems(), repo.listOrders()]);
      setCategories(c);
      setMenuItems(m);
      setOrders(o);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }, [repo]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function onOrderStatusChange(id: number, status: PosOrder["status"]) {
    await repo.updateOrder(id, { status });
    await loadOrders();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <BuildingPosUnifiedMenuBar onRefresh={() => void handleRefresh()} refreshing={refreshing} />
      {loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</p>
      ) : null}
      <BuildingPosSalesHistoryPanel
        orders={orders}
        categories={categories}
        menuItems={menuItems}
        onOrderStatusChange={(id, s) => void onOrderStatusChange(id, s)}
        onSlipImageOpen={(url) => slipLightbox.open(url)}
      />
      <AppImageLightbox src={slipLightbox.src} alt="สลิปโอน" onClose={slipLightbox.close} />
    </div>
  );
}
