"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { LaundryDashboardQuickActions } from "@/systems/laundry/components/LaundryDashboardHeaderToolbar";
import { LaundryRefreshButton } from "@/systems/laundry/components/LaundryRefreshButton";
import {
  LAUNDRY_DASHBOARD_TAB_ITEMS,
  LAUNDRY_STAFF_PATH,
  laundryDashboardTabIcon,
  laundryDashboardTabLabel,
  parseLaundryDashboardTab,
  type LaundryDashboardTabKey,
} from "@/systems/laundry/laundry-module-nav";
import {
  laundryMobileSelectClass,
  laundryStaffContentGutterClass,
  laundryStaffKioskShellClass,
  laundryStaffMainPaddingBottomClass,
  laundryStaffNavDividerClass,
  laundryStaffNavTabClass,
} from "@/systems/laundry/lib/ui-tokens";

type Props = {
  shopLabel: string;
  ownerId: string;
  /** เนื้อหาแดชบอร์ดจาก server — สลับแท็บด้วย ?tab= บน path พนักงาน */
  dashboard: ReactNode;
};

function LaundryStaffClientInner({ shopLabel: initialShopLabel, ownerId, dashboard }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [shopLabel, setShopLabel] = useState(initialShopLabel);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const tab = useMemo(
    () => parseLaundryDashboardTab(searchParams.get("tab")),
    [searchParams],
  );
  const tabLabel = useMemo(() => laundryDashboardTabLabel(tab), [tab]);

  const setTab = useCallback(
    (next: LaundryDashboardTabKey) => {
      if (next === "overview") {
        router.replace(LAUNDRY_STAFF_PATH, { scroll: false });
        return;
      }
      router.replace(`${LAUNDRY_STAFF_PATH}?tab=${next}`, { scroll: false });
    },
    [router],
  );

  const runBootstrap = useCallback(async () => {
    const unlock = readStoredStaffDailyUnlock("laundry", ownerId);
    const qs = unlock ? `?du=${encodeURIComponent(unlock)}` : "";
    const r = await fetch(`/api/laundry/staff/bootstrap${qs}`, {
      cache: "no-store",
      credentials: "include",
      headers: staffDailyUnlockHeaders("laundry", ownerId),
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

  const renderMainTabs = (ariaLabel: string) => (
    <div
      className="hidden shrink-0 flex-wrap items-center justify-end gap-0.5 sm:flex"
      role="tablist"
      aria-label={ariaLabel}
    >
      {LAUNDRY_DASHBOARD_TAB_ITEMS.map((item, index) => {
        const active = tab === item.key;
        const icon = laundryDashboardTabIcon(item.key);
        return (
          <span key={item.key} className="inline-flex items-center">
            {index > 0 ?
              <span className={laundryStaffNavDividerClass} aria-hidden />
            : null}
            <button
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.label}
              className={laundryStaffNavTabClass(active)}
              onClick={() => setTab(item.key)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden
              >
                {icon}
              </svg>
              <span>{item.label}</span>
            </button>
          </span>
        );
      })}
    </div>
  );

  const renderMobileTabSelect = () => (
    <div className="mt-2 w-full min-w-0 sm:hidden">
      <label htmlFor="laundry-staff-tab-select" className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
        เมนู
      </label>
      <select
        id="laundry-staff-tab-select"
        value={tab}
        onChange={(e) => setTab(e.target.value as LaundryDashboardTabKey)}
        className={laundryMobileSelectClass}
        aria-label="เมนูพนักงาน"
      >
        {LAUNDRY_DASHBOARD_TAB_ITEMS.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
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
        <div className={cn(laundryStaffKioskShellClass, "max-w-sm p-6 text-center")}>
          <p className="text-lg font-bold text-[#1e1b4b]">โหลดหน้าพนักงานไม่สำเร็จ</p>
          <p className="mt-2 text-sm text-[#66638c]">ลองรีเฟรชหน้าอีกครั้ง หรือเข้าสู่ระบบร้านใหม่</p>
        </div>
      </div>
    );
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="laundry"
        ownerId={ownerId}
        shopLabel={shopLabel}
        unlockApiPath="/api/laundry/staff/unlock"
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
    <div className={cn(shopQrTemplatePageBgClass, "h-full min-h-0 w-full overflow-hidden p-1 sm:p-2")}>
      <div className={cn(laundryStaffKioskShellClass, laundryStaffMainPaddingBottomClass)}>
        <header className="shrink-0 border-b border-slate-200/90 bg-white px-2 py-2.5 sm:px-3 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5a8a]">
                พนักงาน · รับฝากซักผ้า
              </p>
              <h1 className="mt-0.5 flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight text-[#1e1b4b] sm:text-xl">
                <span className="truncate">{shopLabel}</span>
                <span className={cn(laundryStaffNavDividerClass, "h-4")} aria-hidden />
                <span className="truncate">{tabLabel}</span>
              </h1>
            </div>
            <div className="hidden shrink-0 flex-wrap items-center justify-end gap-0.5 sm:flex">
              <LaundryDashboardQuickActions staffQrLanding showLabels />
              <span className={laundryStaffNavDividerClass} aria-hidden />
              {renderMainTabs("เมนูพนักงาน")}
              <span className={laundryStaffNavDividerClass} aria-hidden />
              <LaundryRefreshButton refreshing={refreshing} onClick={() => void refreshPortal()} />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:hidden">
              <LaundryDashboardQuickActions staffQrLanding showLabels={false} />
              <LaundryRefreshButton refreshing={refreshing} onClick={() => void refreshPortal()} />
            </div>
          </div>
          {renderMobileTabSelect()}
        </header>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden", laundryStaffContentGutterClass)}>
          <div key={`staff-dash-${refreshNonce}-${tab}`}>{dashboard}</div>
        </div>
      </div>
    </div>
  );
}

/** ลิงก์พนักงาน — เมนูเฉพาะแท็บแดชบอร์ด (ภาพรวม · ออเดอร์ · คิวสั่งออนไลน์) */
export function LaundryStaffClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className={cn(shopQrTemplatePageBgClass, "flex min-h-dvh items-center justify-center p-6")}>
          <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        </div>
      }
    >
      <LaundryStaffClientInner {...props} />
    </Suspense>
  );
}
