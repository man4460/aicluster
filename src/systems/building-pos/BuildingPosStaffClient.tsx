"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { BuildingPosOrderClient } from "@/systems/building-pos/BuildingPosOrderClient";
import { BuildingPosOpenTablesPanel } from "@/systems/building-pos/BuildingPosSalesAnalytics";
import { BuildingPosMobileBottomProvider } from "@/systems/building-pos/components/BuildingPosMobileBottomChrome";
import {
  buildingPosNavActiveClass,
  buildingPosNavIdleClass,
  buildingPosStaffPortalPaddingBottomClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
import {
  createBuildingPosStaffApiRepository,
  type PosMenuItem,
  type PosOrder,
} from "@/systems/building-pos/building-pos-service";

type StaffView = "order" | "tables";

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
  const [needsPin, setNeedsPin] = useState(false);
  const [shopLabel, setShopLabel] = useState("POS ร้านอาหาร");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [paymentChannelsNote, setPaymentChannelsNote] = useState<string | null>(null);
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(false);
  const [view, setView] = useState<StaffView>("order");
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const loadOrders = useCallback(async () => {
    const list = await repo.listOrders();
    setOrders(list);
  }, [repo]);

  const staffQs = useMemo(
    () => new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey }).toString(),
    [ownerId, trialSessionId, staffKey],
  );

  const runBootstrap = useCallback(async () => {
    const q = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("building-pos", ownerId);
    if (unlock) q.set("du", unlock);
    const r = await fetch(`/api/building-pos/staff/bootstrap?${q}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("building-pos", ownerId),
    });
    if (!r.ok) {
      setBootOk(false);
      setNeedsPin(false);
      return false;
    }
    const d = (await r.json()) as {
      ok?: boolean;
      requiresDailyPin?: boolean;
      unlocked?: boolean;
      shopLabel?: string;
      logoUrl?: string | null;
      paymentChannelsNote?: string | null;
      features?: { slipPrint?: boolean };
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    setShopLabel(d.shopLabel?.trim() || "POS ร้านอาหาร");
    if (d.requiresDailyPin && d.unlocked === false) {
      setNeedsPin(true);
      setBootOk(true);
      return false;
    }
    setNeedsPin(false);
    setBootOk(true);
    setLogoUrl(d.logoUrl ?? null);
    setPaymentChannelsNote(d.paymentChannelsNote ?? null);
    setSlipPrintEnabled(d.features?.slipPrint === true);
    return true;
  }, [ownerId, trialSessionId, staffKey]);

  useEffect(() => {
    void runBootstrap().catch(() => setBootOk(false));
  }, [runBootstrap]);

  useEffect(() => {
    if (bootOk !== true) return;
    void loadOrders();
  }, [bootOk, loadOrders, refreshNonce]);

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
  }, [bootOk, ownerId, trialSessionId, refreshNonce]);

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

  async function refreshPortal() {
    setRefreshing(true);
    try {
      const ok = await runBootstrap();
      if (ok) {
        setRefreshNonce((n) => n + 1);
        await loadOrders();
      }
    } catch {
      setBootOk(false);
    } finally {
      setRefreshing(false);
    }
  }

  const tabBtn = (active: boolean, compact?: boolean) =>
    cn(
      "rounded-2xl px-2.5 py-2 text-xs font-black touch-manipulation transition-all active:scale-[0.98] sm:text-sm",
      "ring-1 backdrop-blur-sm",
      compact
        ? "min-h-[40px] shrink-0 whitespace-nowrap px-3"
        : "min-h-[44px] flex-1",
      active ? cn(buildingPosNavActiveClass, "ring-white/55") : cn("bg-white/50 ring-white/60", buildingPosNavIdleClass),
    );

  const renderStaffTabs = (ariaLabel: string, opts?: { compact?: boolean }) => (
    <div
      className={cn("flex gap-1.5", opts?.compact ? "w-auto" : "w-full")}
      role="tablist"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "order"}
        className={tabBtn(view === "order", opts?.compact)}
        onClick={() => setView("order")}
      >
        ออเดอร์
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "tables"}
        className={tabBtn(view === "tables", opts?.compact)}
        onClick={() => setView("tables")}
      >
        โต๊ะ / บิล
      </button>
    </div>
  );

  if (bootOk === null) {
    return (
      <div className={cn(shopQrTemplatePageBgClass, "flex min-h-dvh items-center justify-center p-6")}>
        <p className="text-sm font-semibold text-[#66638c]">กำลังตรวจสอบลิงก์…</p>
      </div>
    );
  }

  if (bootOk === false) {
    return (
      <div className={cn(shopQrTemplatePageBgClass, "flex min-h-dvh items-center justify-center p-6")}>
        <div className="max-w-sm rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-sm">
          <p className="text-lg font-black text-[#1e1b4b]">ลิงก์ไม่ถูกต้องหรือถูกยกเลิก</p>
          <p className="mt-2 text-sm text-[#66638c]">ให้เจ้าของร้านสร้างลิงก์พนักงานใหม่จากหน้าแดชบอร์ด</p>
        </div>
      </div>
    );
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="building-pos"
        ownerId={ownerId}
        shopLabel={shopLabel}
        unlockApiPath="/api/building-pos/staff/unlock"
        staffQuery={staffQs}
        onUnlocked={() => {
          void runBootstrap().then((ok) => {
            if (ok) setRefreshNonce((n) => n + 1);
          });
        }}
      />
    );
  }

  return (
    <BuildingPosMobileBottomProvider staffFooterNav={renderStaffTabs("เมนูพนักงาน")}>
      <div className={cn(shopQrTemplatePageBgClass, "h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
        <div
          className={cn(
            "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/80 to-[#fdf2f8]/60 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl sm:rounded-[2rem]",
            buildingPosStaffPortalPaddingBottomClass,
          )}
        >
          {/* ส่วนหัวคงที่ — มือถือแท็บอยู่แถบล่าง · เดสก์ท็อปแท็บอยู่ข้างปุ่มรีเฟรช */}
          <header className="shrink-0 border-b border-[#e8e6fc]/80 bg-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/80">
                  พนักงาน · บันทึกออเดอร์
                </p>
                <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                  {shopLabel}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="hidden lg:block">
                  {renderStaffTabs("เมนูพนักงานเดสก์ท็อป", { compact: true })}
                </div>
                <button
                  type="button"
                  onClick={() => void refreshPortal()}
                  disabled={refreshing}
                  aria-busy={refreshing}
                  aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
                  title="รีเฟรช"
                  className="shrink-0 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-xs font-bold text-[#4d47b6] shadow-sm ring-1 ring-[#0000BF]/15 touch-manipulation hover:bg-white disabled:opacity-60 sm:rounded-2xl"
                >
                  {refreshing ? "…" : "รีเฟรช"}
                </button>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 py-3 sm:px-3 sm:py-4">
            {/* คง state ตะกร้าเมื่อสลับแท็บ — ซ่อนแทน unmount */}
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden",
                view !== "order" && "hidden",
              )}
              aria-hidden={view !== "order"}
            >
              <BuildingPosOrderClient
                ownerId={ownerId}
                trialSessionId={trialSessionId}
                portalMode
                staffAuth={staffAuth}
                slipPrintEnabled={slipPrintEnabled}
                enableMobileDraft={view === "order"}
                refreshNonce={refreshNonce}
                onOrderSuccess={() => {
                  void loadOrders();
                }}
              />
            </div>
            {view === "tables" ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
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
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </BuildingPosMobileBottomProvider>
  );
}
