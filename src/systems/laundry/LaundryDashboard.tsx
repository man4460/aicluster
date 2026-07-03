"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppMobileDockShell,
  AppSectionHeader,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { StaffQrLandingShell } from "@/components/qr/staff-qr-landing-shell";
import { cn } from "@/lib/cn";
import { HomeFinanceListHeading } from "@/systems/home-finance/components/HomeFinanceUi";
import { LaundryFinancePanel } from "@/systems/laundry/components/LaundryFinancePanel";
import { LaundryQrHubClient } from "@/systems/laundry/components/LaundryQrHubClient";
import { LaundryOrderEditModal, LaundryOrderViewModal } from "@/systems/laundry/components/LaundryOrderDetailModals";
import { LaundryOrderCard } from "@/systems/laundry/components/LaundryOrderCard";
import { LaundryPackageCard } from "@/systems/laundry/components/LaundryPackageCard";
import { LaundryPackageEditorModal } from "@/systems/laundry/components/LaundryPackageEditorModal";
import { LaundryPackageViewModal } from "@/systems/laundry/components/LaundryPackageViewModal";
import { LaundryRecordOrderModal } from "@/systems/laundry/components/LaundryRecordOrderModal";
import { LaundryUsageGuideModal } from "@/systems/laundry/components/LaundryUsageGuideModal";
import { ModuleShopSettingsLink } from "@/systems/module-shop/ModuleShopSettingsLink";
import {
  ModuleShopSettingsDesktopNavLink,
  ModuleShopSettingsDockLink,
  moduleShopSettingsDesktopNavItem,
} from "@/systems/module-shop/module-shop-settings-nav";
import { parseLaundryTab, type LaundryTabKey } from "@/systems/laundry/laundry-module-nav";
import {
  laundryDashboardCardGridClass,
  laundryDashboardStatsGridClass,
  laundryPackageTabListGridClass,
  laundryStaffQrLandingCardGridClass,
} from "@/systems/laundry/laundry-dashboard-layout";
import {
  createLaundrySessionApiRepository,
  type LaundryCostCategory,
  type LaundryCostEntry,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryPackage,
} from "@/systems/laundry/laundry-service";

type TabKey = "overview" | "finance" | "packages" | "qr";

const TAB_ITEMS: { key: TabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "แดชบอร์ด", shortLabel: "หน้าแรก" },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน" },
  { key: "packages", label: "แพ็กเกจ", shortLabel: "แพ็ก" },
  { key: "qr", label: "QR", shortLabel: "QR" },
];

/** เทียบหัวโมดูลคาร์แคร์ / บาร์เบอร์ */
const laundryGlassShellClass = cn(
  "overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20",
  "shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
);

function LaundryTabIcon({ tabKey }: { tabKey: TabKey }) {
  switch (tabKey) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "packages":
      return (
        <>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

/** เทียบ `CarWashStat` ใน `CarWashDashboard` — การ์ดสถิติแดชบอร์ดมุมมน + โทนสี */
function LaundryStat({
  title,
  value,
  tone = "blue",
  icon,
}: {
  title: string;
  value: string;
  tone?: "blue" | "green" | "red" | "slate" | "amber";
  icon?: ReactNode;
}) {
  const toneStyles = {
    blue: "border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 text-indigo-700 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl",
    green: "border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 text-emerald-700 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl",
    red: "border-white/60 bg-gradient-to-br from-white/60 via-rose-50/35 to-rose-100/30 text-rose-700 shadow-[0_18px_38px_-26px_rgba(244,63,94,0.35)] backdrop-blur-xl",
    amber: "border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 text-amber-700 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)] backdrop-blur-xl",
    slate: "border-white/60 bg-gradient-to-br from-white/60 via-slate-50/40 to-slate-100/35 text-slate-700 shadow-[0_18px_38px_-26px_rgba(51,65,85,0.35)] backdrop-blur-xl",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border p-3 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] sm:rounded-[2rem] sm:p-5 lg:p-6",
        toneStyles[tone],
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <p className="min-w-0 text-[8px] font-black uppercase leading-tight tracking-[0.12em] opacity-60 sm:text-[10px] sm:tracking-widest">
            {title}
          </p>
          {icon ? <div className="shrink-0 scale-[0.85] opacity-40 sm:scale-100">{icon}</div> : null}
        </div>
        <p className="mt-2 text-lg font-black tabular-nums tracking-tight sm:mt-4 sm:text-2xl lg:text-3xl">{value}</p>
      </div>
      <div className="absolute -right-5 -top-5 h-14 w-14 rounded-full bg-current opacity-[0.03] blur-2xl sm:-right-6 sm:-top-6 sm:h-20 sm:w-20" />
    </div>
  );
}

/** หัวแผงคิวงาน — เทียบแถวหัวใน `CarWashServiceLanePanel` · `iconOnlyToolbar` = ปุ่มไอคอนอย่างเดียว + ไม่มีคำบรรยายใต้หัวข้อ (โหมดพนักงาน QR) */
function LaundryActiveOrdersPanelHeader({
  refreshing,
  onRefresh,
  onAdd,
  iconOnlyToolbar = false,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  iconOnlyToolbar?: boolean;
}) {
  const toolbar = iconOnlyToolbar ?
    <div className="flex shrink-0 items-center justify-end gap-2 self-start">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dcd8f0]/90 bg-white/90 text-[#4d47b6] shadow-sm ring-1 ring-white/70 transition hover:bg-[#f4f3ff] disabled:opacity-60"
        aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
      >
        <svg
          className={cn("h-5 w-5", refreshing && "animate-spin")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
        >
          <path d="M20 11a8 8 0 1 0 2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-md ring-1 ring-white/40 transition hover:opacity-95 active:scale-95"
        aria-label="บันทึกรายการ"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  : <div className="flex shrink-0 items-center gap-2 self-start">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="cw-btn app-btn-soft app-tap-feedback inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#dcd8f0] px-3 py-2 text-[#4d47b6] hover:bg-[#f4f3ff] disabled:opacity-60 sm:px-3.5 sm:text-sm"
        aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
      >
        <svg
          className={cn("cw-btn-icon", refreshing && "animate-spin")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M20 11a8 8 0 1 0 2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="cw-btn-label">{refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}</span>
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="cw-btn app-btn-primary app-tap-feedback inline-flex min-h-[42px] items-center justify-center rounded-xl px-3 py-2 sm:px-4 sm:text-sm"
        aria-label="บันทึกรายการ"
      >
        <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        <span className="cw-btn-label">บันทึกรายการ</span>
      </button>
    </div>;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#ecebff] pb-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dcd8f0]/90 bg-white/90 text-[#4d47b6] shadow-sm ring-1 ring-white/70"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#2e2a58]">งานที่กำลังดำเนินการ</h2>
          {!iconOnlyToolbar ?
            <p className="mt-1 hidden text-xs text-[#66638c] sm:block">เลือกสถานะ · รีเฟรชเมื่อหลายเครื่อง</p>
          : null}
        </div>
      </div>
      {toolbar}
    </div>
  );
}

export function LaundryDashboard({
  shopLabel,
  logoUrl,
  baseUrl,
  ownerUserId,
  recorderDisplayName,
  trialSessionId,
  isTrialSandbox,
  layoutVariant = "full",
}: {
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  ownerUserId: string;
  recorderDisplayName: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  layoutVariant?: "full" | "staff_lane";
}) {
  const repo = useMemo(() => createLaundrySessionApiRepository(), []);
  const isStaffLaneOnly = layoutVariant === "staff_lane";
  const searchParams = useSearchParams();
  const tabFromUrl = useMemo(() => parseLaundryTab(searchParams.get("tab")), [searchParams]);
  const [tab, setTab] = useState<TabKey>(isStaffLaneOnly ? "overview" : tabFromUrl);
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [packages, setPackages] = useState<LaundryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isStaffLaneOnly) setTab(tabFromUrl);
  }, [tabFromUrl, isStaffLaneOnly]);
  const [showCreate, setShowCreate] = useState(false);
  const [packageModal, setPackageModal] = useState<null | "create" | LaundryPackage>(null);
  const [viewOrder, setViewOrder] = useState<LaundryOrder | null>(null);
  const [editOrder, setEditOrder] = useState<LaundryOrder | null>(null);
  const [viewPackage, setViewPackage] = useState<LaundryPackage | null>(null);
  const [costCategories, setCostCategories] = useState<LaundryCostCategory[]>([]);
  const [costEntries, setCostEntries] = useState<LaundryCostEntry[]>([]);
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [orderRows, packageRows, catRows, costRows] = await Promise.all([
        repo.listOrders(),
        repo.listPackages(),
        repo.listCostCategories(),
        repo.listCostEntries(),
      ]);
      setOrders(orderRows);
      setPackages(packageRows);
      setCostCategories(catRows);
      setCostEntries(costRows);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [repo]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [loadAll]);

  async function setOrderStatus(id: number, status: LaundryOrderStatus) {
    await repo.updateOrder(id, { status });
    await loadAll({ silent: true });
  }

  async function deleteOrderRow(o: LaundryOrder) {
    if (!window.confirm(`ลบรายการ #${o.id} (${o.customer_name}) ?`)) return;
    await repo.deleteOrder(o.id);
    setViewOrder((v) => (v?.id === o.id ? null : v));
    setEditOrder((v) => (v?.id === o.id ? null : v));
    await loadAll({ silent: true });
  }

  async function deletePackageRow(p: LaundryPackage) {
    if (!window.confirm(`ลบแพ็กเกจ "${p.name}" ?`)) return;
    await repo.deletePackage(p.id);
    setViewPackage((v) => (v?.id === p.id ? null : v));
    setPackageModal((cur) => (cur !== "create" && cur?.id === p.id ? null : cur));
    await loadAll({ silent: true });
  }

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"),
    [orders],
  );

  const todayStats = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const todayRows = orders.filter(
      (o) => new Date(o.order_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === todayKey,
    );
    return {
      totalOrders: todayRows.length,
      waitingPickup: todayRows.filter((o) => o.status === "PENDING_PICKUP").length,
      activeOrders: todayRows.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length,
      revenue: todayRows.reduce((sum, o) => sum + o.final_price, 0),
    };
  }, [orders]);

  const staffLaneOrderQueue = (
    <div className="space-y-4">
      <LaundryActiveOrdersPanelHeader
        iconOnlyToolbar
        refreshing={refreshing}
        onRefresh={() => void refreshData()}
        onAdd={() => setShowCreate(true)}
      />
      <div className="space-y-4">
        {loading ? <p className="text-xs text-[#66638c] sm:text-sm">กำลังโหลด...</p> : null}
        {!loading && activeOrders.length === 0 ? <AppEmptyState tone="violet">ไม่มีงานค้าง</AppEmptyState> : null}
        {!loading && activeOrders.length > 0 ?
          <ul className={cn(laundryStaffQrLandingCardGridClass, "list-none p-0")} aria-label="งานซักค้าง">
            {activeOrders.map((o) => (
              <li key={o.id} className="min-w-0">
                <LaundryOrderCard
                  order={o}
                  tone="violet"
                  showStatusSelect
                  showOrderedAt={false}
                  onView={() => setViewOrder(o)}
                  onEdit={() => setEditOrder(o)}
                  onDelete={() => void deleteOrderRow(o)}
                  onStatusChange={setOrderStatus}
                />
              </li>
            ))}
          </ul>
        : null}
      </div>
    </div>
  );

  const laundryModals = (
    <>
      <LaundryRecordOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        packages={packages}
        repo={repo}
        recorderDisplayName={recorderDisplayName}
        onSaved={() => void loadAll()}
      />

      <LaundryPackageEditorModal
        open={packageModal !== null}
        onClose={() => setPackageModal(null)}
        editingPackage={packageModal === "create" ? null : packageModal}
        repo={repo}
        onSaved={() => void loadAll()}
      />

      <LaundryPackageViewModal pkg={viewPackage} onClose={() => setViewPackage(null)} />

      <LaundryOrderViewModal order={viewOrder} onClose={() => setViewOrder(null)} />

      <LaundryOrderEditModal
        order={editOrder}
        onClose={() => setEditOrder(null)}
        onSaved={() => void loadAll({ silent: true })}
        onUpdate={(id, patch) => repo.updateOrder(id, patch)}
      />
    </>
  );

  if (isStaffLaneOnly) {
    return (
      <>
        <StaffQrLandingShell
          variant="laundry"
          title="รับฝากซักผ้าพนักงาน"
          shopLabel={shopLabel}
          loading={loading}
        >
          {staffLaneOrderQueue}
        </StaffQrLandingShell>
        {laundryModals}
      </>
    );
  }

  return (
    <div className={cn("max-w-full space-y-4 sm:space-y-6")}>
      <div className={cn(laundryGlassShellClass, "p-4 sm:px-8 sm:py-6 print:hidden")}>
            <header>
              <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-[#5b61ff] text-white shadow-lg shadow-indigo-100"
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M12 3v18M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" opacity="0.35" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">รับฝากซักผ้า</h1>
                    <p className="mt-0.5 hidden text-xs font-semibold text-slate-500 sm:block">
                      รับผ้าที่บ้าน · ซัก/อบ/รีด · ส่งคืนลูกค้า
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUsageGuideOpen(true)}
                  className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/45 text-sm font-black text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white/65 active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
                  aria-label="คู่มือการใช้งาน"
                  aria-haspopup="dialog"
                  aria-expanded={usageGuideOpen}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1" />
                  </svg>
                  <span className="hidden sm:inline">คู่มือการใช้งาน</span>
                </button>
              </div>
            </header>

            <nav aria-label="เมนูซักผ้า" className="mt-5 hidden border-t border-white/40 pt-5 lg:block print:hidden">
              <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TAB_ITEMS.map((item) => {
                  const active = tab === item.key;
                  return (
                    <li key={item.key} className="min-w-0 shrink-0 flex-[1_1_0%]">
                      <button
                        type="button"
                        onClick={() => setTab(item.key)}
                        className={cn(
                          "flex w-full min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[13px] font-black transition-all",
                          active
                            ? "bg-white/75 text-[#5b61ff] shadow-md ring-1 ring-white/80 backdrop-blur-sm"
                            : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                        )}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 shrink-0" aria-hidden>
                          <LaundryTabIcon tabKey={item.key} />
                        </svg>
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
                {moduleShopSettingsDesktopNavItem(
                  <ModuleShopSettingsDesktopNavLink href="/dashboard/laundry/settings" active={false} />,
                )}
              </ul>
            </nav>
          </div>

      {tab === "overview" && (
        <div className={cn("space-y-4", "sm:space-y-6")}>
          <>
              <div className="space-y-3 rounded-[2.5rem] border border-white/55 bg-white/28 p-3 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:space-y-4 sm:p-5">
                <div className="flex items-center justify-between px-1 sm:px-2">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-[10px] sm:tracking-[0.2em]">
                    สถิติวันนี้
                  </h3>
                  <div className="ml-3 h-px flex-1 bg-white/65 sm:ml-4" aria-hidden />
                </div>
                <div className={laundryDashboardStatsGridClass}>
                  <LaundryStat
                    title="รับงานวันนี้"
                    value={todayStats.totalOrders.toLocaleString("th-TH")}
                    tone="slate"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                      </svg>
                    }
                  />
                  <LaundryStat
                    title="รอรับผ้า"
                    value={todayStats.waitingPickup.toLocaleString("th-TH")}
                    tone="amber"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    }
                  />
                  <LaundryStat
                    title="งานค้าง"
                    value={todayStats.activeOrders.toLocaleString("th-TH")}
                    tone="blue"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                      </svg>
                    }
                  />
                  <LaundryStat
                    title="รายรับวันนี้"
                    value={`฿${todayStats.revenue.toLocaleString("th-TH")}`}
                    tone="amber"
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                        <path d="M12 18V6" />
                      </svg>
                    }
                  />
                </div>
              </div>

              <AppDashboardSection tone="violet">
                    <LaundryActiveOrdersPanelHeader
                      refreshing={refreshing}
                      onRefresh={() => void refreshData()}
                      onAdd={() => setShowCreate(true)}
                    />
                    <div className="mt-4 space-y-4">
                      {loading ? <p className="text-xs text-[#66638c] sm:text-sm">กำลังโหลด...</p> : null}
                      {!loading && activeOrders.length === 0 ?
                        <AppEmptyState tone="violet">ไม่มีงานค้าง</AppEmptyState>
                      : null}
                      {!loading && activeOrders.length > 0 ?
                        <ul className={cn(laundryDashboardCardGridClass, "list-none p-0")} aria-label="งานซักค้าง">
                          {activeOrders.map((o) => (
                            <li key={o.id} className="min-w-0">
                              <LaundryOrderCard
                                order={o}
                                tone="violet"
                                showStatusSelect
                                showOrderedAt={false}
                                onView={() => setViewOrder(o)}
                                onEdit={() => setEditOrder(o)}
                                onDelete={() => void deleteOrderRow(o)}
                                onStatusChange={setOrderStatus}
                              />
                            </li>
                          ))}
                        </ul>
                      : null}
                    </div>
                  </AppDashboardSection>
            </>
        </div>
      )}

      {tab === "finance" ?
        <LaundryFinancePanel
          orders={orders}
          costCategories={costCategories}
          costEntries={costEntries}
          repo={repo}
          baseUrl={baseUrl}
          onRefresh={async () => {
            await loadAll({ silent: true });
          }}
          onViewOrder={setViewOrder}
          onEditOrder={setEditOrder}
          onDeleteOrder={deleteOrderRow}
          onStatusChange={setOrderStatus}
        />
      : null}

      {tab === "packages" ?
        <AppDashboardSection tone="slate">
          <div className="min-w-0">
            <div className="flex flex-row items-center justify-between gap-2">
              <HomeFinanceListHeading className="mb-0 min-w-0">ราคา / แพ็กเกจ</HomeFinanceListHeading>
              <button
                type="button"
                onClick={() => setPackageModal("create")}
                className="cw-btn app-btn-primary app-tap-feedback inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold shadow-sm sm:min-h-[42px] sm:px-4 sm:py-2.5"
                aria-label="เพิ่มแพ็กเกจ"
              >
                <svg className="cw-btn-icon h-5 w-5 sm:h-[1.125rem] sm:w-[1.125rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="cw-btn-label">เพิ่มแพ็กเกจ</span>
              </button>
            </div>
            <p className="mt-2 hidden text-xs text-[#66638c] sm:block">
              เพิ่มขวา · แก้ไข / ลบ / ดู — ไอคอนมุมการ์ดแพ็กเกจ
            </p>
          </div>
          <div className="mt-3">
            {packages.length === 0 ?
              <p className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-8 text-center text-xs text-slate-600 sm:text-sm">
                ยังไม่มีแพ็กเกจ — กด &quot;เพิ่มแพ็กเกจ&quot; เพื่อสร้างรายการแรก
              </p>
            : <ul className={cn(laundryPackageTabListGridClass, "list-none p-0")} aria-label="รายการแพ็กเกจซักผ้า">
                {packages.map((p) => (
                  <li key={p.id} className="min-w-0">
                    <LaundryPackageCard
                      packagesTabRowLayout
                      pkg={p}
                      onView={() => setViewPackage(p)}
                      onEdit={() => setPackageModal(p)}
                      onDelete={() => void deletePackageRow(p)}
                    />
                  </li>
                ))}
              </ul>
            }
          </div>
        </AppDashboardSection>
      : null}

      {tab === "qr" ?
        <AppDashboardSection tone="slate">
          <AppSectionHeader
            tone="slate"
            title="QR / โปสเตอร์"
            description="โปสเตอร์และลิงก์ QR"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={<ModuleShopSettingsLink href="/dashboard/laundry/settings" />}
          />
          <LaundryQrHubClient
            ownerUserId={ownerUserId}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            trialExportBlocked={isTrialSandbox}
            isTrialSandbox={isTrialSandbox}
            trialSessionId={trialSessionId}
          />
        </AppDashboardSection>
      : null}

      {laundryModals}
      <LaundryUsageGuideModal open={usageGuideOpen} onClose={() => setUsageGuideOpen(false)} />

      <AppMobileDockShell ariaLabel="เมนูล่างรับฝากซักผ้า">
        <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
          {TAB_ITEMS.map((item) => {
            const active = tab === item.key;
            return (
              <li key={item.key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setTab(item.key)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={appMobileDockLinkClass(active)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                    <LaundryTabIcon tabKey={item.key} />
                  </svg>
                  <span className="max-w-full truncate px-0.5 text-[9px] font-black leading-none">
                    {item.shortLabel}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="min-w-0">
            <ModuleShopSettingsDockLink href="/dashboard/laundry/settings" active={false} />
          </li>
        </ul>
      </AppMobileDockShell>
    </div>
  );
}
