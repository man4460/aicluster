"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppMobileDockUnifiedBar } from "@/components/app-templates";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import {
  BARBER_DASHBOARD_TAB_ITEMS,
  BARBER_STAFF_KIOSK_PATH,
  barberDashboardTabIcon,
  parseBarberDashboardTab,
  type BarberDashboardTabKey,
} from "@/systems/barber/barber-module-nav";
import {
  barberMainPaddingBottomClass,
  barberNavActiveClass,
  barberNavIdleClass,
} from "@/systems/barber/components/barber-ui-tokens";

type Props = {
  shopLabel: string;
  ownerId: string;
  /** เนื้อหาแดชบอร์ดจาก server — สลับแท็บด้วย ?tab= บน path พนักงาน */
  dashboard: ReactNode;
};

function BarberStaffClientInner({
  shopLabel: initialShopLabel,
  ownerId,
  dashboard,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [shopLabel, setShopLabel] = useState(initialShopLabel);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const tab = useMemo(
    () => parseBarberDashboardTab(searchParams.get("tab")),
    [searchParams],
  );

  const setTab = useCallback(
    (next: BarberDashboardTabKey) => {
      if (next === "overview") {
        router.replace(BARBER_STAFF_KIOSK_PATH, { scroll: false });
        return;
      }
      router.replace(`${BARBER_STAFF_KIOSK_PATH}?tab=${next}`, { scroll: false });
    },
    [router],
  );

  const runBootstrap = useCallback(async () => {
    const unlock = readStoredStaffDailyUnlock("barber", ownerId);
    const qs = unlock ? `?du=${encodeURIComponent(unlock)}` : "";
    const r = await fetch(`/api/barber/staff/bootstrap${qs}`, {
      cache: "no-store",
      credentials: "include",
      headers: staffDailyUnlockHeaders("barber", ownerId),
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
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    if (d.shopLabel?.trim()) setShopLabel(d.shopLabel.trim());
    if (d.requiresDailyPin && !d.unlocked) {
      setNeedsPin(true);
      setBootOk(true);
      return false;
    }
    setNeedsPin(false);
    setBootOk(true);
    return true;
  }, [ownerId]);

  useEffect(() => {
    void runBootstrap().catch(() => setBootOk(false));
  }, [runBootstrap]);

  async function refreshPortal() {
    setRefreshing(true);
    try {
      const ok = await runBootstrap();
      if (ok) {
        setRefreshNonce((n) => n + 1);
        router.refresh();
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
      compact ? "min-h-[40px] shrink-0 whitespace-nowrap px-3" : "min-h-[44px] flex-1",
      active
        ? cn(barberNavActiveClass, "ring-white/55")
        : cn("bg-white/50 ring-white/60", barberNavIdleClass),
    );

  const renderStaffTabs = (ariaLabel: string, opts?: { compact?: boolean }) => (
    <div
      className={cn("flex gap-1.5", opts?.compact ? "w-auto" : "w-full")}
      role="tablist"
      aria-label={ariaLabel}
    >
      {BARBER_DASHBOARD_TAB_ITEMS.map((item) => {
        const active = tab === item.key;
        const icon = barberDashboardTabIcon(item.key);
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item.label}
            className={cn(tabBtn(active, opts?.compact), "inline-flex items-center justify-center gap-1")}
            onClick={() => setTab(item.key)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
              aria-hidden
            >
              {icon}
            </svg>
            <span className={opts?.compact ? "hidden xl:inline" : undefined}>{item.label}</span>
          </button>
        );
      })}
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
          <p className="text-lg font-black text-[#1e1b4b]">โหลดหน้าพนักงานไม่สำเร็จ</p>
          <p className="mt-2 text-sm text-[#66638c]">ลองรีเฟรชหน้าอีกครั้ง หรือเข้าสู่ระบบร้านใหม่</p>
        </div>
      </div>
    );
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="barber"
        ownerId={ownerId}
        shopLabel={shopLabel}
        unlockApiPath="/api/barber/staff/unlock"
        staffQuery=""
        onUnlocked={() => {
          void runBootstrap().then((ok) => {
            if (ok) {
              setRefreshNonce((n) => n + 1);
              router.refresh();
            }
          });
        }}
      />
    );
  }

  return (
    <>
      <div className={cn(shopQrTemplatePageBgClass, "h-full min-h-0 w-full overflow-hidden p-2 sm:p-3")}>
        <div
          className={cn(
            "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/80 to-[#fdf2f8]/60 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl sm:rounded-[2rem]",
            barberMainPaddingBottomClass,
          )}
        >
          <header className="shrink-0 border-b border-[#e8e6fc]/80 bg-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/80">
                  พนักงาน · ร้านตัดผม
                </p>
                <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                  {shopLabel}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="hidden lg:block">{renderStaffTabs("เมนูพนักงาน (เดสก์ท็อป)", { compact: true })}</div>
                <button
                  type="button"
                  onClick={() => void refreshPortal()}
                  disabled={refreshing}
                  aria-busy={refreshing}
                  className="min-h-[40px] min-w-[40px] rounded-xl border border-white/70 bg-white/80 px-2 text-xs font-black text-[#4d47b6] disabled:opacity-60"
                  aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
                  title="รีเฟรช"
                >
                  {refreshing ? "…" : "รีเฟรช"}
                </button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-3 sm:py-3">
            <div key={`staff-dash-${refreshNonce}-${tab}`}>{dashboard}</div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <AppMobileDockUnifiedBar ariaLabel="เมนูพนักงานร้านตัดผม">
          {renderStaffTabs("เมนูพนักงาน")}
        </AppMobileDockUnifiedBar>
      </div>
    </>
  );
}

/** ลิงก์พนักงาน — เมนูเฉพาะแท็บแดชบอร์ด (ภาพรวม · คิว · เช็กอิน) อยู่ใน template พนักงานเท่านั้น */
export function BarberStaffClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className={cn(shopQrTemplatePageBgClass, "flex min-h-dvh items-center justify-center p-6")}>
          <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        </div>
      }
    >
      <BarberStaffClientInner {...props} />
    </Suspense>
  );
}
