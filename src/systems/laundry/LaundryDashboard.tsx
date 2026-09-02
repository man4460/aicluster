"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LaundryDashboardHubClient } from "@/systems/laundry/components/LaundryDashboardHubClient";
import { LaundryOrderEditModal, LaundryOrderViewModal } from "@/systems/laundry/components/LaundryOrderDetailModals";
import { LaundryOrdersPosClient } from "@/systems/laundry/components/LaundryOrdersPosClient";
import { LaundryOverviewPanel } from "@/systems/laundry/components/LaundryOverviewPanel";
import { LaundryRecordOrderModal } from "@/systems/laundry/components/LaundryRecordOrderModal";
import { LaundryOrderPrintModal } from "@/systems/laundry/components/LaundryOrderPrintModal";
import { LAUNDRY_SETTINGS_LINK_HREF } from "@/systems/laundry/laundry-module-nav";
import { useLaundryShopPrintProfile } from "@/systems/laundry/lib/use-laundry-shop-print-profile";
import { useLaundryDashboardSse } from "@/systems/laundry/lib/use-laundry-dashboard-sse";
import {
  createLaundrySessionApiRepository,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryPackage,
} from "@/systems/laundry/laundry-service";

export function LaundryDashboard({
  shopLabel,
  logoUrl,
  baseUrl,
  ownerUserId,
  recorderDisplayName,
  trialSessionId,
  isTrialSandbox,
  layoutVariant = "full",
}: {
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  ownerUserId: string;
  recorderDisplayName: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  layoutVariant?: "full" | "staff_lane";
}) {
  const repo = useMemo(() => createLaundrySessionApiRepository(), []);
  const isStaffLaneOnly = layoutVariant === "staff_lane";
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [packages, setPackages] = useState<LaundryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isStaffLaneOnly) return;
    if (searchParams.get("tab") === "qr") {
      window.location.replace(LAUNDRY_SETTINGS_LINK_HREF);
    }
  }, [isStaffLaneOnly, searchParams]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<LaundryOrder | null>(null);
  const [editOrder, setEditOrder] = useState<LaundryOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<LaundryOrder | null>(null);
  const { profile: shopPrint } = useLaundryShopPrintProfile({ shopLabel, logoUrl });

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [orderRows, packageRows] = await Promise.all([repo.listOrders(), repo.listPackages()]);
      setOrders(orderRows);
      setPackages(packageRows);
      setLoadError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ";
      setLoadError(msg);
      console.error("[LaundryDashboard] loadAll", e);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [repo]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useLaundryDashboardSse(() => {
    void loadAll({ silent: true });
  });

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
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

  const todayStats = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const todayRows = orders.filter(
      (o) => new Date(o.order_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === todayKey,
    );
    return {
      totalOrders: todayRows.length,
      waitingPickup: todayRows.filter((o) => o.status === "PENDING_PICKUP").length,
      activeOrders: todayRows.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length,
      revenue: todayRows.reduce((sum, o) => sum + o.final_price, 0),
    };
  }, [orders]);

  const laundryModals = (
    <>
      <LaundryRecordOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        packages={packages}
        repo={repo}
        recorderDisplayName={recorderDisplayName}
        onSaved={() => void loadAll()}
      />

      <LaundryOrderViewModal order={viewOrder} onClose={() => setViewOrder(null)} />

      <LaundryOrderEditModal
        order={editOrder}
        onClose={() => setEditOrder(null)}
        onSaved={() => void loadAll({ silent: true })}
        onUpdate={(id, patch) => repo.updateOrder(id, patch)}
      />
    </>
  );

  if (isStaffLaneOnly) {
    return (
      <>
        {loadError ?
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900" role="alert">
            {loadError}
          </p>
        : null}
        <LaundryDashboardHubClient
          ordersPanel={
            <LaundryOrdersPosClient
              fixedLane="pos"
              staffQrLanding
              shopLabel={shopLabel}
              logoUrl={logoUrl}
              orders={orders}
              packages={packages}
              repo={repo}
              recorderDisplayName={recorderDisplayName}
              loading={loading}
              refreshing={refreshing}
              onRefresh={refreshData}
              onViewOrder={setViewOrder}
              onEditOrder={setEditOrder}
              onDeleteOrder={deleteOrderRow}
              onStatusChange={setOrderStatus}
              onSaved={() => loadAll({ silent: true })}
            />
          }
          onlinePanel={
            <LaundryOrdersPosClient
              fixedLane="pickup"
              staffQrLanding
              shopLabel={shopLabel}
              logoUrl={logoUrl}
              orders={orders}
              packages={packages}
              repo={repo}
              recorderDisplayName={recorderDisplayName}
              loading={loading}
              refreshing={refreshing}
              onRefresh={refreshData}
              onViewOrder={setViewOrder}
              onEditOrder={setEditOrder}
              onDeleteOrder={deleteOrderRow}
              onStatusChange={setOrderStatus}
              onSaved={() => loadAll({ silent: true })}
            />
          }
        >
          <LaundryOverviewPanel
            staffQrLanding
            orders={orders}
            todayStats={todayStats}
            loading={loading}
            onViewOrder={setViewOrder}
            onEditOrder={setEditOrder}
            onDeleteOrder={deleteOrderRow}
            onStatusChange={setOrderStatus}
            onPrintOrder={setPrintOrder}
          />
        </LaundryDashboardHubClient>
        {laundryModals}
        <LaundryOrderPrintModal
          open={Boolean(printOrder)}
          order={printOrder}
          shop={shopPrint}
          onClose={() => setPrintOrder(null)}
        />
      </>
    );
  }

  return (
    <>
      {loadError ?
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900" role="alert">
          {loadError}
        </p>
      : null}
      <LaundryDashboardHubClient
        ordersPanel={
          <LaundryOrdersPosClient
            fixedLane="pos"
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            orders={orders}
            packages={packages}
            repo={repo}
            recorderDisplayName={recorderDisplayName}
            loading={loading}
            refreshing={refreshing}
            onRefresh={refreshData}
            onViewOrder={setViewOrder}
            onEditOrder={setEditOrder}
            onDeleteOrder={deleteOrderRow}
            onStatusChange={setOrderStatus}
            onSaved={() => loadAll({ silent: true })}
          />
        }
        onlinePanel={
          <LaundryOrdersPosClient
            fixedLane="pickup"
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            orders={orders}
            packages={packages}
            repo={repo}
            recorderDisplayName={recorderDisplayName}
            loading={loading}
            refreshing={refreshing}
            onRefresh={refreshData}
            onViewOrder={setViewOrder}
            onEditOrder={setEditOrder}
            onDeleteOrder={deleteOrderRow}
            onStatusChange={setOrderStatus}
            onSaved={() => loadAll({ silent: true })}
          />
        }
      >
        <LaundryOverviewPanel
          orders={orders}
          todayStats={todayStats}
          loading={loading}
          onViewOrder={setViewOrder}
          onEditOrder={setEditOrder}
          onDeleteOrder={deleteOrderRow}
          onStatusChange={setOrderStatus}
          onPrintOrder={setPrintOrder}
        />
      </LaundryDashboardHubClient>
      {laundryModals}
      <LaundryOrderPrintModal
        open={Boolean(printOrder)}
        order={printOrder}
        shop={shopPrint}
        onClose={() => setPrintOrder(null)}
      />
    </>
  );
}

