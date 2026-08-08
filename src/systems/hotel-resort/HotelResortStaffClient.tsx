"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { HotelResortBookingsClient } from "@/systems/hotel-resort/HotelResortBookingsClient";
import { HotelResortCheckInClient } from "@/systems/hotel-resort/HotelResortCheckInClient";
import { HotelResortDashboardClient } from "@/systems/hotel-resort/HotelResortDashboardClient";
import { HotelResortMobileBottomProvider } from "@/systems/hotel-resort/components/HotelResortMobileBottomChrome";
import {
  HotelResortStaffApiProvider,
  type HotelResortStaffAuth,
} from "@/systems/hotel-resort/lib/staff-api-fetch";
import type { HotelResortRoomRow } from "@/systems/hotel-resort/lib/client-data";
import {
  hotelResortMainPaddingBottomClass,
  hotelResortNavActiveClass,
  hotelResortNavIdleClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type StaffView = "dashboard" | "bookings" | "checkIn";

export function HotelResortStaffClient({
  ownerId,
  trialSessionId,
  staffKey,
}: {
  ownerId: string;
  trialSessionId: string;
  staffKey: string;
}) {
  const staffAuth = useMemo<HotelResortStaffAuth>(
    () => ({ ownerId, trialSessionId, k: staffKey }),
    [ownerId, trialSessionId, staffKey],
  );
  const staffQs = useMemo(
    () => new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey }).toString(),
    [ownerId, trialSessionId, staffKey],
  );

  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [hotelLabel, setHotelLabel] = useState("โรงแรม");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [view, setView] = useState<StaffView>("dashboard");
  const [checkInRoomId, setCheckInRoomId] = useState("");
  const [checkInBookingId, setCheckInBookingId] = useState("");
  const [checkInKey, setCheckInKey] = useState(0);

  const runBootstrap = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("hotel-resort", ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/hotel-resort/staff/bootstrap?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("hotel-resort", ownerId),
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
      hotelLabel?: string;
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    setHotelLabel(d.hotelLabel?.trim() || "โรงแรม");
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

  const openCheckIn = useCallback((room?: HotelResortRoomRow | null) => {
    setCheckInRoomId(room?.id ?? "");
    setCheckInBookingId(room?.bookingId ?? "");
    setCheckInKey((k) => k + 1);
    setView("checkIn");
  }, []);

  const tabBtn = (active: boolean, compact?: boolean) =>
    cn(
      "rounded-2xl px-2.5 py-2 text-xs font-black touch-manipulation transition-all active:scale-[0.98] sm:text-sm",
      "ring-1 backdrop-blur-sm",
      compact ? "min-h-[40px] shrink-0 whitespace-nowrap px-3" : "min-h-[44px] flex-1",
      active
        ? cn(hotelResortNavActiveClass, "ring-white/55")
        : cn("bg-white/50 ring-white/60", hotelResortNavIdleClass),
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
        aria-selected={view === "dashboard"}
        className={tabBtn(view === "dashboard", opts?.compact)}
        onClick={() => setView("dashboard")}
      >
        แดชบอร์ด
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "bookings"}
        className={tabBtn(view === "bookings", opts?.compact)}
        onClick={() => setView("bookings")}
      >
        จอง
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "checkIn"}
        className={tabBtn(view === "checkIn", opts?.compact)}
        onClick={() => openCheckIn(null)}
      >
        เช็คอิน
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
          <p className="mt-2 text-sm text-[#66638c]">ให้เจ้าของสร้างลิงก์พนักงานใหม่จากหน้าลูกค้า</p>
        </div>
      </div>
    );
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="hotel-resort"
        ownerId={ownerId}
        shopLabel={hotelLabel}
        unlockApiPath="/api/hotel-resort/staff/unlock"
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
    <HotelResortStaffApiProvider staffAuth={staffAuth}>
      <HotelResortMobileBottomProvider staffFooterNav={renderStaffTabs("เมนูพนักงาน")}>
        <div className={cn(shopQrTemplatePageBgClass, "h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
          <div
            className={cn(
              "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/80 to-[#fdf2f8]/60 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl sm:rounded-[2rem]",
              hotelResortMainPaddingBottomClass,
            )}
          >
            <header className="shrink-0 border-b border-[#e8e6fc]/80 bg-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/80">
                    พนักงาน · โรงแรม
                  </p>
                  <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                    {hotelLabel}
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
                    className="shrink-0 rounded-[1rem] border border-white/60 bg-white/80 px-3 py-2 text-xs font-bold text-[#4d47b6] shadow-sm ring-1 ring-[#0000BF]/15 touch-manipulation hover:bg-white disabled:opacity-60 sm:rounded-2xl"
                  >
                    {refreshing ? "…" : "รีเฟรช"}
                  </button>
                </div>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-3 sm:px-3">
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
                  view !== "dashboard" && "hidden",
                )}
                aria-hidden={view !== "dashboard"}
              >
                <HotelResortDashboardClient
                  refreshNonce={refreshNonce}
                  onRequestCheckIn={openCheckIn}
                />
              </div>
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
                  view !== "bookings" && "hidden",
                )}
                aria-hidden={view !== "bookings"}
              >
                <HotelResortBookingsClient refreshNonce={refreshNonce} />
              </div>
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
                  view !== "checkIn" && "hidden",
                )}
                aria-hidden={view !== "checkIn"}
              >
                <HotelResortCheckInClient
                  key={`checkin-${checkInKey}-${refreshNonce}`}
                  portalRoomId={checkInRoomId || undefined}
                  portalBookingId={checkInBookingId || undefined}
                  refreshNonce={refreshNonce}
                  onComplete={() => {
                    setView("dashboard");
                    setRefreshNonce((n) => n + 1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </HotelResortMobileBottomProvider>
    </HotelResortStaffApiProvider>
  );
}
