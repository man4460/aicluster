"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { DrinkPosOrderClient } from "@/systems/drink-pos/DrinkPosOrderClient";
import { DrinkPosOrderBoardClient } from "@/systems/drink-pos/components/DrinkPosOrderBoardClient";
import { DrinkPosMobileBottomProvider } from "@/systems/drink-pos/components/DrinkPosMobileBottomChrome";
import type { DrinkPosShopReceiptMeta } from "@/systems/drink-pos/lib/drink-pos-order-ticket-print";
import {
  drinkPosMainPaddingBottomClass,
  drinkPosNavActiveClass,
  drinkPosNavIdleClass,
} from "@/systems/drink-pos/lib/ui-tokens";

type StaffView = "order" | "queue";

export function DrinkPosStaffClient({
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
  const staffQs = useMemo(
    () => new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey }).toString(),
    [ownerId, trialSessionId, staffKey],
  );
  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [shopLabel, setShopLabel] = useState("ร้านเครื่องดื่ม");
  const [shopReceipt, setShopReceipt] = useState<DrinkPosShopReceiptMeta | null>(null);
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(false);
  const [defaultPaperSize, setDefaultPaperSize] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [view, setView] = useState<StaffView>("order");
  const [queueMountKey, setQueueMountKey] = useState(0);

  const runBootstrap = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("drink-pos", ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/drink-pos/staff/bootstrap?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("drink-pos", ownerId),
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
      defaultPaperSize?: string | null;
      slipPaperSize?: string | null;
      features?: { slipPrint?: boolean };
      receipt?: DrinkPosShopReceiptMeta;
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    const label = d.shopLabel?.trim() || "ร้านเครื่องดื่ม";
    setShopLabel(label);
    if (d.requiresDailyPin && d.unlocked === false) {
      setNeedsPin(true);
      setBootOk(true);
      return false;
    }
    setNeedsPin(false);
    setBootOk(true);
    setShopReceipt(
      d.receipt ?? {
        shopLabel: label,
        logoUrl: d.logoUrl ?? null,
        address: null,
        taxId: null,
        contactPhone: null,
        slipPaperSize: d.slipPaperSize ?? d.defaultPaperSize ?? null,
      },
    );
    if (d.slipPaperSize || d.defaultPaperSize) {
      setDefaultPaperSize(d.slipPaperSize ?? d.defaultPaperSize ?? null);
    }
    setSlipPrintEnabled(d.features?.slipPrint === true);
    return true;
  }, [ownerId, trialSessionId, staffKey]);

  useEffect(() => {
    void runBootstrap().catch(() => setBootOk(false));
  }, [runBootstrap]);

  async function refreshPortal() {
    setRefreshing(true);
    try {
      const ok = await runBootstrap();
      if (ok) {
        setRefreshNonce((n) => n + 1);
        if (view === "queue") setQueueMountKey((n) => n + 1);
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
      active ? cn(drinkPosNavActiveClass, "ring-white/55") : cn("bg-white/50 ring-white/60", drinkPosNavIdleClass),
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
        aria-selected={view === "queue"}
        className={tabBtn(view === "queue", opts?.compact)}
        onClick={() => {
          setView("queue");
          setQueueMountKey((n) => n + 1);
        }}
      >
        คิวออเดอร์
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
        module="drink-pos"
        ownerId={ownerId}
        shopLabel={shopLabel}
        unlockApiPath="/api/drink-pos/staff/unlock"
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
    <DrinkPosMobileBottomProvider staffFooterNav={renderStaffTabs("เมนูพนักงาน")}>
      <div className={cn(shopQrTemplatePageBgClass, "h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
        <div
          className={cn(
            "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/80 to-[#fdf2f8]/60 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl sm:rounded-[2rem]",
            drinkPosMainPaddingBottomClass,
          )}
        >
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

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-3 sm:px-3">
            <div className={cn(view === "order" ? "flex min-h-0 flex-1 flex-col" : "hidden")}>
              <DrinkPosOrderClient
                key={`order-${refreshNonce}`}
                layout="staffPortal"
                staffAuth={staffAuth}
                shopLabel={shopLabel}
                shopReceipt={shopReceipt}
                slipPrintEnabled={slipPrintEnabled}
                defaultPaperSize={defaultPaperSize}
                enableMobileDraft={view === "order"}
              />
            </div>
            <div className={cn(view === "queue" ? "flex min-h-0 flex-1 flex-col" : "hidden")}>
              <DrinkPosOrderBoardClient
                key={`queue-${queueMountKey}-${refreshNonce}`}
                mode="staff"
                ownerId={ownerId}
                trialParam={trialSessionId}
                staffKey={staffKey}
                shopName={shopLabel}
                className="min-h-0 flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </DrinkPosMobileBottomProvider>
  );
}
