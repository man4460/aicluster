"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { BuildingPosOrderClient } from "@/systems/building-pos/BuildingPosOrderClient";
import { BuildingPosOpenTablesPanel } from "@/systems/building-pos/BuildingPosSalesAnalytics";
import {
  buildingPosNavActiveClass,
  buildingPosNavIdleClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
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
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(false);
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
          features?: { slipPrint?: boolean };
        };
        setBootOk(d.ok === true);
        setShopLabel(d.shopLabel?.trim() || "POS ร้านอาหาร");
        setLogoUrl(d.logoUrl ?? null);
        setPaymentChannelsNote(d.paymentChannelsNote ?? null);
        setSlipPrintEnabled(d.features?.slipPrint === true);
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
    async (id: number, status: PosOrder["status"], extra?: { member_phone?: string }) => {
      await repo.updateOrder(id, {
        status,
        ...(extra?.member_phone ? { member_phone: extra.member_phone } : {}),
      });
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
      <div className="flex h-dvh items-center justify-center bg-[#faf9ff] text-[#66638c]">กำลังโหลด…</div>
    );
  }

  if (bootOk === false) {
    return (
      <div className={cn(shopQrTemplatePageBgClass, "flex h-dvh items-center justify-center px-4")}>
        <div className="w-full max-w-md rounded-[1.25rem] border border-white/60 bg-white/80 p-6 text-center shadow-lg backdrop-blur-xl">
          <h1 className="text-lg font-bold text-slate-900">ลิงก์ไม่ถูกต้อง</h1>
          <p className="mt-2 text-sm text-slate-600">ขอลิงก์หรือ QR ล่าสุดจากเจ้าของร้าน</p>
        </div>
      </div>
    );
  }

  const tabBtn = (active: boolean) =>
    cn(
      "min-h-[40px] flex-1 rounded-xl px-1 py-2 text-[11px] font-black touch-manipulation transition-all active:scale-[0.98] sm:min-h-[44px] sm:rounded-2xl sm:px-2 sm:text-sm",
      "ring-1 backdrop-blur-sm",
      active ? cn(buildingPosNavActiveClass, "ring-white/55") : cn("bg-white/50 ring-white/60", buildingPosNavIdleClass),
    );

  return (
    <div
      className={cn(
        shopQrTemplatePageBgClass,
        "flex h-dvh max-h-dvh w-full flex-col overflow-hidden p-1.5 sm:p-3 md:p-4",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
          "rounded-[1.25rem] border border-white/60 bg-white/75 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl",
          "ring-1 ring-inset ring-white/50 sm:rounded-[1.5rem] md:rounded-[2rem]",
        )}
      >
        <header className="shrink-0 border-b border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-white/70 to-indigo-50/30 px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4d47b6]">พนักงาน</p>
              <p className="truncate text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">{shopLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshOrders()}
              disabled={refreshing}
              className="shrink-0 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-xs font-bold text-[#4d47b6] shadow-sm touch-manipulation ring-1 ring-[#0000BF]/15 hover:bg-white disabled:opacity-60 sm:rounded-2xl"
            >
              {refreshing ? "…" : "รีเฟรช"}
            </button>
          </div>
          <nav className="mt-2.5 flex gap-1.5 sm:mt-3 sm:gap-2" aria-label="เมนูพนักงาน">
            <button type="button" onClick={() => setView("tables")} className={tabBtn(view === "tables")}>
              โต๊ะ / บิล
            </button>
            <button type="button" onClick={() => setView("order")} className={tabBtn(view === "order")}>
              สั่งเพิ่ม
            </button>
          </nav>
        </header>

        <div
          className={cn(
            "min-h-0 flex-1",
            view === "order"
              ? "flex flex-col overflow-hidden p-2 sm:p-3 md:p-4"
              : "overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4 [-webkit-overflow-scrolling:touch]",
          )}
        >
          {view === "tables" ? (
            <BuildingPosOpenTablesPanel
              staffAuth={staffAuth}
              orders={orders}
              menuImageById={menuImageById}
              onOrderStatusChange={(id, st, extra) => void moveOrderStatus(id, st, extra)}
              onOrderPaymentSlipSaved={(id, url) => saveSlip(id, url)}
              shopLabel={shopLabel}
              logoUrl={logoUrl}
              paymentChannelsNote={paymentChannelsNote}
            />
          ) : (
            <BuildingPosOrderClient
              ownerId={ownerId}
              trialSessionId={trialSessionId}
              portalMode
              staffAuth={staffAuth}
              slipPrintEnabled={slipPrintEnabled}
              onOrderSuccess={() => {
                setView("tables");
                void loadOrders();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
