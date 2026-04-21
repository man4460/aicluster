"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopQrTemplatePageBgClass } from "@/lib/shop-qr-template-theme";
import { cn } from "@/lib/cn";
import { BuildingPosCustomerOrderClient } from "@/systems/building-pos/BuildingPosCustomerOrderClient";
import { BuildingPosOpenTablesPanel } from "@/systems/building-pos/BuildingPosSalesAnalytics";
import {
  createBuildingPosStaffApiRepository,
  type PosMenuItem,
  type PosOrder,
} from "@/systems/building-pos/building-pos-service";

type View = "tables" | "order";

export function BuildingPosStaffClient({
  ownerId,
  trialSessionId,
  staffKey,
}: {
  ownerId: string;
  trialSessionId: string;
  staffKey: string;
}) {
  const staffAuth = useMemo(
    () => ({ ownerId, trialSessionId, k: staffKey }),
    [ownerId, trialSessionId, staffKey],
  );
  const repo = useMemo(
    () => createBuildingPosStaffApiRepository(ownerId, trialSessionId, staffKey),
    [ownerId, trialSessionId, staffKey],
  );

  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [shopLabel, setShopLabel] = useState("POS ร้านอาหาร");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [paymentChannelsNote, setPaymentChannelsNote] = useState<string | null>(null);
  const [view, setView] = useState<View>("tables");
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    const list = await repo.listOrders();
    setOrders(list);
  }, [repo]);

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  }, [loadOrders]);

  useEffect(() => {
    const q = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    void fetch(`/api/building-pos/staff/bootstrap?${q}`)
      .then(async (r) => {
        if (!r.ok) {
          setBootOk(false);
          return;
        }
        const d = (await r.json()) as {
          ok?: boolean;
          shopLabel?: string;
          logoUrl?: string | null;
          paymentChannelsNote?: string | null;
        };
        setBootOk(d.ok === true);
        if (d.shopLabel) setShopLabel(d.shopLabel);
        setLogoUrl(d.logoUrl ?? null);
        setPaymentChannelsNote(d.paymentChannelsNote ?? null);
      })
      .catch(() => setBootOk(false));
  }, [ownerId, trialSessionId, staffKey]);

  useEffect(() => {
    if (bootOk !== true) return;
    void loadOrders();
  }, [bootOk, loadOrders]);

  useEffect(() => {
    if (bootOk !== true) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void loadOrders();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [bootOk, loadOrders]);

  useEffect(() => {
    if (bootOk !== true) return;
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void loadOrders();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [bootOk, loadOrders]);

  useEffect(() => {
    if (bootOk !== true) return;
    const p = new URLSearchParams({ ownerId });
    if (trialSessionId) p.set("t", trialSessionId);
    void fetch(`/api/building-pos/public/menu?${p}`)
      .then(async (r) => {
        const d = (await r.json()) as { menu_items?: PosMenuItem[] };
        setMenuItems(d.menu_items ?? []);
      })
      .catch(() => setMenuItems([]));
  }, [bootOk, ownerId, trialSessionId]);

  const menuImageById = useMemo(() => {
    const m = new Map<number, string>();
    menuItems.forEach((x) => m.set(x.id, x.image_url ?? ""));
    return m;
  }, [menuItems]);

  const moveOrderStatus = useCallback(
    async (id: number, status: PosOrder["status"]) => {
      await repo.updateOrder(id, { status });
      await loadOrders();
    },
    [repo, loadOrders],
  );

  const saveSlip = useCallback(
    async (orderId: number, imageUrl: string) => {
      await repo.updateOrder(orderId, { payment_slip_url: imageUrl });
      await loadOrders();
    },
    [repo, loadOrders],
  );

  if (bootOk === null) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center bg-[#faf9ff] text-[#66638c]">กำลังโหลด…</div>
    );
  }

  if (bootOk === false) {
    return (
      <div className={cn(shopQrTemplatePageBgClass, "min-h-[100dvh] px-4 py-16")}>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-lg font-bold text-slate-900">ลิงก์ไม่ถูกต้อง</h1>
          <p className="mt-2 text-sm text-slate-600">ขอลิงก์หรือ QR ล่าสุดจากเจ้าของร้าน</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(shopQrTemplatePageBgClass, "min-h-[100dvh] pb-24")}>
      <header className="sticky top-0 z-30 border-b border-[#e8e6fc] bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#4d47b6]">พนักงานเสิร์ฟ</p>
            <p className="truncate text-sm font-bold text-[#2e2a58]">{shopLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshOrders()}
            disabled={refreshing}
            className="shrink-0 rounded-xl border border-[#4d47b6]/30 bg-[#ecebff] px-3 py-2 text-xs font-semibold text-[#4d47b6] touch-manipulation"
          >
            {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
          </button>
        </div>
        <nav className="mx-auto mt-3 flex max-w-lg gap-2">
          <button
            type="button"
            onClick={() => setView("tables")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold touch-manipulation ${
              view === "tables" ? "bg-[#4d47b6] text-white" : "bg-white text-[#4d47b6] ring-1 ring-[#e1e3ff]"
            }`}
          >
            โต๊ะ / บิล
          </button>
          <button
            type="button"
            onClick={() => setView("order")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold touch-manipulation ${
              view === "order" ? "bg-[#4d47b6] text-white" : "bg-white text-[#4d47b6] ring-1 ring-[#e1e3ff]"
            }`}
          >
            สั่งเพิ่ม
          </button>
        </nav>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {view === "tables" ?
          <BuildingPosOpenTablesPanel
            staffAuth={staffAuth}
            orders={orders}
            menuImageById={menuImageById}
            onOrderStatusChange={(id, st) => void moveOrderStatus(id, st)}
            onOrderPaymentSlipSaved={(id, url) => saveSlip(id, url)}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            paymentChannelsNote={paymentChannelsNote}
          />
        : <BuildingPosCustomerOrderClient
            ownerId={ownerId}
            trialSessionId={trialSessionId}
            variant="staff"
            orderNoteTag="พนักงานเสิร์ฟ"
            onOrderSuccess={() => {
              setView("tables");
              void loadOrders();
            }}
          />
        }
      </div>
    </div>
  );
}
