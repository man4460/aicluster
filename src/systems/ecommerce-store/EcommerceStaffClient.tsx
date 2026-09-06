"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Package, ShoppingBag } from "lucide-react";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { EcommerceDashboardClient } from "@/systems/ecommerce-store/components/EcommerceDashboardClient";
import { EcommerceOrdersClient } from "@/systems/ecommerce-store/components/EcommerceOrdersClient";
import { EcommercePosClient } from "@/systems/ecommerce-store/components/EcommercePosClient";
import { IconClipboard, IconStore } from "@/systems/ecommerce-store/components/EcommerceStoreIcons";
import {
  EcommerceStaffApiProvider,
  type EcommerceStaffAuth,
} from "@/systems/ecommerce-store/lib/staff-api-fetch";
import {
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePrimaryButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type StaffView = "overview" | "orders" | "pos" | "web";

type Bootstrap = {
  ok?: boolean;
  shopLabel?: string;
  publicShopUrl?: string;
  publicShopPath?: string;
};

const TABS: { key: StaffView; label: string; icon: ReactNode }[] = [
  { key: "overview", label: "ภาพรวม", icon: <IconStore className="h-3.5 w-3.5" /> },
  { key: "orders", label: "ออเดอร์", icon: <IconClipboard className="h-3.5 w-3.5" /> },
  { key: "pos", label: "หน้าร้าน", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { key: "web", label: "เว็บร้าน", icon: <Package className="h-3.5 w-3.5" /> },
];

export function EcommerceStaffClient({
  ownerId,
  trialSessionId,
  staffKey,
}: {
  ownerId: string;
  trialSessionId: string;
  staffKey: string;
}) {
  const staffAuth = useMemo<EcommerceStaffAuth>(
    () => ({ ownerId, trialSessionId, k: staffKey }),
    [ownerId, trialSessionId, staffKey],
  );
  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [shopLabel, setShopLabel] = useState("ร้านออนไลน์");
  const [publicShopUrl, setPublicShopUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [view, setView] = useState<StaffView>("overview");

  const runBootstrap = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const r = await fetch(`/api/ecommerce-store/staff/bootstrap?${qs}`, {
      cache: "no-store",
      credentials: "omit",
    });
    if (!r.ok) {
      setBootOk(false);
      return false;
    }
    const d = (await r.json()) as Bootstrap;
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    setShopLabel(d.shopLabel?.trim() || "ร้านออนไลน์");
    const url = d.publicShopUrl?.trim() || d.publicShopPath?.trim() || null;
    setPublicShopUrl(url);
    setBootOk(true);
    return true;
  }, [ownerId, trialSessionId, staffKey]);

  useEffect(() => {
    void runBootstrap().catch(() => setBootOk(false));
  }, [runBootstrap]);

  async function refreshPortal() {
    setRefreshing(true);
    try {
      const ok = await runBootstrap();
      if (ok) setRefreshNonce((n) => n + 1);
    } catch {
      setBootOk(false);
    } finally {
      setRefreshing(false);
    }
  }

  const tabBar = (
    <div className="grid w-full grid-cols-4 gap-1.5" role="tablist" aria-label="เมนูพนักงานร้านออนไลน์">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={view === tab.key}
          onClick={() => setView(tab.key)}
          className={cn(
            "inline-flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-black touch-manipulation transition sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs",
            view === tab.key
              ? "bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] text-white shadow-md"
              : "bg-white/70 text-[#5f5a8a]",
          )}
        >
          <span aria-hidden>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
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
          <p className="mt-2 text-sm text-[#66638c]">
            ให้เจ้าของร้านสร้างลิงก์พนักงานใหม่จากตั้งค่า → พนักงาน
          </p>
        </div>
      </div>
    );
  }

  return (
    <EcommerceStaffApiProvider staffAuth={staffAuth}>
      <div className={cn(shopQrTemplatePageBgClass, "fixed inset-0 z-[250] h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/75 shadow-2xl backdrop-blur-2xl sm:rounded-[2rem]">
          <header className="shrink-0 border-b border-white/70 bg-white/75 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                  พนักงาน · ร้านออนไลน์
                </p>
                <h1 className="truncate text-lg font-black text-[#1e1b4b] sm:text-xl">{shopLabel}</h1>
              </div>
              <div className="hidden min-w-[28rem] lg:block">{tabBar}</div>
              <button
                type="button"
                onClick={() => void refreshPortal()}
                disabled={refreshing}
                aria-busy={refreshing}
                aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
                title="รีเฟรช"
                className="min-h-[40px] min-w-[40px] shrink-0 rounded-xl border border-white/70 bg-white/80 px-2 text-xs font-black text-[#4d47b6] disabled:opacity-60"
              >
                {refreshing ? "…" : "รีเฟรช"}
              </button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-2 py-3 pb-24 sm:px-3 lg:pb-3">
            {view === "overview" ? <EcommerceDashboardClient key={`ov-${refreshNonce}`} /> : null}
            {view === "orders" ? (
              <EcommerceOrdersClient key={`ord-${refreshNonce}`} embedded />
            ) : null}
            {view === "pos" ? <EcommercePosClient key={`pos-${refreshNonce}`} /> : null}
            {view === "web" ? (
              <div className="mx-auto max-w-md space-y-4 rounded-[1.5rem] border border-white/70 bg-white/80 p-5 text-center shadow-sm">
                <p className="text-sm font-semibold text-[#66638c]">
                  เปิดเว็บร้านออนไลน์ให้ลูกค้าสั่งซื้อ — พนักงานใช้ได้เฉพาะลิงก์นี้และเมนูแดชบอร์ด
                </p>
                {publicShopUrl ? (
                  <>
                    <p className="break-all text-xs font-bold text-[#1e1b4b]">{publicShopUrl}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <a
                        href={publicShopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(ecommerceStorePrimaryButtonClass, "min-h-11 px-5")}
                      >
                        เปิดเว็บร้าน
                      </a>
                      <button
                        type="button"
                        className={cn(ecommerceStoreOutlineButtonClass, "min-h-11 px-4")}
                        onClick={() => {
                          void navigator.clipboard.writeText(publicShopUrl);
                        }}
                      >
                        คัดลอกลิงก์
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-rose-700">ยังไม่มีลิงก์ร้าน — ติดต่อเจ้าของร้าน</p>
                )}
              </div>
            ) : null}
          </main>

          <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 rounded-[2rem] border border-white/60 bg-white/80 p-2 shadow-xl backdrop-blur-xl lg:hidden">
            {tabBar}
          </div>
        </div>
      </div>
    </EcommerceStaffApiProvider>
  );
}
