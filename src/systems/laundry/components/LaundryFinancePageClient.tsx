"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LaundryFinancePanel } from "@/systems/laundry/components/LaundryFinancePanel";
import { LaundryOrderPrintModal } from "@/systems/laundry/components/LaundryOrderPrintModal";
import { LaundryOrderEditModal, LaundryOrderViewModal } from "@/systems/laundry/components/LaundryOrderDetailModals";
import { useLaundryShopPrintProfile } from "@/systems/laundry/lib/use-laundry-shop-print-profile";
import {
  createLaundrySessionApiRepository,
  type LaundryCostCategory,
  type LaundryCostEntry,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryRevenueCategory,
  type LaundryRevenueEntry,
} from "@/systems/laundry/laundry-service";
import { laundryMutedLoadingNoticeClass } from "@/systems/laundry/lib/ui-tokens";

export function LaundryFinancePageClient({ baseUrl }: { baseUrl: string }) {
  const repo = useMemo(() => createLaundrySessionApiRepository(), []);
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [costCategories, setCostCategories] = useState<LaundryCostCategory[]>([]);
  const [costEntries, setCostEntries] = useState<LaundryCostEntry[]>([]);
  const [revenueCategories, setRevenueCategories] = useState<LaundryRevenueCategory[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<LaundryRevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<LaundryOrder | null>(null);
  const [editOrder, setEditOrder] = useState<LaundryOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<LaundryOrder | null>(null);
  const { profile: shopPrint } = useLaundryShopPrintProfile();

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [orderRows, catRows, costRows, revCatRows, revEntryRows] = await Promise.all([
        repo.listOrders(),
        repo.listCostCategories(),
        repo.listCostEntries(),
        repo.listRevenueCategories(),
        repo.listRevenueEntries(),
      ]);
      setOrders(orderRows);
      setCostCategories(catRows);
      setCostEntries(costRows);
      setRevenueCategories(revCatRows);
      setRevenueEntries(revEntryRows);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function setOrderStatus(id: number, status: LaundryOrderStatus) {
    await repo.updateOrder(id, { status });
    await loadAll({ silent: true });
  }

  async function deleteOrderRow(o: LaundryOrder) {
    if (!window.confirm(`ลบรายการ #${o.id} (${o.customer_name}) ?`)) return;
    await repo.deleteOrder(o.id);
    setViewOrder((v) => (v?.id === o.id ? null : v));
    setEditOrder((v) => (v?.id === o.id ? null : v));
    await loadAll({ silent: true });
  }

  if (loading) return <p className={laundryMutedLoadingNoticeClass}>กำลังโหลด…</p>;

  return (
    <>
      <LaundryFinancePanel
        orders={orders}
        costCategories={costCategories}
        costEntries={costEntries}
        revenueCategories={revenueCategories}
        revenueEntries={revenueEntries}
        repo={repo}
        baseUrl={baseUrl}
        onRefresh={async () => {
          await loadAll({ silent: true });
        }}
        onViewOrder={setViewOrder}
        onEditOrder={setEditOrder}
        onDeleteOrder={deleteOrderRow}
        onStatusChange={setOrderStatus}
        onPrintOrder={setPrintOrder}
      />
      <LaundryOrderPrintModal
        open={Boolean(printOrder)}
        order={printOrder}
        shop={shopPrint}
        onClose={() => setPrintOrder(null)}
      />
      <LaundryOrderViewModal order={viewOrder} onClose={() => setViewOrder(null)} />
      <LaundryOrderEditModal
        order={editOrder}
        onClose={() => setEditOrder(null)}
        packages={[]}
        repo={repo}
        onSaved={() => void loadAll({ silent: true })}
        onUpdate={(id, patch) => repo.updateOrder(id, patch)}
      />
    </>
  );
}
