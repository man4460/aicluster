"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { FootballTurfDashboard } from "@/systems/football-turf/FootballTurfDashboard";
import { FootballTurfMobileBottomProvider } from "@/systems/football-turf/components/FootballTurfMobileBottomChrome";
import {
  FOOTBALL_TURF_STAFF_TAB_ITEMS,
  type FootballTurfStaffTabKey,
} from "@/systems/football-turf/football-turf-module-nav";
import {
  footballTurfMainPaddingBottomClass,
  footballTurfNavActiveClass,
  footballTurfNavIdleClass,
} from "@/systems/football-turf/lib/ui-tokens";

export function FootballTurfStaffClient({
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
  const [venueLabel, setVenueLabel] = useState("สนามฟุตบอล");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [view, setView] = useState<FootballTurfStaffTabKey>("overview");

  const runBootstrap = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("football-turf", ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/football-turf/staff/bootstrap?${qs}`, {
      cache: "no-store",
      credentials: "omit",
      headers: staffDailyUnlockHeaders("football-turf", ownerId),
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
      venueLabel?: string;
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    setVenueLabel(d.venueLabel?.trim() || "สนามฟุตบอล");
    if (d.requiresDailyPin && d.unlocked === false) {
      setNeedsPin(true);
      setBootOk(true);
      return false;
    }
    setNeedsPin(false);
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

  const tabBtn = (active: boolean, compact?: boolean) =>
    cn(
      "rounded-2xl px-2.5 py-2 text-xs font-black touch-manipulation transition-all active:scale-[0.98] sm:text-sm",
      "ring-1 backdrop-blur-sm",
      compact ? "min-h-[40px] shrink-0 whitespace-nowrap px-3" : "min-h-[44px] flex-1",
      active
        ? cn(footballTurfNavActiveClass, "ring-white/55")
        : cn("bg-white/50 ring-white/60", footballTurfNavIdleClass),
    );

  const renderStaffTabs = (ariaLabel: string, opts?: { compact?: boolean }) => (
    <div
      className={cn("flex gap-1.5", opts?.compact ? "w-auto" : "w-full")}
      role="tablist"
      aria-label={ariaLabel}
    >
      {FOOTBALL_TURF_STAFF_TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={view === item.key}
          className={tabBtn(view === item.key, opts?.compact)}
          onClick={() => setView(item.key)}
        >
          {opts?.compact ? item.shortLabel : item.label}
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
          <p className="mt-2 text-sm text-[#66638c]">ให้เจ้าของสร้างลิงก์พนักงานใหม่จากแท็บ QR / ลิงก์</p>
        </div>
      </div>
    );
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="football-turf"
        ownerId={ownerId}
        shopLabel={venueLabel}
        unlockApiPath="/api/football-turf/staff/unlock"
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
    <FootballTurfMobileBottomProvider staffFooterNav={renderStaffTabs("เมนูพนักงาน")}>
      <div className={cn(shopQrTemplatePageBgClass, "h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
        <div
          className={cn(
            "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/80 to-[#fdf2f8]/60 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl sm:rounded-[2rem]",
            footballTurfMainPaddingBottomClass,
          )}
        >
          <header className="shrink-0 border-b border-[#e8e6fc]/80 bg-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/80">
                  พนักงาน · สนามฟุตบอล
                </p>
                <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                  {venueLabel}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="hidden lg:block">{renderStaffTabs("เมนูพนักงาน (เดสก์ท็อป)", { compact: true })}</div>
                <button
                  type="button"
                  onClick={() => void refreshPortal()}
                  disabled={refreshing}
                  className="min-h-[40px] min-w-[40px] rounded-xl border border-white/70 bg-white/80 px-2 text-xs font-black text-[#4d47b6]"
                  aria-label="รีเฟรช"
                >
                  {refreshing ? "…" : "รีเฟรช"}
                </button>
              </div>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-3 sm:py-3">
            <FootballTurfDashboard
              ownerUserId={ownerId}
              trialSessionId={trialSessionId}
              staffPortal
              staffAuth={staffAuth}
              forcedTab={view}
              refreshNonce={refreshNonce}
            />
          </div>
        </div>
      </div>
    </FootballTurfMobileBottomProvider>
  );
}
