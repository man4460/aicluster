"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StaffDailyPinGate } from "@/components/qr/staff-daily-pin-gate";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { DormMobileBottomProvider } from "@/systems/dormitory/components/DormMobileBottomChrome";
import { DormStaffDashboardClient } from "@/systems/dormitory/components/DormStaffDashboardClient";
import { DormStaffManageClient } from "@/systems/dormitory/components/DormStaffManageClient";
import { DormStaffRoomDetailClient } from "@/systems/dormitory/components/DormStaffRoomDetailClient";
import {
  DormitoryStaffApiProvider,
  type DormitoryStaffAuth,
} from "@/systems/dormitory/lib/staff-api-fetch";
import {
  dormMainPaddingBottomClass,
  dormNavActiveClass,
  dormNavIdleClass,
} from "@/systems/dormitory/lib/ui-tokens";

type StaffView = "dashboard" | "manage";

function parseStaffView(raw: string | null): StaffView {
  return raw === "manage" ? "manage" : "dashboard";
}

export function DormStaffClient({
  ownerId,
  trialSessionId,
  staffKey,
}: {
  ownerId: string;
  trialSessionId: string;
  staffKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const staffAuth = useMemo<DormitoryStaffAuth>(
    () => ({ ownerId, trialSessionId, k: staffKey }),
    [ownerId, trialSessionId, staffKey],
  );
  const staffQs = useMemo(
    () => new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey }).toString(),
    [ownerId, trialSessionId, staffKey],
  );

  const selectedRoomId = searchParams.get("room")?.trim() ?? "";
  const roomFocusMonth = searchParams.get("month");
  const roomFocusSection = searchParams.get("section");
  const view = parseStaffView(searchParams.get("view"));

  const [bootOk, setBootOk] = useState<boolean | null>(null);
  const [needsPin, setNeedsPin] = useState(false);
  const [dormLabel, setDormLabel] = useState("หอพัก");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const replaceStaffQuery = useCallback(
    (mutate: (qs: URLSearchParams) => void) => {
      const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
      mutate(qs);
      router.replace(`/dorm/staff/${ownerId}?${qs.toString()}`, { scroll: false });
    },
    [ownerId, trialSessionId, staffKey, router],
  );

  const openRoom = useCallback(
    (roomId: number, opts?: { month?: string; section?: string }) => {
      replaceStaffQuery((qs) => {
        qs.set("room", String(roomId));
        if (opts?.month) qs.set("month", opts.month);
        else qs.delete("month");
        if (opts?.section) qs.set("section", opts.section);
        else qs.delete("section");
      });
    },
    [replaceStaffQuery],
  );

  const closeRoom = useCallback(() => {
    replaceStaffQuery((qs) => {
      qs.delete("room");
      qs.delete("month");
      qs.delete("section");
    });
  }, [replaceStaffQuery]);

  const setView = useCallback(
    (next: StaffView) => {
      if (selectedRoomId) closeRoom();
      replaceStaffQuery((qs) => {
        if (next === "manage") qs.set("view", "manage");
        else qs.delete("view");
      });
    },
    [closeRoom, replaceStaffQuery, selectedRoomId],
  );

  const runBootstrap = useCallback(async () => {
    const qs = new URLSearchParams({ ownerId, t: trialSessionId, k: staffKey });
    const unlock = readStoredStaffDailyUnlock("dormitory", ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/dorm/staff/bootstrap?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("dormitory", ownerId),
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
      dormLabel?: string;
    };
    if (d.ok !== true) {
      setBootOk(false);
      return false;
    }
    setDormLabel(d.dormLabel?.trim() || "หอพัก");
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
        ? cn(dormNavActiveClass, "ring-white/55")
        : cn("bg-white/50 ring-white/60", dormNavIdleClass),
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
        aria-selected={!selectedRoomId && view === "dashboard"}
        className={tabBtn(!selectedRoomId && view === "dashboard", opts?.compact)}
        onClick={() => setView("dashboard")}
      >
        ภาพรวม
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!selectedRoomId && view === "manage"}
        className={tabBtn(!selectedRoomId && view === "manage", opts?.compact)}
        onClick={() => setView("manage")}
      >
        การจัดการ
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
          <p className="mt-2 text-sm text-[#66638c]">ให้เจ้าของสร้างลิงก์พนักงานใหม่จากหน้าตั้งค่า</p>
        </div>
      </div>
    );
  }

  if (needsPin) {
    return (
      <StaffDailyPinGate
        module="dormitory"
        ownerId={ownerId}
        shopLabel={dormLabel}
        unlockApiPath="/api/dorm/staff/unlock"
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
    <DormitoryStaffApiProvider staffAuth={staffAuth}>
      <DormMobileBottomProvider staffFooterNav={renderStaffTabs("เมนูพนักงาน")}>
        <div className={cn(shopQrTemplatePageBgClass, "h-dvh max-h-dvh w-full overflow-hidden p-2 sm:p-3")}>
          <div
            className={cn(
              "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/80 to-[#fdf2f8]/60 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.28)] backdrop-blur-2xl sm:rounded-[2rem]",
              dormMainPaddingBottomClass,
            )}
          >
            <header className="shrink-0 border-b border-[#e8e6fc]/80 bg-white/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800/80">
                    พนักงาน · หอพัก
                  </p>
                  <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">
                    {selectedRoomId ? "รายละเอียดห้อง" : dormLabel}
                  </h1>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <div className="hidden lg:block">{renderStaffTabs("เมนูพนักงานเดสก์ท็อป", { compact: true })}</div>
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
              {selectedRoomId ? (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                  <DormStaffRoomDetailClient
                    embedded
                    roomId={selectedRoomId}
                    onBack={closeRoom}
                    initialPayMonth={roomFocusMonth}
                    initialSection={roomFocusSection}
                    refreshNonce={refreshNonce}
                  />
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
                      view !== "dashboard" && "hidden",
                    )}
                    aria-hidden={view !== "dashboard"}
                  >
                    <DormStaffDashboardClient
                      refreshNonce={refreshNonce}
                      onOpenManage={() => setView("manage")}
                      onOpenRoom={openRoom}
                    />
                  </div>
                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
                      view !== "manage" && "hidden",
                    )}
                    aria-hidden={view !== "manage"}
                  >
                    <DormStaffManageClient refreshNonce={refreshNonce} onOpenRoom={openRoom} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DormMobileBottomProvider>
    </DormitoryStaffApiProvider>
  );
}
