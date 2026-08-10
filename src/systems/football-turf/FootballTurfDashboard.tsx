"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  Download,
  FileText,
  Landmark,
  MapPin,
  Phone,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TicketPercent,
  Wallet,
} from "lucide-react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  AppStaffDailyPinSettingsField,
  staffDailyPinPatchBody,
  AppSlipPrintIconButton,
  AppSparkChartPanel,
  AppTime24Input,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
  prepareImageFileAsDataUrl,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import { appDashboardBrandGradientBarClass, appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { footballTurfPublicBookUrl } from "@/lib/football-turf/public-url";
import { FootballTurfBookingPrintModal } from "@/systems/football-turf/components/FootballTurfBookingPrintModal";
import { FootballTurfCustomerStatsModal } from "@/systems/football-turf/components/FootballTurfCustomerStatsModal";
import { FootballTurfLoyaltySettingsPanel } from "@/systems/football-turf/components/FootballTurfLoyaltySettingsPanel";
import { FootballTurfPortalMediaSettings } from "@/systems/football-turf/components/FootballTurfPortalMediaSettings";
import {
  footballTurfCardAccentBarClass,
  footballTurfChipActionButtonClass,
  footballTurfChipWrapRowClass,
  footballTurfContentCardClass,
  footballTurfCourtStatusBadgeClass,
  footballTurfCourtTabPillClass,
  footballTurfCourtTabShellClass,
  footballTurfFieldClass,
  footballTurfFilterChipClass,
  footballTurfFilterChipShellClass,
  footballTurfFinanceListItemClass,
  footballTurfFinanceRangeChipClass,
  footballTurfFinanceStatCardClass,
  footballTurfFinanceStatsGridClass,
  footballTurfFinanceStatTailClass,
  footballTurfFinanceSubTabPillClass,
  footballTurfFinanceSubTabShellClass,
  footballTurfHeaderActionRowClass,
  footballTurfHeaderIconButtonClass,
  footballTurfHubCardAmberClass,
  footballTurfHubCardVioletClass,
  footballTurfInteractiveButtonClass,
  footballTurfLabelClass,
  footballTurfMetaChipClass,
  footballTurfMobileFilterIconButtonClass,
  footballTurfMobileSelectClass,
  footballTurfPanelCardClass,
  footballTurfPrimaryTabPillClass,
  footballTurfPrimaryTabShellClass,
  footballTurfSectionEyebrowClass,
  footballTurfSubTabMobileRowClass,
  footballTurfSubTabPillClass,
  footballTurfSubTabShellClass,
} from "@/systems/football-turf/lib/ui-tokens";
import { isValidThaiId13 } from "@/systems/football-turf/lib/thai-tax-id";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  type FootballTurfBooking,
  type FootballTurfBookingPaymentMethod,
  type FootballTurfBookingPaymentStatus,
  type FootballTurfBookingSource,
  type FootballTurfCostCategory,
  type FootballTurfCostEntry,
  type FootballTurfCourt,
  type FootballTurfCustomer,
  type FootballTurfIncomeCategory,
  type FootballTurfIncomeEntry,
  type FootballTurfPromotion,
  type FootballTurfPromotionSale,
  type FootballTurfPromotionSalePaymentMethod,
  type FootballTurfVenueSettings,
  createFootballTurfRepository,
  footballTurfStorageScope,
  setFootballTurfStorageScope,
} from "@/systems/football-turf/football-turf-service";
import {
  footballTurfBookingAmountPaidBaht,
  footballTurfBookingIsFullyPaid,
  footballTurfBookingRemainingBaht,
  footballTurfComputePaymentStatus,
  footballTurfComputePortalPayDue,
  footballTurfPortalSlipProofMessage,
} from "@/systems/football-turf/lib/portal-booking";
import {
  FOOTBALL_TURF_TAB_ITEMS,
  footballTurfTabIcon,
  parseFootballTurfCrmSection,
  parseFootballTurfTab,
  type FootballTurfTabKey,
} from "@/systems/football-turf/football-turf-module-nav";
import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { bangkokDateKey, formatBangkokTimeHm, isBangkokWeekend } from "@/lib/time/bangkok";
import {
  footballTurfSessionEndMinutes,
  isFootballTurfSameSessionBooking,
  listFootballTurfSessionBookings,
} from "@/systems/football-turf/lib/booking-session";
import {
  applyFootballTurfLiveEventToBookings,
  removeByIds,
  upsertById,
  type FootballTurfLiveEvent,
} from "@/systems/football-turf/lib/live-board-events";
import {
  bookingCoversMinutes,
  isSlotEligibleForAdvanceBooking,
  isSlotEligibleForWalkIn,
  isSlotTimeCurrent,
  isSlotTimePassed,
  listAdvanceBookingEligibleSlots,
  listWalkInEligibleSlots,
  localDateKey,
  localNowMinutes,
  minutesToTime,
  timeToMinutes,
} from "@/systems/football-turf/lib/time-queue";

function StatCard({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className={cn("rounded-[1.1rem] border p-4 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl", tone)}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap text-[clamp(0.62rem,0.56rem+0.2vw,0.74rem)] font-black uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
        <div className="rounded-xl bg-white/65 p-2 text-slate-700 shadow-sm">{icon}</div>
      </div>
      <p className="mt-4 truncate whitespace-nowrap text-[clamp(1.15rem,0.95rem+1vw,1.8rem)] font-black tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FilterToolbar({
  title = "ตัวกรอง",
  description,
  children,
  compact = false,
  summary,
  activeCount = 0,
  onReset,
  resetLabel = "ล้างตัวกรอง",
  mobileCollapsed = true,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  compact?: boolean;
  summary?: string;
  activeCount?: number;
  onReset?: () => void;
  resetLabel?: string;
  mobileCollapsed?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(!mobileCollapsed);

  return (
    <div
      className={cn(
        "mt-3 app-surface border border-[#e8e6fc]/80 sm:mt-4",
        mobileOpen ? "p-3 sm:p-4" : "p-2 sm:p-4",
      )}
    >
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "flex items-center justify-between gap-2",
            compact ? "sm:flex-row sm:items-center" : "lg:flex-row lg:items-start",
          )}
        >
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm",
                  appDashboardBrandGradientBarClass,
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
                {description ? <p className="truncate text-xs font-medium text-slate-500">{description}</p> : null}
              </div>
            </div>
            {summary ? <p className="mt-2 text-xs font-medium text-slate-500">{summary}</p> : null}
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:flex-nowrap sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง"}
              aria-expanded={mobileOpen}
              className={cn(
                "relative inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center gap-0 rounded-lg border border-[#0000BF]/30 bg-[#0000BF]/10 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12 sm:h-9 sm:w-auto sm:min-w-0 sm:gap-2 sm:rounded-full sm:px-3",
                activeCount > 0 && "ring-2 ring-amber-300/60",
              )}
            >
              <SlidersHorizontal className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden />
              <span className="hidden sm:inline">{mobileOpen ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง"}</span>
              <span className="hidden sm:inline" aria-hidden>
                {mobileOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
              {activeCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white ring-2 ring-white sm:hidden">
                  {activeCount}
                </span>
              ) : null}
            </button>
            <span
              className={cn(
                "hidden h-9 items-center rounded-full border px-3 text-xs font-black shadow-sm sm:inline-flex",
                activeCount > 0
                  ? "border-[#0000BF]/30 bg-[#0000BF]/10 text-[#2e2a58]"
                  : "border-slate-200 bg-white/90 text-slate-500",
              )}
            >
              {activeCount > 0 ? `เปิดใช้ ${activeCount} ตัวกรอง` : "ค่าเริ่มต้น"}
            </span>
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                disabled={activeCount === 0}
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white/90 px-3 text-xs font-black text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 sm:rounded-full"
              >
                <span className="sm:hidden">ล้าง</span>
                <span className="hidden sm:inline">{resetLabel}</span>
              </button>
            ) : null}
          </div>
        </div>
        {summary && mobileOpen ? (
          <p className="text-xs font-medium text-slate-500 sm:hidden">{summary}</p>
        ) : null}
        <div
          className={cn(
            "rounded-[1.1rem] border border-white/90 bg-white/72 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/75 sm:p-4",
            !mobileOpen && "hidden",
          )}
        >
          <div className={cn("grid gap-3", compact ? "sm:min-w-[14rem]" : "")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="group space-y-1.5">
      <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <div className="flex h-12 items-center gap-3 rounded-[1rem] border border-slate-200/85 bg-white px-3.5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)] ring-1 ring-white/70 transition duration-200 group-focus-within:border-[#0000BF]/30 group-focus-within:shadow-[0_22px_38px_-28px_rgba(91,97,255,0.38)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0000BF]/10 text-[#0000BF] ring-1 ring-[#0000BF]/30 transition">
          {icon}
        </span>
        <span className="h-6 w-px shrink-0 bg-slate-200/90" aria-hidden />
        <div className="min-w-0 flex-1 pl-0.5">
          {children}
        </div>
      </div>
    </label>
  );
}

function buildFilterSummary(parts: Array<string | false | null | undefined>, fallback: string) {
  const activeParts = parts.filter(Boolean) as string[];
  return activeParts.length > 0 ? activeParts.join(" · ") : fallback;
}

function FilterSegmentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-black transition-all",
        active
          ? cn(appDashboardBrandGradientFillClass, "text-white shadow-[0_18px_30px_-22px_rgba(91,97,255,0.55)]")
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

const FOOTBALL_TURF_PREVIEW_MODULES = [
  "สนามฟุตบอล",
  "คาร์แคร์",
  "ร้านตัดผม",
  "ร้านนวด",
  "ซักผ้า",
];

const FOOTBALL_TURF_PREVIEW_STATS = [
  { title: "สถานะสนามวันนี้", value: "4 สนามเปิด · 18 รอบจอง", tone: "border-white/70 bg-white/88" },
  { title: "สรุปธุรกิจวันนี้", value: "฿12,800 · ใช้งาน 78%", tone: "border-emerald-100 bg-emerald-50/85" },
];

const FOOTBALL_TURF_PREVIEW_SCHEDULE = [
  {
    court: "สนาม A",
    slots: [
      { label: "16:00", tone: "free" },
      { label: "17:00", tone: "booked" },
      { label: "18:00", tone: "active" },
      { label: "19:00", tone: "active" },
      { label: "20:00", tone: "booked" },
      { label: "21:00", tone: "free" },
    ],
  },
  {
    court: "สนาม B",
    slots: [
      { label: "16:00", tone: "free" },
      { label: "17:30", tone: "free" },
      { label: "19:00", tone: "booked" },
      { label: "20:30", tone: "booked" },
      { label: "22:00", tone: "free" },
    ],
  },
  {
    court: "สนาม C",
    slots: [
      { label: "16:00", tone: "completed" },
      { label: "17:00", tone: "booked" },
      { label: "18:00", tone: "booked" },
      { label: "19:00", tone: "free" },
      { label: "20:00", tone: "free" },
      { label: "21:00", tone: "free" },
    ],
  },
];

function previewSlotClass(tone: "free" | "booked" | "active" | "completed") {
  if (tone === "active") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (tone === "booked") return "border-sky-200 bg-sky-100 text-sky-800";
  if (tone === "completed") return "border-violet-200 bg-violet-100 text-violet-800";
  return "border-slate-200 bg-white text-slate-500";
}

export function FootballTurfWorkspaceDraftPreview() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#f7fbfa_0%,_#eef5f2_100%)] text-slate-900">
      <div className="border-b border-white/70 bg-white/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Global Header Draft</p>
            <div className="mt-1 flex items-center gap-3">
              <button type="button" className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-white", appDashboardBrandGradientFillClass)}>
                <span className="truncate">{FOOTBALL_TURF_PREVIEW_MODULES[0]}</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <p className="hidden text-sm font-medium text-slate-500 md:block">เมนูหลักทั้งระบบย้ายขึ้นมาด้านบน เพื่อให้พื้นที่ซ้ายเป็นของโมดูลนี้ทั้งหมด</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">ค้นหา</span>
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">โปรไฟล์</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-[264px] lg:flex-col lg:border-r lg:border-white/60 lg:bg-white/72 lg:px-5 lg:py-6 lg:backdrop-blur-2xl">
          <div className="rounded-[1.25rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">โมดูล</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">สนามฟุตบอล</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">Draft layout เน้นเมนูซ้ายเฉพาะโมดูล ใช้พื้นที่กว้างกับตารางสนามเต็มจอ</p>
          </div>

          <nav className="mt-5 space-y-2">
            {FOOTBALL_TURF_TAB_ITEMS.map((item, index) => {
              const active = index === 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black transition-all",
                    active
                      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-lg shadow-fuchsia-500/10")
                      : "bg-white/78 text-slate-600 ring-1 ring-white/75 hover:bg-white",
                  )}
                >
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", active ? "bg-white/15 ring-white/20" : "bg-slate-50 text-slate-500 ring-slate-200")}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      {footballTurfTabIcon(item.key)}
                    </svg>
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button type="button" className="flex w-full items-center gap-3 rounded-xl bg-white/78 px-4 py-3 text-left text-sm font-black text-slate-600 ring-1 ring-white/75">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <Landmark className="h-4 w-4" />
              </span>
              <span>ตั้งค่าสนาม</span>
            </button>
          </nav>

          <div className="mt-auto rounded-[1.25rem] border border-white/80 bg-white/80 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">แนวทางหน้าจอ</p>
            <p className="mt-2 text-sm font-medium text-slate-600">Desktop ใช้ sidebar ซ้ายของโมดูล, Mobile ใช้ bottom nav, เมนูหลักอยู่ใน header dropdown</p>
          </div>
        </aside>

        <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
          <header className="sticky top-0 z-20 rounded-[1.25rem] border border-white/70 bg-white/82 px-4 py-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.24)] backdrop-blur-2xl sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Module Header Draft</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">สนามฟุตบอล</h1>
                <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">
                  โครงนี้ลดจำนวนการ์ดลง ให้ header ทำหน้าที่บอกบริบทของโมดูลชัดขึ้น และปล่อยพื้นที่หลักให้กับตารางสนามกับคิวปฏิบัติงาน
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">Header แยก 2 ชั้น</span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">Sidebar เฉพาะโมดูล</span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">ตารางเต็มกว้าง</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
                  เพิ่มการจอง
                </button>
                <button type="button" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200">
                  เพิ่มสนาม
                </button>
              </div>
            </div>
          </header>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {FOOTBALL_TURF_PREVIEW_STATS.map((item) => (
              <div key={item.title} className={cn("rounded-[1.1rem] border px-5 py-4 shadow-sm", item.tone)}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.title}</p>
                <p className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>

          <section className="mt-5 rounded-[1.25rem] border border-white/70 bg-white/84 p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.2)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">พื้นที่หลัก</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">ตารางสนามเต็มกว้าง</h2>
                <p className="mt-1 text-sm font-medium text-slate-600">ออกแบบให้เป็น section สำคัญที่สุดของหน้า ใช้กว้างเต็มบน desktop และอ่านง่ายบน mobile</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200">
                <CalendarDays className="h-4 w-4" />
                27/07/2026
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50/75">
              <div className="hidden grid-cols-[180px_repeat(6,minmax(0,1fr))] border-b border-slate-200 bg-white/90 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 lg:grid">
                <div>สนาม</div>
                <div>16:00</div>
                <div>17:00</div>
                <div>18:00</div>
                <div>19:00</div>
                <div>20:00</div>
                <div>21:00</div>
              </div>
              <div className="divide-y divide-slate-200">
                {FOOTBALL_TURF_PREVIEW_SCHEDULE.map((row) => (
                  <div key={row.court} className="px-4 py-4 lg:grid lg:grid-cols-[180px_repeat(6,minmax(0,1fr))] lg:items-center lg:gap-3">
                    <div className="mb-3 lg:mb-0">
                      <p className="text-sm font-black text-slate-900">{row.court}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">โครง draft นี้ให้สนามแต่ละแถวชัดและสแกนง่าย</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-6 lg:grid-cols-6">
                      {row.slots.map((slot) => (
                        <div key={`${row.court}-${slot.label}`} className={cn("rounded-lg border px-3 py-3 text-center text-sm font-black", previewSlotClass(slot.tone as "free" | "booked" | "active" | "completed"))}>
                          {slot.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.25rem] border border-white/70 bg-white/84 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Operations</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight">คิววันนี้</h3>
                </div>
                <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-200">12 รายการ</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["เสือดำ FC", "สนาม A · 18:00 - 19:00", "กำลังใช้งาน"],
                  ["Night League", "สนาม B · 20:00 - 21:30", "จองแล้ว"],
                  ["Friends Match", "สนาม C · 19:00 - 20:00", "ว่างรอรับ"],
                ].map(([title, meta, status]) => (
                  <div key={title} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/75 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{title}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">{meta}</p>
                    </div>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">{status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.25rem] border border-white/70 bg-white/84 p-5 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Finance Snapshot</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">การเงินแบบย่อ</h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">รายรับวันนี้</p>
                  <p className="mt-2 text-2xl font-black">฿8,900</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-600">รายจ่ายวันนี้</p>
                  <p className="mt-2 text-2xl font-black">฿1,200</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">หมายเหตุ draft</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">หน้าใช้งานจริงควรเก็บ section รองให้อยู่ชิดขวา เพื่อไม่แย่งพื้นที่ตารางสนามหลัก</p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="mx-auto max-w-lg overflow-x-auto rounded-[2rem] border border-white/55 bg-white/80 p-1.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1">
            {FOOTBALL_TURF_TAB_ITEMS.map((item, index) => {
              const active = index === 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    "flex min-w-[4.25rem] flex-col items-center gap-1 rounded-[1.35rem] px-2 py-2 text-[11px] font-black",
                    active ? cn(appDashboardBrandGradientFillClass, "text-white") : "text-slate-500",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    {footballTurfTabIcon(item.key)}
                  </svg>
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

const MODULE_TITLE_FONT = {
  fontFamily: '"Noto Sans Thai", var(--font-sans), ui-sans-serif, system-ui, sans-serif',
} as const;

const FOOTBALL_TURF_MODULE_NAME = "สนามฟุตบอล";
const FILTER_CONTROL_CLASS =
  "w-full border-0 bg-transparent p-0 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400";
const COMPACT_CARD_LABEL_CLASS =
  "truncate whitespace-nowrap text-[clamp(0.62rem,0.56rem+0.2vw,0.74rem)] font-black uppercase tracking-[0.14em]";
const COMPACT_CARD_VALUE_CLASS =
  "mt-2 truncate whitespace-nowrap text-[clamp(1.2rem,0.92rem+1vw,1.9rem)] font-black tracking-tight";
const EMPTY_SETTINGS: FootballTurfVenueSettings = {
  venueName: "",
  venueSubtitle: "",
  logoUrl: "",
  promptpayNumber: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  venueAddress: "",
  taxId: "",
  contactPhone: "",
  contactLine: "",
  note: "",
  slipPaperSize: "SLIP_58",
  portalBookingPaymentMode: "NONE",
  depositAmountBaht: null,
  portalBannerUrl: "",
  portalGallery: [],
  facebookUrl: "",
  mapUrl: "",
  staffDailyPinSet: false,
};

function formatMoney(value: number): string {
  return `฿${value.toLocaleString("th-TH")}`;
}

function normalizeDateKey(value: string): string {
  return value ? value.slice(0, 10) : "";
}

function dateKeyInRange(
  value: string,
  range: "TODAY" | "MONTH" | "YEAR" | "CUSTOM",
  todayDateKey: string,
  startDate: string,
  endDate: string,
) {
  if (!value) return false;
  if (range === "TODAY") return value === todayDateKey;
  if (range === "MONTH") return value.slice(0, 7) === todayDateKey.slice(0, 7);
  if (range === "YEAR") return value.slice(0, 4) === todayDateKey.slice(0, 4);
  const rawStart = startDate || endDate;
  const rawEnd = endDate || startDate;
  const start = rawStart && rawEnd && rawStart > rawEnd ? rawEnd : rawStart;
  const end = rawStart && rawEnd && rawStart > rawEnd ? rawStart : rawEnd;
  if (!start && !end) return true;
  if (start && value < start) return false;
  if (end && value > end) return false;
  return true;
}

function buildFinanceRevenueCostBuckets(
  rows: { kind: "BOOKING" | "PROMOTION" | "INCOME" | "COST"; amount: number; dateKey: string }[],
  range: "TODAY" | "MONTH" | "YEAR" | "CUSTOM",
): AppRevenueCostBucket[] {
  const map = new Map<string, { revenue: number; cost: number }>();
  for (const item of rows) {
    if (!item.dateKey) continue;
    const key = range === "YEAR" ? item.dateKey.slice(0, 7) : item.dateKey;
    const cur = map.get(key) ?? { revenue: 0, cost: 0 };
    if (item.kind === "COST") cur.cost += item.amount;
    else cur.revenue += item.amount;
    map.set(key, cur);
  }
  const keys = [...map.keys()].sort();
  const max = Math.max(1, ...keys.map((k) => {
    const v = map.get(k)!;
    return Math.max(v.revenue, v.cost);
  }));
  return keys.map((key) => {
    const v = map.get(key)!;
    const label =
      range === "YEAR"
        ? key.slice(5) || key
        : key.length >= 10
          ? key.slice(8)
          : key;
    return {
      key,
      label,
      revenue: v.revenue,
      cost: v.cost,
      revenuePct: (v.revenue / max) * 100,
      costPct: (v.cost / max) * 100,
    };
  });
}

function bookingStatusClass(status: FootballTurfBooking["status"]): string {
  if (status === "PLAYING") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "CHECKED_IN") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (status === "COMPLETED") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function bookingStatusLabel(status: FootballTurfBooking["status"]): string {
  if (status === "BOOKED") return "จอง";
  if (status === "CHECKED_IN") return "เช็กอิน";
  if (status === "PLAYING") return "เช็กอิน";
  if (status === "COMPLETED") return "เช็กเอาท์";
  return "ยกเลิก";
}

function normalizeFtPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** ค้นหาลูกค้าจากเบอร์เต็มหรือ 4 หลักท้าย — แบบร้านอาหาร */
function findFootballTurfCustomersByPhone(
  list: FootballTurfCustomer[],
  raw: string,
): FootballTurfCustomer[] {
  const digits = normalizeFtPhoneDigits(raw);
  if (digits.length < 4) return [];
  const scored: { c: FootballTurfCustomer; score: number }[] = [];
  for (const c of list) {
    if (!c.isActive) continue;
    const p = normalizeFtPhoneDigits(c.phone);
    if (!p) continue;
    if (digits.length >= 9 && (p === digits || p.endsWith(digits) || digits.endsWith(p))) {
      scored.push({ c, score: 3 });
      continue;
    }
    if (p.endsWith(digits.slice(-4))) {
      scored.push({ c, score: 1 });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name, "th"));
  const seen = new Set<number>();
  const out: FootballTurfCustomer[] = [];
  for (const row of scored) {
    if (seen.has(row.c.id)) continue;
    seen.add(row.c.id);
    out.push(row.c);
  }
  return out;
}

function emptyTaxFields() {
  return {
    taxInvoiceEnabled: false,
    billingName: "",
    taxId: "",
    taxAddress: "",
    taxBranch: "",
  };
}

function customerHasTaxProfile(cust: FootballTurfCustomer): boolean {
  return (
    cust.taxInvoiceEnabled ||
    Boolean(cust.billingName?.trim()) ||
    Boolean(cust.taxId?.trim()) ||
    Boolean(cust.taxAddress?.trim())
  );
}

function taxFieldsFromCustomer(cust: FootballTurfCustomer) {
  if (!customerHasTaxProfile(cust)) return emptyTaxFields();
  return {
    taxInvoiceEnabled: true,
    billingName: cust.billingName?.trim() || cust.name || "",
    taxId: cust.taxId?.trim() || "",
    taxAddress: cust.taxAddress?.trim() || "",
    taxBranch: cust.taxBranch?.trim() || "",
  };
}

/** เบอร์ + ค้นหาสมาชิก — พิมพ์แล้วค้นหาอัตโนมัติ (เต็ม / 4 หลักท้าย) */
function FootballTurfMemberPhoneSearchField({
  phone,
  onPhoneChange,
  onSearch,
  candidates,
  onSelect,
  hint,
}: {
  phone: string;
  onPhoneChange: (value: string) => void;
  onSearch: (raw?: string) => void;
  candidates: FootballTurfCustomer[];
  onSelect: (cust: FootballTurfCustomer) => void;
  hint: string | null;
}) {
  const digits = normalizeFtPhoneDigits(phone);
  /** 4 หลักท้าย หรือเบอร์เต็ม — ไม่ค้นกลางทางตอนพิมพ์ 5–8 หลัก */
  const shouldAutoSearch = digits.length === 4 || digits.length >= 9;

  useEffect(() => {
    if (!shouldAutoSearch) return;
    const t = window.setTimeout(() => onSearch(phone), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce by phone digits only
  }, [phone, shouldAutoSearch]);

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="block space-y-1.5 text-sm font-medium text-slate-600">
        เบอร์โทร / ค้นหาสมาชิก
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold tabular-nums text-slate-800"
          placeholder="08xxxxxxxx หรือ 4 หลักท้าย — ค้นหาอัตโนมัติ"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 20))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (digits.length >= 4) onSearch(phone);
            }
          }}
        />
      </label>
      {hint ? <p className="text-xs font-semibold text-[#66638c]">{hint}</p> : null}
      {candidates.length > 1 ? (
        <ul className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5">
          <li className="text-[11px] font-black text-amber-900">เลือกสมาชิก (เบอร์ท้ายซ้ำ)</li>
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/80 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-violet-50"
                onClick={() => onSelect(c)}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-black tabular-nums text-[#1e1b4b]">{c.phone}</span>
                  <span className="text-[11px] font-semibold text-[#66638c]">
                    {c.name}
                    {c.teamName ? ` · ${c.teamName}` : ""}
                    {customerHasTaxProfile(c) ? " · มีใบกำกับ" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function getBookingInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function footballBookingNeedsClose(
  item: FootballTurfBooking,
  opts: { todayDateKey: string; nowMinutes: number },
  allBookings: FootballTurfBooking[] = [],
): boolean {
  if (item.status === "CANCELLED" || item.status === "COMPLETED") return false;
  if (item.bookingDate < opts.todayDateKey) return true;
  if (item.bookingDate > opts.todayDateKey) return false;

  if (item.status === "CHECKED_IN" || item.status === "PLAYING") {
    const session =
      allBookings.length > 0 ? listFootballTurfSessionBookings(item, allBookings) : [item];
    const sessionEnd = footballTurfSessionEndMinutes(session);
    return sessionEnd <= opts.nowMinutes;
  }

  if (item.status === "BOOKED" && timeToMinutes(item.startTime) <= opts.nowMinutes) return true;
  return false;
}

function footballBookingOverdueLabel(status: FootballTurfBooking["status"]): string {
  if (status === "BOOKED") return "ถึงเวลาเช็กอิน — ลูกค้ายังไม่มา";
  return "ถึงเวลาเช็กเอาท์ — ควรปิดรอบ";
}

type QueueDatePreset = "TODAY" | "MONTH" | "YEAR" | "CUSTOM" | "ALL";

function queueDateInPreset(
  bookingDate: string,
  preset: QueueDatePreset,
  todayDateKey: string,
  from: string,
  to: string,
): boolean {
  if (preset === "ALL") return true;
  if (preset === "TODAY") return bookingDate === todayDateKey;
  if (preset === "MONTH") return bookingDate.slice(0, 7) === todayDateKey.slice(0, 7);
  if (preset === "YEAR") return bookingDate.slice(0, 4) === todayDateKey.slice(0, 4);
  const start = from && to && from > to ? to : from || to;
  const end = from && to && from > to ? from : to || from;
  if (!start && !end) return true;
  if (start && bookingDate < start) return false;
  if (end && bookingDate > end) return false;
  return true;
}

/** วันที่ท้องถิ่นไทย YYYY-MM-DD — ใช้ localDateKey จาก time-queue (Asia/Bangkok) */

/**
 * หาคิวที่สนามกำลังใช้งานจริง (อิงนาฬิกาวันนี้เท่านั้น)
 * - รอบ PLAYING / CHECKED_IN ที่เลย endTime แล้วยังไม่ปิด → ถือว่ายังใช้อยู่ (overdue)
 * - ไม่เช่นนั้นใช้รอบที่ช่วงเวลากลืนตอนนี้ (PLAYING > CHECKED_IN > BOOKED)
 */
function findCourtLiveBooking(
  courtBookings: FootballTurfBooking[],
  opts: { isToday: boolean; nowMinutes: number },
): FootballTurfBooking | null {
  if (!opts.isToday) return null;

  const open = (item: FootballTurfBooking) =>
    item.status !== "CANCELLED" && item.status !== "COMPLETED";

  const overdue = courtBookings
    .filter(
      (item) =>
        open(item) &&
        (item.status === "PLAYING" || item.status === "CHECKED_IN") &&
        footballTurfSessionEndMinutes(listFootballTurfSessionBookings(item, courtBookings)) <=
          opts.nowMinutes,
    )
    .sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime));
  if (overdue[0]) return overdue[0];

  const active = courtBookings.filter(
    (item) => open(item) && timeToMinutes(item.endTime) > opts.nowMinutes,
  );
  if (active.length === 0) return null;

  const playing = active
    .filter(
      (item) => item.status === "PLAYING" && bookingCoversMinutes(item, opts.nowMinutes),
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  if (playing[0]) return playing[0];

  const covering = active
    .filter((item) => bookingCoversMinutes(item, opts.nowMinutes))
    .sort((a, b) => {
      const rank = (status: FootballTurfBooking["status"]) =>
        status === "CHECKED_IN" ? 0 : status === "BOOKED" ? 1 : 2;
      const byStatus = rank(a.status) - rank(b.status);
      if (byStatus !== 0) return byStatus;
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  return covering[0] ?? null;
}

/** คิวถัดไปหลังรอบปัจจุบัน (หรือรอบถัดไปถ้าสนามว่าง) — ข้ามคิวเซสชันเดียวกัน (ชื่อ/เบอร์เดียวกัน) */
function findCourtNextBooking(
  courtBookings: FootballTurfBooking[],
  opts: { nowMinutes: number },
  current: FootballTurfBooking | null,
): FootballTurfBooking | null {
  const afterMinutes = current ? timeToMinutes(current.endTime) : opts.nowMinutes;
  const currentId = current?.id;
  return (
    courtBookings
      .filter(
        (item) =>
          item.status !== "CANCELLED" &&
          item.status !== "COMPLETED" &&
          item.id !== currentId &&
          timeToMinutes(item.startTime) >= afterMinutes &&
          !(current && isFootballTurfSameSessionBooking(current, item)),
      )
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] ?? null
  );
}

function courtLiveAlertKind(
  current: FootballTurfBooking | null,
  nowMinutes: number,
  courtBookings: FootballTurfBooking[] = [],
): "NO_SHOW" | "OVERTIME" | null {
  if (!current) return null;
  const start = timeToMinutes(current.startTime);
  const end =
    current.status === "PLAYING" || current.status === "CHECKED_IN"
      ? footballTurfSessionEndMinutes(listFootballTurfSessionBookings(current, courtBookings))
      : timeToMinutes(current.endTime);
  if ((current.status === "PLAYING" || current.status === "CHECKED_IN") && end <= nowMinutes) {
    return "OVERTIME";
  }
  if (current.status === "BOOKED" && start <= nowMinutes && timeToMinutes(current.endTime) > nowMinutes) {
    return "NO_SHOW";
  }
  return null;
}

/** ช่วงเปิด–ปิดตามรอบที่ตั้งในสนาม · นอกช่วง = สนามปิด */
function courtHoursPhase(
  court: Pick<FootballTurfCourt, "openTime" | "closeTime">,
  nowMinutes: number,
): "BEFORE_OPEN" | "OPEN" | "AFTER_CLOSE" {
  const open = timeToMinutes(court.openTime);
  const close = timeToMinutes(court.closeTime);
  if (close <= open) {
    // ข้ามคืน — เปิดถ้าเลยเปิด หรือยังไม่ถึงปิด
    if (nowMinutes >= open || nowMinutes < close) return "OPEN";
    return "BEFORE_OPEN";
  }
  if (nowMinutes < open) return "BEFORE_OPEN";
  if (nowMinutes >= close) return "AFTER_CLOSE";
  return "OPEN";
}

function bookingPaymentStatusClass(status?: FootballTurfBooking["paymentStatus"]): string {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "PARTIAL") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (status === "PENDING_REVIEW") return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function bookingPaymentStatusLabel(status?: FootballTurfBooking["paymentStatus"]): string {
  if (status === "PAID") return "ชำระแล้ว";
  if (status === "PARTIAL") return "ชำระบางส่วน";
  if (status === "PENDING_REVIEW") return "รอตรวจสลิป";
  return "ยังไม่ชำระ";
}

function buildCourtTimeline(
  court: FootballTurfCourt,
  courtBookings: FootballTurfBooking[],
): Array<{
  startTime: string;
  endTime: string;
  booking: FootballTurfBooking | null;
}> {
  const start = timeToMinutes(court.openTime);
  const end = timeToMinutes(court.closeTime);
  const slots: Array<{ startTime: string; endTime: string; booking: FootballTurfBooking | null }> = [];
  for (let minute = start; minute < end; minute += court.slotMinutes) {
    const slotStart = minute;
    const slotEnd = Math.min(minute + court.slotMinutes, end);
    const booking =
      courtBookings.find((item) => {
        const bookingStart = timeToMinutes(item.startTime);
        const bookingEnd = timeToMinutes(item.endTime);
        return bookingStart < slotEnd && bookingEnd > slotStart;
      }) ?? null;
    slots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      booking,
    });
  }
  return slots;
}

export function FootballTurfDashboard({
  ownerUserId,
  trialSessionId,
  storageOnly,
  staffPortal = false,
  staffAuth = null,
  forcedTab,
  refreshNonce = 0,
}: {
  ownerUserId: string;
  trialSessionId: string;
  storageOnly?: boolean;
  /** พอร์ทัลลิงก์พนักงาน — เมนูจำกัด + API โทเค็น */
  staffPortal?: boolean;
  staffAuth?: { ownerId: string; trialSessionId: string; k: string } | null;
  forcedTab?: FootballTurfTabKey;
  refreshNonce?: number;
}) {
  const searchParams = useSearchParams();
  const urlTab = parseFootballTurfTab(searchParams.get("tab"));
  const activeTab = forcedTab ?? urlTab;
  const [crmSection, setCrmSection] = useState<"offers" | "customers">(() =>
    parseFootballTurfCrmSection(searchParams.get("tab")),
  );
  const repo = useMemo(
    () =>
      createFootballTurfRepository({
        mode: storageOnly ? "storage" : "api",
        staffAuth: staffPortal ? staffAuth : null,
      }),
    [storageOnly, staffPortal, staffAuth],
  );
  const ftApiFetch = useCallback(
    (input: string, init?: RequestInit) => {
      if (!staffPortal || !staffAuth) {
        return fetch(input, { ...init, credentials: init?.credentials ?? "include" });
      }
      const abs =
        input.startsWith("http://") || input.startsWith("https://")
          ? new URL(input)
          : new URL(input, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      abs.searchParams.set("ownerId", staffAuth.ownerId);
      abs.searchParams.set("t", staffAuth.trialSessionId);
      abs.searchParams.set("k", staffAuth.k);
      const unlock = readStoredStaffDailyUnlock("football-turf", staffAuth.ownerId);
      if (unlock) abs.searchParams.set("du", unlock);
      const headerBag = new Headers(init?.headers);
      const unlockHeaders = staffDailyUnlockHeaders("football-turf", staffAuth.ownerId);
      for (const [key, value] of Object.entries(unlockHeaders)) {
        headerBag.set(key, value);
      }
      return fetch(abs.toString(), {
        ...init,
        credentials: "omit",
        cache: init?.cache ?? "no-store",
        headers: headerBag,
      });
    },
    [staffPortal, staffAuth],
  );
  const [courts, setCourts] = useState<FootballTurfCourt[]>([]);
  const [bookings, setBookings] = useState<FootballTurfBooking[]>([]);
  const [promotions, setPromotions] = useState<FootballTurfPromotion[]>([]);
  const [promotionSales, setPromotionSales] = useState<FootballTurfPromotionSale[]>([]);
  const [costEntries, setCostEntries] = useState<FootballTurfCostEntry[]>([]);
  const [costCategories, setCostCategories] = useState<FootballTurfCostCategory[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<FootballTurfIncomeEntry[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<FootballTurfIncomeCategory[]>([]);
  const [customers, setCustomers] = useState<FootballTurfCustomer[]>([]);
  const [settings, setSettings] = useState<FootballTurfVenueSettings>(EMPTY_SETTINGS);
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));
  const [todayDateKey] = useState(() => localDateKey());
  const [liveClockMs, setLiveClockMs] = useState(() => Date.now());
  const [copyMsg, setCopyMsg] = useState("");
  const notice = useAppNoticePopup();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleEditOpen, setSaleEditOpen] = useState(false);
  const [editingPromotionSaleId, setEditingPromotionSaleId] = useState<number | null>(null);
  const [costOpen, setCostOpen] = useState(false);
  const [costEditingId, setCostEditingId] = useState<number | null>(null);
  const [costSlipBusy, setCostSlipBusy] = useState(false);
  const [costCatModalOpen, setCostCatModalOpen] = useState(false);
  const [costCatFormOpen, setCostCatFormOpen] = useState(false);
  const [costCatEdit, setCostCatEdit] = useState<FootballTurfCostCategory | null>(null);
  const [costCatName, setCostCatName] = useState("");
  const [costFilterCat, setCostFilterCat] = useState<"all" | number>("all");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeEditingId, setIncomeEditingId] = useState<number | null>(null);
  const [incomeSlipBusy, setIncomeSlipBusy] = useState(false);
  const [incomeCatModalOpen, setIncomeCatModalOpen] = useState(false);
  const [incomeCatFormOpen, setIncomeCatFormOpen] = useState(false);
  const [incomeCatEdit, setIncomeCatEdit] = useState<FootballTurfIncomeCategory | null>(null);
  const [incomeCatName, setIncomeCatName] = useState("");
  const [incomeFilterCat, setIncomeFilterCat] = useState<"all" | "COURT_RENTAL" | "PROMOTION" | number>("all");
  const [incomeForm, setIncomeForm] = useState({
    categoryId: "1",
    itemLabel: "",
    amount: "",
    note: "",
    paymentSlipUrl: "",
  });
  const incomeCamera = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายรับ" });
  const incomeGalleryRef = useRef<HTMLInputElement>(null);
  const [financePanel, setFinancePanel] = useState<"history" | "expenses">("history");
  const [financeFilterOpen, setFinanceFilterOpen] = useState(true);
  const [financeChartsOpen, setFinanceChartsOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<number | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [settingsMenu, setSettingsMenu] = useState<
    "venue" | "payment" | "docs" | "loyalty" | "preview"
  >("venue");
  const [customersMenu, setCustomersMenu] = useState<
    "all" | "active" | "inactive" | "tax" | "points"
  >("all");
  const [offersMenu, setOffersMenu] = useState<"packages" | "holders">("packages");
  const [offersFilterOpen, setOffersFilterOpen] = useState(false);
  const [customersFilterOpen, setCustomersFilterOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => localDateKey());
  const [overviewCourtId, setOverviewCourtId] = useState("ALL");
  const [scheduleCourtId, setScheduleCourtId] = useState<string>("");
  /** กรองแถวในตารางเวลาจองรายสนาม (หน้าภาพรวม) */
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<
    "ALL" | "FREE" | "BOOKED" | "CHECKED_IN" | "COMPLETED" | "PASSED" | "NEEDS_CLOSE"
  >("ALL");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState("ALL");
  const [queueCourtId, setQueueCourtId] = useState("ALL");
  const [queueFilterOpen, setQueueFilterOpen] = useState(true);
  const [queueDatePreset, setQueueDatePreset] = useState<QueueDatePreset>("MONTH");
  const [queueDateFrom, setQueueDateFrom] = useState("");
  const [queueDateTo, setQueueDateTo] = useState("");
  const [queueNeedsCloseOnly, setQueueNeedsCloseOnly] = useState(false);
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeStartDate, setFinanceStartDate] = useState(() => {
    const t = localDateKey();
    return `${t.slice(0, 7)}-01`;
  });
  const [financeEndDate, setFinanceEndDate] = useState(() => localDateKey());
  const [financeRange, setFinanceRange] = useState<"TODAY" | "MONTH" | "YEAR" | "CUSTOM">("MONTH");
  const [offersSearch, setOffersSearch] = useState("");
  const [offersSaleStatus, setOffersSaleStatus] = useState<"ALL" | "ACTIVE" | "USED_UP">("ALL");
  const [qrHubModal, setQrHubModal] = useState<"customer" | "staff" | null>(null);
  const [bookingSource, setBookingSource] = useState<FootballTurfBookingSource>("WALK_IN");
  /** โหมดชำระตอนจองล่วงหน้าในฟอร์ม — walk-in บังคับเต็ม */
  const [bookingPayMode, setBookingPayMode] = useState<"DEPOSIT" | "FULL">("FULL");
  const [bookingSaving, setBookingSaving] = useState(false);
  const [printBooking, setPrintBooking] = useState<FootballTurfBooking | null>(null);
  const [printPromotionSale, setPrintPromotionSale] = useState<FootballTurfPromotionSale | null>(null);
  const [printPreferTaxInvoice, setPrintPreferTaxInvoice] = useState(false);
  const [customerStatsPhone, setCustomerStatsPhone] = useState<string | null>(null);
  const [balancePayOpen, setBalancePayOpen] = useState(false);
  const [balancePayBookingId, setBalancePayBookingId] = useState<number | null>(null);
  const [balancePayCheckInAfter, setBalancePayCheckInAfter] = useState(false);
  const [balancePayMethod, setBalancePayMethod] = useState<"ONSITE" | "TRANSFER">("ONSITE");
  const [balancePayReference, setBalancePayReference] = useState("");
  const [balancePaySlipDataUrl, setBalancePaySlipDataUrl] = useState("");
  const [balancePayBusy, setBalancePayBusy] = useState(false);
  /** ภาพรวม — เช็กอิน/ชำระเพิ่มจากคิวที่จองไว้ */
  const [overviewCheckInModal, setOverviewCheckInModal] = useState<
    | { mode: "pick"; courtId: number }
    | { mode: "booking"; bookingId: number }
    | null
  >(null);
  const balancePayGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openBalancePayCamera,
    cameraInputRef: balancePayCameraInputRef,
    cameraModal: balancePayCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสลิปค้างชำระ" });
  const [bookingForm, setBookingForm] = useState({
    courtId: "1",
    bookingDate: localDateKey(),
    startTime: "18:00",
    endTime: "19:00",
    /** ช่วงที่เลือกตอนสร้างคิวใหม่ (แก้รายการเดิมใช้ start/end เดียว) */
    selectedSlots: [{ startTime: "18:00", endTime: "19:00" }] as Array<{ startTime: string; endTime: string }>,
    customerName: "",
    customerPhone: "",
    teamName: "",
    playerCount: "",
    note: "",
    paymentMethod: "ONSITE" as FootballTurfBookingPaymentMethod,
    paymentStatus: "UNPAID" as FootballTurfBookingPaymentStatus,
    paymentReference: "",
    paymentSlipDataUrl: "",
  });
  const [bookingPromptPayQr, setBookingPromptPayQr] = useState<{
    dataUrl: string | null;
    loading: boolean;
    configured: boolean;
  }>({ dataUrl: null, loading: false, configured: true });
  const [bookingSlipBusy, setBookingSlipBusy] = useState(false);
  const bookingSlipGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openBookingSlipCamera,
    cameraInputRef: bookingSlipCameraInputRef,
    cameraModal: bookingSlipCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสลิปการจอง" });
  const [courtForm, setCourtForm] = useState({
    name: "",
    openTime: "16:00",
    closeTime: "23:00",
    slotMinutes: "60",
    weekdayPrice: "900",
    weekendPrice: "1200",
    imageUrl: "",
    isActive: true,
  });
  const [courtImageBusy, setCourtImageBusy] = useState(false);
  const courtImageGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openCourtCamera,
    cameraInputRef: courtCameraInputRef,
    cameraModal: courtCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสนาม" });
  const courtImageLightbox = useAppImageLightbox();
  const [promotionForm, setPromotionForm] = useState({
    name: "",
    kind: "COUNT",
    totalUses: "10",
    durationMinutes: "60",
    price: "0",
    note: "",
    isActive: true,
  });
  const [saleForm, setSaleForm] = useState({
    promotionId: "1",
    customerName: "",
    customerPhone: "",
    teamName: "",
    paymentMethod: "ONSITE" as FootballTurfPromotionSalePaymentMethod,
    paymentReference: "",
    paymentSlipDataUrl: "",
    taxInvoiceEnabled: false,
    billingName: "",
    taxId: "",
    taxAddress: "",
    taxBranch: "",
  });
  const [salePromptPayQr, setSalePromptPayQr] = useState<{ dataUrl: string | null; loading: boolean; configured: boolean }>({
    dataUrl: null,
    loading: false,
    configured: true,
  });
  const [saleSlipBusy, setSaleSlipBusy] = useState(false);
  const saleSlipGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openSaleSlipCamera,
    cameraInputRef: saleSlipCameraInputRef,
    cameraModal: saleSlipCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสลิปขายโปร" });
  const saleSlipLightbox = useAppImageLightbox();
  const [saleEditForm, setSaleEditForm] = useState({
    customerName: "",
    customerPhone: "",
    teamName: "",
    remainingUses: "0",
    status: "ACTIVE" as FootballTurfPromotionSale["status"],
    paymentMethod: "ONSITE" as FootballTurfPromotionSalePaymentMethod,
    paymentStatus: "PAID" as FootballTurfBookingPaymentStatus,
    paymentReference: "",
    paymentSlipDataUrl: "",
    taxInvoiceEnabled: false,
    billingName: "",
    taxId: "",
    taxAddress: "",
    taxBranch: "",
  });
  const [saleEditSlipBusy, setSaleEditSlipBusy] = useState(false);
  const saleEditSlipGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openSaleEditSlipCamera,
    cameraInputRef: saleEditSlipCameraInputRef,
    cameraModal: saleEditSlipCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายรับโปร" });
  const [bookingTax, setBookingTax] = useState(() => emptyTaxFields());
  const [bookingEditSlipBusy, setBookingEditSlipBusy] = useState(false);
  const [bookingCustomerCandidates, setBookingCustomerCandidates] = useState<FootballTurfCustomer[]>([]);
  const [bookingCustomerHint, setBookingCustomerHint] = useState<string | null>(null);
  const [saleCustomerCandidates, setSaleCustomerCandidates] = useState<FootballTurfCustomer[]>([]);
  const [saleCustomerHint, setSaleCustomerHint] = useState<string | null>(null);
  const [saleEditCustomerCandidates, setSaleEditCustomerCandidates] = useState<FootballTurfCustomer[]>([]);
  const [saleEditCustomerHint, setSaleEditCustomerHint] = useState<string | null>(null);
  const [costForm, setCostForm] = useState({
    categoryId: "1",
    itemLabel: "",
    amount: "",
    note: "",
    paymentSlipUrl: "",
  });
  const costCamera = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายจ่าย" });
  const costGalleryRef = useRef<HTMLInputElement>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    teamName: "",
    note: "",
    isActive: true,
    taxInvoiceEnabled: false,
    billingName: "",
    taxId: "",
    taxAddress: "",
    taxBranch: "",
    photoUrl: "",
  });
  const [customerPhotoBusy, setCustomerPhotoBusy] = useState(false);
  const customerPhotoGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openCustomerPhotoCamera,
    cameraInputRef: customerPhotoCameraInputRef,
    cameraModal: customerPhotoCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปลูกค้า" });
  const customerPhotoLightbox = useAppImageLightbox();
  const [settingsForm, setSettingsForm] = useState<FootballTurfVenueSettings>(EMPTY_SETTINGS);
  const [staffPinDraft, setStaffPinDraft] = useState("");
  const [staffClearPin, setStaffClearPin] = useState(false);
  const [qrState, setQrState] = useState<{ title: string; url: string; dataUrl: string; loading: boolean }>({
    title: "",
    url: "",
    dataUrl: "",
    loading: false,
  });

  const refresh = useCallback(async () => {
    const clearable = repo as { clearCache?: () => void };
    clearable.clearCache?.();
    const [
      courtRows,
      bookingRows,
      promotionRows,
      saleRows,
      costRows,
      categoryRows,
      incomeRows,
      incomeCategoryRows,
      customerRows,
      settingsRow,
    ] = await Promise.all([
      repo.listCourts(),
      repo.listBookings(),
      repo.listPromotions(),
      repo.listPromotionSales(),
      repo.listCostEntries(),
      repo.listCostCategories(),
      repo.listIncomeEntries(),
      repo.listIncomeCategories(),
      repo.listCustomers(),
      repo.getSettings(),
    ]);
    setCourts(courtRows);
    setBookings(bookingRows);
    setPromotions(promotionRows);
    setPromotionSales(saleRows);
    setCostEntries(costRows);
    setCostCategories(categoryRows);
    setIncomeEntries(incomeRows);
    setIncomeCategories(incomeCategoryRows);
    setCustomers(customerRows);
    setSettings(settingsRow);
    setSettingsForm(settingsRow);
  }, [repo]);

  const applyLiveEvent = useCallback(
    (event: FootballTurfLiveEvent) => {
      if (event.type === "hello") return;
      const clearable = repo as { clearCache?: () => void };
      clearable.clearCache?.();
      if (event.type === "refresh") {
        void refresh();
        return;
      }
      if (
        event.type === "booking.upsert" ||
        event.type === "booking.delete" ||
        event.type === "booking.sessionStatus"
      ) {
        setBookings((prev) => applyFootballTurfLiveEventToBookings(prev, event) ?? prev);
      }
      if (event.type === "court.upsert") {
        setCourts((prev) => upsertById(prev, event.courts));
      }
      if (event.type === "court.delete") {
        setCourts((prev) => removeByIds(prev, event.ids));
      }
      if (event.type === "customer.upsert") {
        setCustomers((prev) => upsertById(prev, event.customers));
      }
      if (event.type === "customer.delete") {
        setCustomers((prev) => removeByIds(prev, event.ids));
      }
      if (event.type === "promotion.upsert") {
        setPromotions((prev) => upsertById(prev, event.promotions));
      }
      if (event.type === "promotion.delete") {
        setPromotions((prev) => removeByIds(prev, event.ids));
      }
      if (event.type === "promotionSale.upsert") {
        setPromotionSales((prev) => upsertById(prev, event.sales));
      }
      if (event.type === "promotionSale.delete") {
        setPromotionSales((prev) => removeByIds(prev, event.ids));
      }
      if (event.type === "settings.upsert") {
        setSettings(event.settings);
        setSettingsForm(event.settings);
      }
    },
    [refresh, repo],
  );

  useEffect(() => {
    if (storageOnly) return;

    let streamUrl = "/api/football-turf/state/stream";
    if (staffPortal && staffAuth) {
      const qs = new URLSearchParams({
        ownerId: staffAuth.ownerId,
        t: staffAuth.trialSessionId,
        k: staffAuth.k,
      });
      const unlock = readStoredStaffDailyUnlock("football-turf", staffAuth.ownerId);
      if (unlock) qs.set("du", unlock);
      streamUrl = `/api/football-turf/state/stream?${qs.toString()}`;
    }

    let es: EventSource | null = null;
    let closed = false;
    const liveMode = { current: "poll" as "sse" | "poll" };
    /** เมื่อ SSE ต่ออยู่ยัง soft-poll — กัน pub/sub พลาดใน next dev */
    const FALLBACK_POLL_MS = 12_000;
    /** เมื่อ SSE หลุด — รีเฟรชถี่ขึ้น */
    const OFFLINE_POLL_MS = 4_000;

    try {
      es = new EventSource(streamUrl);
      es.onopen = () => {
        if (closed) return;
        liveMode.current = "sse";
      };
      es.onmessage = (msg) => {
        if (closed) return;
        liveMode.current = "sse";
        try {
          const data = JSON.parse(msg.data) as FootballTurfLiveEvent;
          applyLiveEvent(data);
        } catch {
          /* ignore malformed */
        }
      };
      es.onerror = () => {
        if (closed) return;
        liveMode.current = "poll";
      };
    } catch {
      liveMode.current = "poll";
    }

    const offlinePoll = window.setInterval(() => {
      if (closed || liveMode.current === "sse") return;
      void refresh();
    }, OFFLINE_POLL_MS);

    const softPoll = window.setInterval(() => {
      if (closed || liveMode.current !== "sse") return;
      void refresh();
    }, FALLBACK_POLL_MS);

    const onVisible = () => {
      if (closed || document.visibilityState !== "visible") return;
      void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      es?.close();
      window.clearInterval(offlinePoll);
      window.clearInterval(softPoll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [storageOnly, staffPortal, staffAuth, applyLiveEvent, refresh]);

  useEffect(() => {
    setCrmSection(parseFootballTurfCrmSection(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    if (storageOnly) {
      setFootballTurfStorageScope(footballTurfStorageScope(ownerUserId, trialSessionId));
    }
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [ownerUserId, trialSessionId, refresh, storageOnly, refreshNonce]);

  useEffect(() => {
    if (!copyMsg) return;
    const id = window.setTimeout(() => setCopyMsg(""), 2200);
    return () => window.clearTimeout(id);
  }, [copyMsg]);

  useEffect(() => {
    const id = window.setInterval(() => setLiveClockMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  async function runSave(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      console.error(error);
    }
  }

  const selectedDayBookings = useMemo(
    () => bookings.filter((item) => item.bookingDate === scheduleDate),
    [bookings, scheduleDate],
  );
  const selectedDayPromotionSales = useMemo(
    () => promotionSales.filter((item) => normalizeDateKey(item.createdAt) === scheduleDate),
    [promotionSales, scheduleDate],
  );
  const selectedDayCosts = useMemo(
    () => costEntries.filter((item) => normalizeDateKey(item.spentAt) === scheduleDate),
    [costEntries, scheduleDate],
  );
  const selectedDayPromotionRevenue = useMemo(
    () => selectedDayPromotionSales.reduce((sum, item) => sum + item.price, 0),
    [selectedDayPromotionSales],
  );
  const selectedDayCostTotal = useMemo(
    () => selectedDayCosts.reduce((sum, item) => sum + item.amount, 0),
    [selectedDayCosts],
  );
  const publicLinkTrial = trialSessionId?.trim() || "prod";
  const publicBookUrl = footballTurfPublicBookUrl(origin, ownerUserId, publicLinkTrial);
  const bookingCourt = useMemo(
    () => courts.find((item) => item.id === Number(bookingForm.courtId)) ?? courts[0] ?? null,
    [courts, bookingForm.courtId],
  );
  const bookingTimeline = useMemo(
    () =>
      bookingCourt
        ? buildCourtTimeline(
            bookingCourt,
            bookings
              .filter(
                (item) =>
                  item.courtId === bookingCourt.id &&
                  item.bookingDate === bookingForm.bookingDate &&
                  item.status !== "CANCELLED" &&
                  item.id !== editingBookingId,
              )
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
          )
        : [],
    [bookingCourt, bookings, bookingForm.bookingDate, editingBookingId],
  );
  const bookingFormTimeOpts = useMemo(() => {
    const now = new Date(liveClockMs);
    return {
      scheduleDate: bookingForm.bookingDate,
      todayDateKey: localDateKey(now),
      nowMinutes: localNowMinutes(now),
    };
  }, [bookingForm.bookingDate, liveClockMs]);
  const bookingEligibleSlots = useMemo(() => {
    if (editingBookingId != null) return bookingTimeline;
    return bookingSource === "WALK_IN"
      ? listWalkInEligibleSlots(bookingTimeline, bookingFormTimeOpts)
      : listAdvanceBookingEligibleSlots(bookingTimeline, bookingFormTimeOpts);
  }, [bookingFormTimeOpts, bookingSource, bookingTimeline, editingBookingId]);
  const bookingSelectedSlots = useMemo(() => {
    if (editingBookingId != null) return [] as Array<{ startTime: string; endTime: string }>;
    const eligibleKeys = new Set(
      bookingEligibleSlots.map((slot) => `${slot.startTime}|${slot.endTime}`),
    );
    return bookingForm.selectedSlots.filter((slot) =>
      eligibleKeys.has(`${slot.startTime}|${slot.endTime}`),
    );
  }, [bookingEligibleSlots, bookingForm.selectedSlots, editingBookingId]);
  const bookingUnitPrice = useMemo(() => {
    if (!bookingCourt) return 0;
    const isWeekend = isBangkokWeekend(bookingForm.bookingDate);
    return isWeekend ? bookingCourt.weekendPrice : bookingCourt.weekdayPrice;
  }, [bookingCourt, bookingForm.bookingDate]);
  const bookingSelectedTotal = useMemo(() => {
    if (!bookingCourt || editingBookingId != null) return 0;
    return bookingUnitPrice * bookingSelectedSlots.length;
  }, [bookingCourt, bookingSelectedSlots.length, bookingUnitPrice, editingBookingId]);
  const bookingPayDueUnit = useMemo(() => {
    if (bookingSource === "WALK_IN") return bookingUnitPrice > 0 ? bookingUnitPrice : null;
    if (bookingPayMode === "FULL") return bookingUnitPrice > 0 ? bookingUnitPrice : null;
    return footballTurfComputePortalPayDue({
      mode: "DEPOSIT",
      depositAmountBaht: settings.depositAmountBaht,
      totalBaht: bookingUnitPrice,
    });
  }, [
    bookingPayMode,
    bookingSource,
    bookingUnitPrice,
    settings.depositAmountBaht,
  ]);
  const bookingDepositMisconfigured =
    bookingSource !== "WALK_IN" &&
    bookingPayMode === "DEPOSIT" &&
    Math.max(0, Math.round(Number(settings.depositAmountBaht ?? 0))) <= 0;
  const bookingPayDueTotal =
    bookingPayDueUnit != null && bookingPayDueUnit > 0
      ? bookingPayDueUnit * Math.max(1, editingBookingId != null ? 1 : bookingSelectedSlots.length)
      : null;
  const bookingRequiresPay =
    bookingSource === "WALK_IN"
      ? bookingSelectedTotal > 0
      : bookingPayDueTotal != null && bookingPayDueTotal > 0;
  const canSubmitBooking = Boolean(
    bookingCourt &&
      (editingBookingId != null
        ? bookingForm.startTime && bookingForm.endTime
        : bookingSelectedSlots.length > 0) &&
      bookingForm.customerName.trim() &&
      bookingForm.customerPhone.trim() &&
      !bookingDepositMisconfigured &&
      !(
        editingBookingId == null &&
        bookingForm.paymentMethod !== "ONSITE" &&
        bookingForm.paymentMethod !== "TRANSFER"
      ) &&
      !(
        editingBookingId == null &&
        bookingForm.paymentMethod === "TRANSFER" &&
        !bookingForm.paymentSlipDataUrl
      ),
  );
  const scheduleBoard = useMemo(
    () =>
      courts.map((court) => ({
        court,
        timeline: buildCourtTimeline(
          court,
          bookings
            .filter((item) => item.courtId === court.id && item.bookingDate === scheduleDate && item.status !== "CANCELLED")
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
        ),
      })),
    [courts, bookings, scheduleDate],
  );

  useEffect(() => {
    if (courts.length === 0) {
      setScheduleCourtId("");
      return;
    }
    setScheduleCourtId((prev) =>
      prev && courts.some((court) => String(court.id) === prev) ? prev : String(courts[0]!.id),
    );
  }, [courts]);

  const selectedScheduleBoard = useMemo(() => {
    if (!scheduleCourtId) return scheduleBoard[0] ?? null;
    return scheduleBoard.find(({ court }) => String(court.id) === scheduleCourtId) ?? scheduleBoard[0] ?? null;
  }, [scheduleBoard, scheduleCourtId]);

  const scheduleBoardTimeOpts = useMemo(() => {
    const liveNow = new Date(liveClockMs);
    return {
      scheduleDate,
      todayDateKey: localDateKey(liveNow),
      nowMinutes: localNowMinutes(liveNow),
    };
  }, [liveClockMs, scheduleDate]);

  const scheduleStatusCounts = useMemo(() => {
    const counts = {
      ALL: 0,
      FREE: 0,
      BOOKED: 0,
      CHECKED_IN: 0,
      COMPLETED: 0,
      PASSED: 0,
      NEEDS_CLOSE: 0,
    };
    if (!selectedScheduleBoard) return counts;
    for (const slot of selectedScheduleBoard.timeline) {
      counts.ALL += 1;
      const timePassed = isSlotTimePassed(slot, scheduleBoardTimeOpts);
      if (timePassed) {
        counts.PASSED += 1;
        continue;
      }
      const booking = slot.booking;
      if (!booking) {
        counts.FREE += 1;
        continue;
      }
      if (footballBookingNeedsClose(booking, scheduleBoardTimeOpts, bookings)) counts.NEEDS_CLOSE += 1;
      if (booking.status === "BOOKED") counts.BOOKED += 1;
      else if (booking.status === "CHECKED_IN" || booking.status === "PLAYING") counts.CHECKED_IN += 1;
      else if (booking.status === "COMPLETED") counts.COMPLETED += 1;
    }
    return counts;
  }, [bookings, scheduleBoardTimeOpts, selectedScheduleBoard]);

  const filteredScheduleTimeline = useMemo(() => {
    if (!selectedScheduleBoard) return [];
    return selectedScheduleBoard.timeline.filter((slot) => {
      const timePassed = isSlotTimePassed(slot, scheduleBoardTimeOpts);
      const booking = timePassed ? null : slot.booking;
      if (scheduleStatusFilter === "ALL") return true;
      if (scheduleStatusFilter === "PASSED") return timePassed;
      if (scheduleStatusFilter === "FREE") return !timePassed && !booking;
      if (scheduleStatusFilter === "NEEDS_CLOSE") {
        return Boolean(booking && footballBookingNeedsClose(booking, scheduleBoardTimeOpts, bookings));
      }
      if (!booking || timePassed) return false;
      if (scheduleStatusFilter === "BOOKED") return booking.status === "BOOKED";
      if (scheduleStatusFilter === "CHECKED_IN") {
        return booking.status === "CHECKED_IN" || booking.status === "PLAYING";
      }
      if (scheduleStatusFilter === "COMPLETED") return booking.status === "COMPLETED";
      return true;
    });
  }, [bookings, scheduleBoardTimeOpts, scheduleStatusFilter, selectedScheduleBoard]);

  const filteredOverviewCourts = useMemo(
    () => (overviewCourtId === "ALL" ? courts : courts.filter((court) => String(court.id) === overviewCourtId)),
    [courts, overviewCourtId],
  );
  const filteredOverviewBookings = useMemo(
    () =>
      selectedDayBookings.filter(
        (item) =>
          (overviewCourtId === "ALL" || String(item.courtId) === overviewCourtId) &&
          item.status !== "CANCELLED",
      ),
    [selectedDayBookings, overviewCourtId],
  );
  const overviewRevenueTotal = useMemo(
    () =>
      filteredOverviewBookings.reduce((sum, item) => sum + item.finalPrice, 0) +
      (overviewCourtId === "ALL" ? selectedDayPromotionRevenue : 0),
    [filteredOverviewBookings, overviewCourtId, selectedDayPromotionRevenue],
  );
  const overviewProfitTotal = useMemo(
    () => overviewRevenueTotal - (overviewCourtId === "ALL" ? selectedDayCostTotal : 0),
    [overviewRevenueTotal, overviewCourtId, selectedDayCostTotal],
  );
  const queueFilteredBookings = useMemo(() => {
    const keyword = queueSearch.trim().toLowerCase();
    const nowMinutes = localNowMinutes(new Date(liveClockMs));
    return bookings
      .filter((item) => {
        const matchesKeyword =
          !keyword ||
          `${item.teamName} ${item.customerName} ${item.customerPhone} ${item.courtName}`
            .toLowerCase()
            .includes(keyword);
        const matchesStatus = queueStatus === "ALL" || item.status === queueStatus;
        const matchesCourt = queueCourtId === "ALL" || String(item.courtId) === queueCourtId;
        const matchesDate = queueDateInPreset(
          item.bookingDate,
          queueDatePreset,
          todayDateKey,
          queueDateFrom,
          queueDateTo,
        );
        const overdue = footballBookingNeedsClose(item, { todayDateKey, nowMinutes }, bookings);
        if (queueNeedsCloseOnly && !overdue) return false;
        return matchesKeyword && matchesStatus && matchesCourt && matchesDate;
      })
      .sort((a, b) => {
        const aOver = footballBookingNeedsClose(a, { todayDateKey, nowMinutes }, bookings) ? 1 : 0;
        const bOver = footballBookingNeedsClose(b, { todayDateKey, nowMinutes }, bookings) ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        const byDate = b.bookingDate.localeCompare(a.bookingDate);
        if (byDate !== 0) return byDate;
        return timeToMinutes(b.startTime) - timeToMinutes(a.startTime);
      });
  }, [
    bookings,
    liveClockMs,
    queueCourtId,
    queueDateFrom,
    queueDatePreset,
    queueDateTo,
    queueNeedsCloseOnly,
    queueSearch,
    queueStatus,
    todayDateKey,
  ]);
  const queueNeedsCloseCount = useMemo(() => {
    const nowMinutes = localNowMinutes(new Date(liveClockMs));
    return bookings.filter((item) => footballBookingNeedsClose(item, { todayDateKey, nowMinutes }, bookings)).length;
  }, [bookings, liveClockMs, todayDateKey]);
  const queueFiltersActive = useMemo(
    () =>
      Boolean(queueSearch.trim()) ||
      queueStatus !== "ALL" ||
      queueCourtId !== "ALL" ||
      queueNeedsCloseOnly ||
      queueDatePreset !== "MONTH",
    [queueCourtId, queueDatePreset, queueNeedsCloseOnly, queueSearch, queueStatus],
  );
  const financeRows = useMemo(
    () =>
      [
        ...bookings
          .filter((item) => item.status !== "CANCELLED")
          .map((item) => ({
            id: `booking-${item.id}`,
            kind: "BOOKING" as const,
            amount: item.finalPrice,
            dateKey: item.bookingDate,
            dateLabel: `${item.bookingDate} · ${item.startTime}-${item.endTime}`,
            title: item.teamName || item.customerName,
            subtitle: `${item.courtName} · ${item.customerPhone}`,
            slipUrl: item.paymentSlipDataUrl?.trim() || "",
            categoryId: null as number | null,
            categoryKind: "COURT_RENTAL" as const,
            categoryLabel: "ค่าสนาม",
          })),
        ...promotionSales.map((item) => ({
          id: `promotion-${item.id}`,
          kind: "PROMOTION" as const,
          amount: item.price,
          dateKey: bangkokDateKey(new Date(item.createdAt)),
          dateLabel: new Date(item.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
          title: item.teamName || item.customerName,
          subtitle: `${item.promotionName} · ${item.customerPhone}`,
          slipUrl: item.paymentSlipDataUrl?.trim() || "",
          categoryId: null as number | null,
          categoryKind: "PROMOTION" as const,
          categoryLabel: "โปรโมชัน",
        })),
        ...incomeEntries.map((item) => ({
          id: `income-${item.id}`,
          kind: "INCOME" as const,
          amount: item.amount,
          dateKey: bangkokDateKey(new Date(item.earnedAt)),
          dateLabel: new Date(item.earnedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
          title: item.itemLabel || item.categoryName,
          subtitle: `${item.categoryName}${item.note ? ` · ${item.note}` : ""}`,
          slipUrl: item.paymentSlipUrl?.trim() || "",
          categoryId: item.categoryId as number | null,
          categoryKind: "CUSTOM" as const,
          categoryLabel: item.categoryName,
        })),
        ...costEntries.map((item) => ({
          id: `cost-${item.id}`,
          kind: "COST" as const,
          amount: item.amount,
          dateKey: bangkokDateKey(new Date(item.spentAt)),
          dateLabel: new Date(item.spentAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
          title: item.itemLabel,
          subtitle: `${item.categoryName}${item.note ? ` · ${item.note}` : ""}`,
          slipUrl: item.paymentSlipUrl?.trim() || "",
          categoryId: item.categoryId as number | null,
          categoryKind: null as null,
          categoryLabel: item.categoryName,
        })),
      ].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    [bookings, promotionSales, incomeEntries, costEntries],
  );
  const financeFilteredRows = useMemo(() => {
    const keyword = financeSearch.trim().toLowerCase();
    return financeRows.filter((item) => {
      const matchesKeyword = !keyword || `${item.title} ${item.subtitle}`.toLowerCase().includes(keyword);
      const matchesDate = dateKeyInRange(item.dateKey, financeRange, todayDateKey, financeStartDate, financeEndDate);
      return matchesKeyword && matchesDate;
    });
  }, [financeEndDate, financeRange, financeRows, financeSearch, financeStartDate, todayDateKey]);
  const financeHistoryRows = useMemo(
    () =>
      financeFilteredRows.filter((item) => {
        if (item.kind === "COST") return false;
        if (incomeFilterCat === "all") return true;
        if (incomeFilterCat === "COURT_RENTAL") return item.kind === "BOOKING";
        if (incomeFilterCat === "PROMOTION") return item.kind === "PROMOTION";
        return item.kind === "INCOME" && item.categoryId === incomeFilterCat;
      }),
    [financeFilteredRows, incomeFilterCat],
  );
  const financeExpenseRows = useMemo(
    () =>
      financeFilteredRows.filter(
        (item) => item.kind === "COST" && (costFilterCat === "all" || item.categoryId === costFilterCat),
      ),
    [costFilterCat, financeFilteredRows],
  );
  const financeRevenueTotal = useMemo(
    () =>
      financeFilteredRows
        .filter((item) => item.kind !== "COST")
        .reduce((sum, item) => sum + item.amount, 0),
    [financeFilteredRows],
  );
  const financeCostTotal = useMemo(
    () =>
      financeFilteredRows
        .filter((item) => item.kind === "COST")
        .reduce((sum, item) => sum + item.amount, 0),
    [financeFilteredRows],
  );
  const financeChartBuckets = useMemo(
    () => buildFinanceRevenueCostBuckets(financeFilteredRows, financeRange),
    [financeFilteredRows, financeRange],
  );
  const offersFilteredPromotions = useMemo(() => {
    const keyword = offersSearch.trim().toLowerCase();
    return promotions.filter((item) => !keyword || `${item.name} ${item.note}`.toLowerCase().includes(keyword));
  }, [offersSearch, promotions]);
  const offersFilteredSales = useMemo(() => {
    const keyword = offersSearch.trim().toLowerCase();
    return promotionSales.filter((item) => {
      const matchesKeyword =
        !keyword ||
        `${item.teamName} ${item.customerName} ${item.customerPhone} ${item.promotionName}`
          .toLowerCase()
          .includes(keyword);
      const matchesStatus = offersSaleStatus === "ALL" || item.status === offersSaleStatus;
      return matchesKeyword && matchesStatus;
    });
  }, [offersSaleStatus, offersSearch, promotionSales]);
  const offersStatsSummary = useMemo(() => {
    const packages = promotions.length;
    const packagesActive = promotions.filter((p) => p.isActive).length;
    const holders = promotionSales.length;
    const holdersActive = promotionSales.filter((s) => s.status === "ACTIVE").length;
    const holdersUsedUp = promotionSales.filter((s) => s.status === "USED_UP").length;
    const holdersPending = promotionSales.filter(
      (s) => s.paymentStatus === "PENDING_REVIEW" || s.paymentStatus === "UNPAID",
    ).length;
    return { packages, packagesActive, holders, holdersActive, holdersUsedUp, holdersPending };
  }, [promotions, promotionSales]);
  const customersFiltered = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();
    return customers.filter((item) => {
      if (customersMenu === "active" && !item.isActive) return false;
      if (customersMenu === "inactive" && item.isActive) return false;
      if (customersMenu === "tax" && !item.taxInvoiceEnabled) return false;
      if (customersMenu === "points" && !((item.pointsBalance ?? 0) > 0 || (item.totalEarned ?? 0) > 0)) {
        return false;
      }
      if (!keyword) return true;
      return `${item.name} ${item.phone} ${item.teamName} ${item.note}`.toLowerCase().includes(keyword);
    });
  }, [customerSearch, customers, customersMenu]);
  const customerStatsSummary = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const inactive = customers.filter((c) => !c.isActive).length;
    const taxReady = customers.filter((c) => c.taxInvoiceEnabled).length;
    const withPoints = customers.filter((c) => (c.pointsBalance ?? 0) > 0 || (c.totalEarned ?? 0) > 0).length;
    return { total, active, inactive, taxReady, withPoints };
  }, [customers]);
  const selectedSalePromotion = useMemo(
    () => promotions.find((item) => item.id === Number(saleForm.promotionId)) ?? promotions[0] ?? null,
    [promotions, saleForm.promotionId],
  );
  useEffect(() => {
    if (!saleOpen || saleForm.paymentMethod !== "TRANSFER" || !selectedSalePromotion || selectedSalePromotion.price <= 0) {
      setSalePromptPayQr({ dataUrl: null, loading: false, configured: true });
      return;
    }
    let cancelled = false;
    setSalePromptPayQr({ dataUrl: null, loading: true, configured: true });
    void ftApiFetch("/api/football-turf/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: selectedSalePromotion.price }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { qrDataUrl?: string | null; configured?: boolean };
        if (cancelled) return;
        setSalePromptPayQr({
          dataUrl: data.qrDataUrl ?? null,
          loading: false,
          configured: data.configured !== false,
        });
      })
      .catch(() => {
        if (!cancelled) setSalePromptPayQr({ dataUrl: null, loading: false, configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, [saleOpen, saleForm.paymentMethod, selectedSalePromotion?.id, selectedSalePromotion?.price]);
  useEffect(() => {
    const amount = bookingPayDueTotal ?? bookingSelectedTotal;
    if (
      !bookingOpen ||
      editingBookingId != null ||
      bookingForm.paymentMethod !== "TRANSFER" ||
      amount <= 0
    ) {
      setBookingPromptPayQr({ dataUrl: null, loading: false, configured: true });
      return;
    }
    let cancelled = false;
    setBookingPromptPayQr({ dataUrl: null, loading: true, configured: true });
    void ftApiFetch("/api/football-turf/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { qrDataUrl?: string | null; configured?: boolean };
        if (cancelled) return;
        setBookingPromptPayQr({
          dataUrl: data.qrDataUrl ?? null,
          loading: false,
          configured: data.configured !== false,
        });
      })
      .catch(() => {
        if (!cancelled) setBookingPromptPayQr({ dataUrl: null, loading: false, configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, [
    bookingOpen,
    bookingForm.paymentMethod,
    bookingPayDueTotal,
    bookingSelectedTotal,
    editingBookingId,
    ftApiFetch,
  ]);
  const overviewCourtLabel = overviewCourtId === "ALL"
    ? ""
    : (courts.find((court) => String(court.id) === overviewCourtId)?.name ?? "สนามที่เลือก");
  const overviewActiveFilterCount = Number(scheduleDate !== todayDateKey) + Number(overviewCourtId !== "ALL");
  const overviewFilterSummary = buildFilterSummary(
    [
      scheduleDate !== todayDateKey && `วันที่ ${scheduleDate}`,
      overviewCourtLabel && `สนาม ${overviewCourtLabel}`,
    ],
    "แสดงภาพรวมของทุกสนามในวันนี้",
  );
  const queueCourtLabel = queueCourtId === "ALL"
    ? ""
    : (courts.find((court) => String(court.id) === queueCourtId)?.name ?? "สนามที่เลือก");
  const queueActiveFilterCount =
    Number(Boolean(queueSearch.trim())) +
    Number(queueStatus !== "ALL") +
    Number(queueCourtId !== "ALL") +
    Number(queueNeedsCloseOnly) +
    Number(queueDatePreset !== "MONTH");
  const queueFilterSummary = buildFilterSummary(
    [
      queueSearch.trim() && `ค้นหา "${queueSearch.trim()}"`,
      queueStatus !== "ALL" && `สถานะ ${bookingStatusLabel(queueStatus as FootballTurfBooking["status"])}`,
      queueCourtLabel && `สนาม ${queueCourtLabel}`,
      queueNeedsCloseOnly && "ต้องปิดงาน",
      queueDatePreset !== "MONTH" &&
        ({ TODAY: "วันนี้", MONTH: "เดือนนี้", YEAR: "ปีนี้", CUSTOM: "ช่วงเวลา", ALL: "ทั้งหมด" } as const)[
          queueDatePreset
        ],
    ],
    "แสดงรายการจองเดือนนี้",
  );
  const financeRangeStart =
    financeStartDate && financeEndDate && financeStartDate > financeEndDate ? financeEndDate : financeStartDate;
  const financeRangeEnd =
    financeStartDate && financeEndDate && financeStartDate > financeEndDate ? financeStartDate : financeEndDate;
  const financeRangeLabel =
    financeRange === "TODAY"
      ? "วันนี้"
      : financeRange === "MONTH"
        ? "เดือนนี้"
        : financeRange === "YEAR"
          ? "ปีนี้"
          : financeRangeStart === financeRangeEnd
            ? `วันที่ ${financeRangeStart}`
            : `${financeRangeStart} ถึง ${financeRangeEnd}`;
  const financeFiltersActive = financeRange !== "MONTH" || Boolean(financeSearch.trim());
  const financeNetTotal = financeRevenueTotal - financeCostTotal;

  function selectFinanceRange(next: "TODAY" | "MONTH" | "YEAR" | "CUSTOM") {
    setFinanceRange(next);
    if (next === "CUSTOM" && !financeStartDate && !financeEndDate) {
      setFinanceStartDate(`${todayDateKey.slice(0, 7)}-01`);
      setFinanceEndDate(todayDateKey);
    }
  }

  function resetFinanceFilters() {
    setFinanceRange("MONTH");
    setFinanceSearch("");
    setFinanceStartDate(`${todayDateKey.slice(0, 7)}-01`);
    setFinanceEndDate(todayDateKey);
  }

  function resetCostForm() {
    setCostEditingId(null);
    setCostForm({
      categoryId: String(costCategories[0]?.id ?? 1),
      itemLabel: "",
      amount: "",
      note: "",
      paymentSlipUrl: "",
    });
  }

  function openCostCreate() {
    resetCostForm();
    setCostOpen(true);
  }

  function openCostEdit(entry: FootballTurfCostEntry) {
    setCostEditingId(entry.id);
    setCostForm({
      categoryId: String(entry.categoryId),
      itemLabel: entry.itemLabel,
      amount: String(entry.amount),
      note: entry.note,
      paymentSlipUrl: entry.paymentSlipUrl || "",
    });
    setCostOpen(true);
  }

  const customIncomeCategories = useMemo(
    () => incomeCategories.filter((c) => c.kind === "CUSTOM"),
    [incomeCategories],
  );

  function resetIncomeForm() {
    setIncomeEditingId(null);
    setIncomeForm({
      categoryId: String(customIncomeCategories[0]?.id ?? incomeCategories.find((c) => c.kind === "CUSTOM")?.id ?? ""),
      itemLabel: "",
      amount: "",
      note: "",
      paymentSlipUrl: "",
    });
  }

  function openIncomeCreate() {
    resetIncomeForm();
    setIncomeOpen(true);
  }

  function openIncomeEdit(entry: FootballTurfIncomeEntry) {
    setIncomeEditingId(entry.id);
    setIncomeForm({
      categoryId: String(entry.categoryId),
      itemLabel: entry.itemLabel,
      amount: String(entry.amount),
      note: entry.note,
      paymentSlipUrl: entry.paymentSlipUrl || "",
    });
    setIncomeOpen(true);
  }

  async function uploadIncomeSlip(file: File) {
    setIncomeSlipBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await ftApiFetch("/api/football-turf/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setIncomeForm((s) => ({ ...s, paymentSlipUrl: data.imageUrl! }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setIncomeSlipBusy(false);
    }
  }

  async function uploadCostSlip(file: File) {
    setCostSlipBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await ftApiFetch("/api/football-turf/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
      if (!res.ok || typeof j?.imageUrl !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
      }
      setCostForm((s) => ({ ...s, paymentSlipUrl: j.imageUrl! }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setCostSlipBusy(false);
    }
  }
  const offersStatusLabel =
    offersSaleStatus === "ACTIVE"
      ? "ยังใช้ได้"
      : offersSaleStatus === "USED_UP"
        ? "ใช้ครบแล้ว"
        : "";
  const offersActiveFilterCount =
    Number(Boolean(offersSearch.trim())) +
    Number(offersSaleStatus !== "ALL");
  const offersFilterSummary = buildFilterSummary(
    [
      offersSearch.trim() && `ค้นหา "${offersSearch.trim()}"`,
      offersStatusLabel && `สถานะ ${offersStatusLabel}`,
    ],
    "แสดงโปรโมชั่นและสิทธิ์ทั้งหมด",
  );

  function resolveBookingSlot(nextCourtId: string, nextBookingDate: string, preferredStart?: string, preferredEnd?: string) {
    const court = courts.find((item) => item.id === Number(nextCourtId)) ?? courts[0] ?? null;
    if (!court) {
      return { startTime: "", endTime: "" };
    }
    const now = new Date(liveClockMs);
    const timeOpts = {
      scheduleDate: nextBookingDate,
      todayDateKey: localDateKey(now),
      nowMinutes: localNowMinutes(now),
    };
    const timeline = buildCourtTimeline(
      court,
      bookings
        .filter(
          (item) =>
            item.courtId === court.id &&
            item.bookingDate === nextBookingDate &&
            item.status !== "CANCELLED",
        )
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    );
    const isOpen = (slot: { startTime: string; endTime: string; booking: unknown }) =>
      !slot.booking && !isSlotTimePassed(slot, timeOpts);
    const preferredSlot =
      timeline.find(
        (slot) =>
          isOpen(slot) && slot.startTime === preferredStart && slot.endTime === preferredEnd,
      ) ?? null;
    const availableSlot = preferredSlot ?? timeline.find((slot) => isOpen(slot)) ?? null;
    return availableSlot
      ? { startTime: availableSlot.startTime, endTime: availableSlot.endTime }
      : { startTime: "", endTime: "" };
  }

  function resolveAvailableSlotsOnCourt(
    nextCourtId: string,
    nextBookingDate: string,
    preferred: Array<{ startTime: string; endTime: string }>,
    source: FootballTurfBookingSource = bookingSource,
  ) {
    const court = courts.find((item) => item.id === Number(nextCourtId)) ?? courts[0] ?? null;
    if (!court) return [] as Array<{ startTime: string; endTime: string }>;
    const now = new Date(liveClockMs);
    const timeOpts = {
      scheduleDate: nextBookingDate,
      todayDateKey: localDateKey(now),
      nowMinutes: localNowMinutes(now),
    };
    const timeline = buildCourtTimeline(
      court,
      bookings
        .filter(
          (item) =>
            item.courtId === court.id &&
            item.bookingDate === nextBookingDate &&
            item.status !== "CANCELLED",
        )
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    );
    const eligible =
      source === "WALK_IN"
        ? listWalkInEligibleSlots(timeline, timeOpts)
        : listAdvanceBookingEligibleSlots(timeline, timeOpts);
    const freeKeys = new Set(eligible.map((slot) => `${slot.startTime}|${slot.endTime}`));
    const kept = preferred
      .filter((slot) => freeKeys.has(`${slot.startTime}|${slot.endTime}`))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    if (kept.length > 0) {
      // walk-in เลือกได้ทีละรอบ
      return source === "WALK_IN" ? kept.slice(0, 1) : kept;
    }
    const first = eligible[0];
    return first ? [{ startTime: first.startTime, endTime: first.endTime }] : [];
  }

  function applySelectedSlots(
    slots: Array<{ startTime: string; endTime: string }>,
  ): Pick<typeof bookingForm, "selectedSlots" | "startTime" | "endTime"> {
    const sorted = [...slots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const primary = sorted[0] ?? { startTime: "", endTime: "" };
    return {
      selectedSlots: sorted,
      startTime: primary.startTime,
      endTime: primary.endTime,
    };
  }

  function toggleBookingSlot(startTime: string, endTime: string) {
    const slot = bookingTimeline.find((row) => row.startTime === startTime && row.endTime === endTime);
    if (!slot) return;
    const eligible =
      bookingSource === "WALK_IN"
        ? isSlotEligibleForWalkIn(slot, bookingTimeline, bookingFormTimeOpts)
        : isSlotEligibleForAdvanceBooking(slot, bookingFormTimeOpts);
    if (!eligible) return;
    setBookingForm((state) => {
      const exists = state.selectedSlots.some(
        (row) => row.startTime === startTime && row.endTime === endTime,
      );
      if (bookingSource === "WALK_IN") {
        // walk-in เลือกได้ทีละรอบ
        const next = exists ? [] : [{ startTime, endTime }];
        return { ...state, ...applySelectedSlots(next) };
      }
      const next = exists
        ? state.selectedSlots.filter(
            (row) => !(row.startTime === startTime && row.endTime === endTime),
          )
        : [...state.selectedSlots, { startTime, endTime }];
      return { ...state, ...applySelectedSlots(next) };
    });
  }

  function closeBookingModal() {
    setBookingOpen(false);
    setEditingBookingId(null);
    setBookingTax(emptyTaxFields());
    setBookingCustomerCandidates([]);
    setBookingCustomerHint(null);
    setBookingForm((state) => ({
      ...state,
      customerName: "",
      customerPhone: "",
      teamName: "",
      note: "",
      paymentMethod: "ONSITE",
      paymentStatus: "UNPAID",
      paymentReference: "",
      paymentSlipDataUrl: "",
    }));
  }

  function openEditBookingModal(booking: FootballTurfBooking) {
    setEditingBookingId(booking.id);
    setBookingSource(booking.source);
    setBookingForm({
      courtId: String(booking.courtId),
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      selectedSlots: [{ startTime: booking.startTime, endTime: booking.endTime }],
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      teamName: booking.teamName,
      playerCount: String(booking.playerCount),
      note: booking.note,
      paymentMethod: (booking.paymentMethod as FootballTurfBookingPaymentMethod) || "UNPAID",
      paymentStatus: booking.paymentStatus ?? "UNPAID",
      paymentReference: booking.paymentReference ?? "",
      paymentSlipDataUrl: booking.paymentSlipDataUrl ?? "",
    });
    const phoneKey = booking.customerPhone.replace(/\D/g, "");
    const cust = customers.find(
      (c) => c.phone.replace(/\D/g, "") === phoneKey || c.phone === booking.customerPhone,
    );
    setBookingTax(cust ? taxFieldsFromCustomer(cust) : emptyTaxFields());
    setBookingCustomerCandidates([]);
    setBookingCustomerHint(
      cust
        ? customerHasTaxProfile(cust)
          ? `สมาชิก ${cust.name || cust.phone} · มีข้อมูลใบกำกับ`
          : `สมาชิก ${cust.name || cust.phone}`
        : null,
    );
    setBookingOpen(true);
  }

  function openCourtModal(court?: FootballTurfCourt) {
    if (court) {
      setEditingCourtId(court.id);
      setCourtForm({
        name: court.name,
        openTime: court.openTime,
        closeTime: court.closeTime,
        slotMinutes: String(court.slotMinutes),
        weekdayPrice: String(court.weekdayPrice),
        weekendPrice: String(court.weekendPrice),
        imageUrl: court.imageUrl ?? "",
        isActive: court.isActive,
      });
    } else {
      setEditingCourtId(null);
      setCourtForm({
        name: "",
        openTime: "16:00",
        closeTime: "23:00",
        slotMinutes: "60",
        weekdayPrice: "900",
        weekendPrice: "1200",
        imageUrl: "",
        isActive: true,
      });
    }
    setCourtOpen(true);
  }

  function closeCourtModal() {
    setCourtOpen(false);
    setEditingCourtId(null);
    setCourtForm({
      name: "",
      openTime: "16:00",
      closeTime: "23:00",
      slotMinutes: "60",
      weekdayPrice: "900",
      weekendPrice: "1200",
      imageUrl: "",
      isActive: true,
    });
  }

  async function onCourtImageSelected(file: File | null) {
    if (!file) return;
    setCourtImageBusy(true);
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setCourtForm((state) => ({ ...state, imageUrl: dataUrl }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "แนบรูปไม่สำเร็จ");
    } finally {
      setCourtImageBusy(false);
    }
  }

  function openPromotionModal(promotion?: FootballTurfPromotion) {
    if (promotion) {
      setEditingPromotionId(promotion.id);
      setPromotionForm({
        name: promotion.name,
        kind: promotion.kind,
        totalUses: String(promotion.totalUses),
        durationMinutes: String(promotion.durationMinutes),
        price: String(promotion.price),
        note: promotion.note,
        isActive: promotion.isActive,
      });
    } else {
      setEditingPromotionId(null);
      setPromotionForm({
        name: "",
        kind: "COUNT",
        totalUses: "10",
        durationMinutes: "60",
        price: "0",
        note: "",
        isActive: true,
      });
    }
    setPromotionOpen(true);
  }

  function closePromotionModal() {
    setPromotionOpen(false);
    setEditingPromotionId(null);
    setPromotionForm({
      name: "",
      kind: "COUNT",
      totalUses: "10",
      durationMinutes: "60",
      price: "0",
      note: "",
      isActive: true,
    });
  }

  function openPromotionSaleEditModal(sale: FootballTurfPromotionSale) {
    setEditingPromotionSaleId(sale.id);
    const phoneKey = sale.customerPhone.replace(/\D/g, "");
    const cust = customers.find(
      (c) => c.phone.replace(/\D/g, "") === phoneKey || c.phone === sale.customerPhone,
    );
    const tax = cust ? taxFieldsFromCustomer(cust) : emptyTaxFields();
    setSaleEditForm({
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      teamName: sale.teamName,
      remainingUses: String(sale.remainingUses),
      status: sale.status,
      paymentMethod: sale.paymentMethod ?? "ONSITE",
      paymentStatus: sale.paymentStatus ?? "PAID",
      paymentReference: sale.paymentReference ?? "",
      paymentSlipDataUrl: sale.paymentSlipDataUrl ?? "",
      ...tax,
      billingName: tax.billingName || sale.customerName || "",
    });
    setSaleEditCustomerCandidates([]);
    setSaleEditCustomerHint(
      cust
        ? customerHasTaxProfile(cust)
          ? `สมาชิก ${cust.name || cust.phone} · มีข้อมูลใบกำกับ`
          : `สมาชิก ${cust.name || cust.phone}`
        : null,
    );
    setSaleEditOpen(true);
  }

  function closePromotionSaleEditModal() {
    setSaleEditOpen(false);
    setEditingPromotionSaleId(null);
    setSaleEditCustomerCandidates([]);
    setSaleEditCustomerHint(null);
    setSaleEditForm({
      customerName: "",
      customerPhone: "",
      teamName: "",
      remainingUses: "0",
      status: "ACTIVE",
      paymentMethod: "ONSITE",
      paymentStatus: "PAID",
      paymentReference: "",
      paymentSlipDataUrl: "",
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
    });
  }

  async function onBookingEditSlipSelected(file: File | null) {
    if (!file) return;
    setBookingEditSlipBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await ftApiFetch("/api/football-turf/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
      if (!res.ok || typeof j?.imageUrl !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
      }
      setBookingForm((s) => ({ ...s, paymentMethod: "TRANSFER", paymentSlipDataUrl: j.imageUrl! }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setBookingEditSlipBusy(false);
    }
  }

  async function onSaleEditSlipSelected(file: File | null) {
    if (!file) return;
    setSaleEditSlipBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await ftApiFetch("/api/football-turf/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
      if (!res.ok || typeof j?.imageUrl !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดสลิปไม่สำเร็จ");
      }
      setSaleEditForm((s) => ({ ...s, paymentMethod: "TRANSFER", paymentSlipDataUrl: j.imageUrl! }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setSaleEditSlipBusy(false);
    }
  }

  function closeSaleModal() {
    setSaleOpen(false);
    setSaleCustomerCandidates([]);
    setSaleCustomerHint(null);
    setSaleForm({
      promotionId: String(promotions[0]?.id ?? 1),
      customerName: "",
      customerPhone: "",
      teamName: "",
      paymentMethod: "ONSITE",
      paymentReference: "",
      paymentSlipDataUrl: "",
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
    });
    setSalePromptPayQr({ dataUrl: null, loading: false, configured: true });
  }

  function applyCustomerTaxToSaleForm(phone: string, nameHint?: string) {
    const matches = findFootballTurfCustomersByPhone(customers, phone);
    const cust =
      matches.length === 1
        ? matches[0]
        : matches.find((c) => normalizeFtPhoneDigits(c.phone) === normalizeFtPhoneDigits(phone));
    if (!cust) return;
    const tax = taxFieldsFromCustomer(cust);
    setSaleForm((s) => ({
      ...s,
      customerPhone: cust.phone || s.customerPhone,
      customerName: s.customerName.trim() || cust.name || nameHint || "",
      teamName: s.teamName.trim() || cust.teamName,
      ...(tax.taxInvoiceEnabled ? tax : {}),
    }));
    setSaleCustomerHint(
      tax.taxInvoiceEnabled
        ? `พบสมาชิก ${cust.name || cust.phone} · ดึงข้อมูลใบกำกับแล้ว`
        : `พบสมาชิก ${cust.name || cust.phone}`,
    );
    setSaleCustomerCandidates([]);
  }

  function applyCustomerToBooking(cust: FootballTurfCustomer) {
    setBookingForm((s) => ({
      ...s,
      customerPhone: cust.phone,
      customerName: cust.name || s.customerName,
      teamName: cust.teamName || s.teamName,
    }));
    setBookingTax(taxFieldsFromCustomer(cust));
    setBookingCustomerCandidates([]);
    setBookingCustomerHint(
      customerHasTaxProfile(cust)
        ? `พบสมาชิก ${cust.name || cust.phone} · ดึงข้อมูลใบกำกับแล้ว`
        : `พบสมาชิก ${cust.name || cust.phone}`,
    );
  }

  function searchBookingCustomer(rawPhone?: string) {
    const q = (rawPhone ?? bookingForm.customerPhone).trim();
    const matches = findFootballTurfCustomersByPhone(customers, q);
    if (matches.length === 0) {
      setBookingCustomerCandidates([]);
      setBookingCustomerHint(normalizeFtPhoneDigits(q).length >= 4 ? "ไม่พบสมาชิกจากเบอร์นี้" : "กรอกเบอร์อย่างน้อย 4 หลัก");
      return;
    }
    if (matches.length === 1) {
      applyCustomerToBooking(matches[0]);
      return;
    }
    setBookingCustomerCandidates(matches);
    setBookingCustomerHint(`พบ ${matches.length} รายการ — เลือกเบอร์ด้านล่าง`);
  }

  function searchSaleCustomer(rawPhone?: string) {
    const q = (rawPhone ?? saleForm.customerPhone).trim();
    const matches = findFootballTurfCustomersByPhone(customers, q);
    if (matches.length === 0) {
      setSaleCustomerCandidates([]);
      setSaleCustomerHint(normalizeFtPhoneDigits(q).length >= 4 ? "ไม่พบสมาชิกจากเบอร์นี้" : "กรอกเบอร์อย่างน้อย 4 หลัก");
      return;
    }
    if (matches.length === 1) {
      applyCustomerTaxToSaleForm(matches[0].phone, matches[0].name);
      setSaleForm((s) => ({
        ...s,
        customerPhone: matches[0].phone,
        customerName: s.customerName.trim() || matches[0].name,
        teamName: s.teamName.trim() || matches[0].teamName,
      }));
      return;
    }
    setSaleCustomerCandidates(matches);
    setSaleCustomerHint(`พบ ${matches.length} รายการ — เลือกเบอร์ด้านล่าง`);
  }

  function applyCustomerToSaleEdit(cust: FootballTurfCustomer) {
    const tax = taxFieldsFromCustomer(cust);
    setSaleEditForm((s) => ({
      ...s,
      customerPhone: cust.phone,
      customerName: cust.name || s.customerName,
      teamName: cust.teamName || s.teamName,
      ...tax,
    }));
    setSaleEditCustomerCandidates([]);
    setSaleEditCustomerHint(
      customerHasTaxProfile(cust)
        ? `พบสมาชิก ${cust.name || cust.phone} · ดึงข้อมูลใบกำกับแล้ว`
        : `พบสมาชิก ${cust.name || cust.phone}`,
    );
  }

  function searchSaleEditCustomer(rawPhone?: string) {
    const q = (rawPhone ?? saleEditForm.customerPhone).trim();
    const matches = findFootballTurfCustomersByPhone(customers, q);
    if (matches.length === 0) {
      setSaleEditCustomerCandidates([]);
      setSaleEditCustomerHint(normalizeFtPhoneDigits(q).length >= 4 ? "ไม่พบสมาชิกจากเบอร์นี้" : "กรอกเบอร์อย่างน้อย 4 หลัก");
      return;
    }
    if (matches.length === 1) {
      applyCustomerToSaleEdit(matches[0]);
      return;
    }
    setSaleEditCustomerCandidates(matches);
    setSaleEditCustomerHint(`พบ ${matches.length} รายการ — เลือกเบอร์ด้านล่าง`);
  }

  async function upsertCustomerFromBookingFields() {
    const phone = bookingForm.customerPhone.trim();
    if (!phone) return;
    const phoneKey = normalizeFtPhoneDigits(phone);
    const existing = customers.find(
      (c) => normalizeFtPhoneDigits(c.phone) === phoneKey || c.phone === phone,
    );
    const taxPayload = {
      taxInvoiceEnabled: bookingTax.taxInvoiceEnabled,
      billingName: bookingTax.taxInvoiceEnabled
        ? bookingTax.billingName.trim() || bookingForm.customerName.trim()
        : "",
      taxId: bookingTax.taxInvoiceEnabled ? bookingTax.taxId.trim() : "",
      taxAddress: bookingTax.taxInvoiceEnabled ? bookingTax.taxAddress.trim() : "",
      taxBranch: bookingTax.taxInvoiceEnabled ? bookingTax.taxBranch.trim() : "",
    };
    if (existing) {
      await repo.updateCustomer(existing.id, {
        name: bookingForm.customerName.trim() || existing.name,
        phone,
        teamName: bookingForm.teamName.trim() || existing.teamName,
        ...taxPayload,
      });
    } else if (bookingTax.taxInvoiceEnabled || bookingForm.customerName.trim()) {
      await repo.createCustomer({
        name: bookingForm.customerName.trim() || phone,
        phone,
        teamName: bookingForm.teamName.trim(),
        note: "",
        isActive: true,
        photoUrl: "",
        ...taxPayload,
      });
    }
  }

  async function onSaleSlipSelected(file: File | null) {
    if (!file) return;
    setSaleSlipBusy(true);
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setSaleForm((state) => ({ ...state, paymentSlipDataUrl: dataUrl, paymentMethod: "TRANSFER" }));
    } catch (error) {
      console.error(error);
    } finally {
      setSaleSlipBusy(false);
    }
  }

  async function onBookingSlipSelected(file: File | null) {
    if (!file) return;
    setBookingSlipBusy(true);
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setBookingForm((state) => ({ ...state, paymentSlipDataUrl: dataUrl, paymentMethod: "TRANSFER" }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "แนบสลิปไม่สำเร็จ");
    } finally {
      setBookingSlipBusy(false);
    }
  }

  function openCustomerModal(customer?: FootballTurfCustomer) {
    if (customer) {
      setEditingCustomerId(customer.id);
      setCustomerForm({
        name: customer.name,
        phone: customer.phone,
        teamName: customer.teamName,
        note: customer.note,
        isActive: customer.isActive,
        taxInvoiceEnabled: Boolean(customer.taxInvoiceEnabled),
        billingName: customer.billingName || "",
        taxId: customer.taxId || "",
        taxAddress: customer.taxAddress || "",
        taxBranch: customer.taxBranch || "",
        photoUrl: customer.photoUrl || "",
      });
    } else {
      setEditingCustomerId(null);
      setCustomerForm({
        name: "",
        phone: "",
        teamName: "",
        note: "",
        isActive: true,
        taxInvoiceEnabled: false,
        billingName: "",
        taxId: "",
        taxAddress: "",
        taxBranch: "",
        photoUrl: "",
      });
    }
    setCustomerOpen(true);
  }

  function closeCustomerModal() {
    setCustomerOpen(false);
    setEditingCustomerId(null);
    setCustomerForm({
      name: "",
      phone: "",
      teamName: "",
      note: "",
      isActive: true,
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
      photoUrl: "",
    });
  }

  async function onCustomerPhotoSelected(file: File | null) {
    if (!file) return;
    setCustomerPhotoBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await ftApiFetch("/api/football-turf/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
      if (!res.ok || typeof j?.imageUrl !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดรูปไม่สำเร็จ");
      }
      setCustomerForm((s) => ({ ...s, photoUrl: j.imageUrl! }));
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setCustomerPhotoBusy(false);
    }
  }

  function openBookingModal(source: FootballTurfBookingSource) {
    setEditingBookingId(null);
    const today = localDateKey(new Date(liveClockMs));
    const nextCourtId = bookingForm.courtId || String(courts[0]?.id ?? 1);
    const nextBookingDate = source === "WALK_IN" ? today : bookingForm.bookingDate || today;
    const nextSlots = resolveAvailableSlotsOnCourt(
      nextCourtId,
      nextBookingDate,
      bookingForm.selectedSlots,
      source,
    );
    setBookingSource(source);
    setBookingPayMode(source === "WALK_IN" ? "FULL" : "DEPOSIT");
    setBookingForm((state) => ({
      ...state,
      courtId: nextCourtId,
      bookingDate: nextBookingDate,
      ...applySelectedSlots(nextSlots),
      customerName: "",
      customerPhone: "",
      teamName: "",
      playerCount: "",
      note: "",
      paymentMethod: source === "WALK_IN" ? "ONSITE" : "TRANSFER",
      paymentStatus: "UNPAID",
      paymentReference: "",
      paymentSlipDataUrl: "",
    }));
    setBookingTax(emptyTaxFields());
    setBookingCustomerCandidates([]);
    setBookingCustomerHint(null);
    setBookingOpen(true);
  }

  /** เปิดฟอร์มจอง/walk-in จากการ์ดสนาม (วันนี้ + สล็อตว่างตามโหมด) */
  function openCourtLiveBooking(
    court: FootballTurfCourt,
    source: FootballTurfBookingSource,
    preferredSlot?: { startTime: string; endTime: string },
  ) {
    const today = localDateKey(new Date(liveClockMs));
    const nextSlots = resolveAvailableSlotsOnCourt(
      String(court.id),
      today,
      preferredSlot ? [preferredSlot] : [],
      source,
    );
    setEditingBookingId(null);
    setBookingSource(source);
    setBookingPayMode(source === "WALK_IN" ? "FULL" : "DEPOSIT");
    setBookingForm((state) => ({
      ...state,
      courtId: String(court.id),
      bookingDate: today,
      ...applySelectedSlots(nextSlots),
      customerName: "",
      customerPhone: "",
      teamName: "",
      playerCount: "",
      note: "",
      paymentMethod: source === "WALK_IN" ? "ONSITE" : "TRANSFER",
      paymentStatus: "UNPAID",
      paymentReference: "",
      paymentSlipDataUrl: "",
    }));
    setBookingTax(emptyTaxFields());
    setBookingCustomerCandidates([]);
    setBookingCustomerHint(null);
    setBookingOpen(true);
  }

  /** จองช่วงเวลาว่างจากตาราง — เฉพาะรอบถัดไป */
  function openScheduleSlotBooking(court: FootballTurfCourt, startTime: string, endTime: string) {
    const timeOpts = {
      scheduleDate: scheduleDate,
      todayDateKey: localDateKey(new Date(liveClockMs)),
      nowMinutes: localNowMinutes(new Date(liveClockMs)),
    };
    if (!isSlotEligibleForAdvanceBooking({ startTime, endTime, booking: null }, timeOpts)) {
      notice.error("จองได้เฉพาะรอบถัดไปที่ยังไม่เริ่ม");
      return;
    }
    setEditingBookingId(null);
    setBookingSource("ONLINE");
    setBookingPayMode("DEPOSIT");
    setBookingForm((state) => ({
      ...state,
      courtId: String(court.id),
      bookingDate: scheduleDate,
      ...applySelectedSlots([{ startTime, endTime }]),
      customerName: "",
      customerPhone: "",
      teamName: "",
      playerCount: "",
      note: "",
      paymentMethod: "TRANSFER",
      paymentStatus: "UNPAID",
      paymentReference: "",
      paymentSlipDataUrl: "",
    }));
    setBookingOpen(true);
  }

  async function onMarkBookingNoShow(id: number) {
    const ok = await notice.confirm("ลูกค้าไม่มา · ยกเลิกคิวและเปิดสนามใช่หรือไม่?", {
      title: "ไม่มา · เปิดคิว",
      confirmLabel: "เปิดคิว",
      tone: "warning",
    });
    if (!ok) return;
    await runSave(async () => {
      const updated = await repo.updateBooking(id, { status: "CANCELLED" });
      if (storageOnly) {
        await refresh();
      } else if (updated) {
        applyLiveEvent({
          type: "booking.upsert",
          at: new Date().toISOString(),
          bookings: [updated],
        });
      }
    });
  }

  function updateBookingCourt(nextCourtId: string) {
    if (editingBookingId != null) {
      const nextSlot = resolveBookingSlot(
        nextCourtId,
        bookingForm.bookingDate,
        bookingForm.startTime,
        bookingForm.endTime,
      );
      setBookingForm((state) => ({
        ...state,
        courtId: nextCourtId,
        ...applySelectedSlots(
          nextSlot.startTime ? [{ startTime: nextSlot.startTime, endTime: nextSlot.endTime }] : [],
        ),
      }));
      return;
    }
    const nextSlots = resolveAvailableSlotsOnCourt(
      nextCourtId,
      bookingForm.bookingDate,
      bookingForm.selectedSlots,
      bookingSource,
    );
    setBookingForm((state) => ({
      ...state,
      courtId: nextCourtId,
      ...applySelectedSlots(nextSlots),
    }));
  }

  function updateBookingDate(nextBookingDate: string) {
    if (editingBookingId != null) {
      const nextSlot = resolveBookingSlot(
        bookingForm.courtId,
        nextBookingDate,
        bookingForm.startTime,
        bookingForm.endTime,
      );
      setBookingForm((state) => ({
        ...state,
        bookingDate: nextBookingDate,
        ...applySelectedSlots(
          nextSlot.startTime ? [{ startTime: nextSlot.startTime, endTime: nextSlot.endTime }] : [],
        ),
      }));
      return;
    }
    const nextSlots = resolveAvailableSlotsOnCourt(
      bookingForm.courtId,
      nextBookingDate,
      bookingForm.selectedSlots,
      bookingSource,
    );
    setBookingForm((state) => ({
      ...state,
      bookingDate: nextBookingDate,
      ...applySelectedSlots(nextSlots),
    }));
  }

  async function onCreateBooking() {
    const court = courts.find((item) => item.id === Number(bookingForm.courtId)) ?? courts[0];
    if (!court || !canSubmitBooking || bookingSaving) return;
    setBookingSaving(true);
    try {
    await runSave(async () => {
      if (editingBookingId != null) {
        if (bookingTax.taxInvoiceEnabled) {
          if ((bookingTax.billingName.trim() || bookingForm.customerName.trim()).length < 2) {
            notice.error("กรอกชื่อในใบกำกับภาษีให้ถูกต้อง");
            return;
          }
          if (!isValidThaiId13(bookingTax.taxId)) {
            notice.error("เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก");
            return;
          }
          if (bookingTax.taxAddress.trim().length < 8) {
            notice.error("กรอกที่อยู่ในใบกำกับภาษีให้ครบ");
            return;
          }
        }
        const method =
          bookingForm.paymentMethod === "TRANSFER"
            ? ("TRANSFER" as const)
            : bookingForm.paymentMethod === "ONSITE"
              ? ("ONSITE" as const)
              : ("UNPAID" as const);
        const updated = await repo.updateBooking(editingBookingId, {
          courtId: court.id,
          courtName: court.name,
          bookingDate: bookingForm.bookingDate,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          customerName: bookingForm.customerName.trim(),
          customerPhone: bookingForm.customerPhone.trim(),
          teamName: bookingForm.teamName.trim(),
          playerCount: Number(bookingForm.playerCount) || 0,
          note: bookingForm.note.trim(),
          paymentMethod: method,
          paymentStatus: bookingForm.paymentStatus,
          paymentReference: bookingForm.paymentReference.trim(),
          paymentSlipDataUrl: method === "TRANSFER" ? bookingForm.paymentSlipDataUrl : "",
        });
        await upsertCustomerFromBookingFields();
        closeBookingModal();
        if (storageOnly) {
          await refresh();
        } else if (updated) {
          applyLiveEvent({
            type: "booking.upsert",
            at: new Date().toISOString(),
            bookings: [updated],
          });
        }
        return;
      } else {
        if (bookingSelectedSlots.length === 0) return;
        if (bookingTax.taxInvoiceEnabled) {
          if ((bookingTax.billingName.trim() || bookingForm.customerName.trim()).length < 2) {
            notice.error("กรอกชื่อในใบกำกับภาษีให้ถูกต้อง");
            return;
          }
          if (!isValidThaiId13(bookingTax.taxId)) {
            notice.error("เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก");
            return;
          }
          if (bookingTax.taxAddress.trim().length < 8) {
            notice.error("กรอกที่อยู่ในใบกำกับภาษีให้ครบ");
            return;
          }
        }
        if (bookingDepositMisconfigured) {
          notice.error("เลือกมัดจำแล้ว แต่ยังไม่ได้ตั้งจำนวนมัดจำในแท็บตั้งค่า");
          return;
        }
        const isWeekend = isBangkokWeekend(bookingForm.bookingDate);
        const listedPrice = isWeekend ? court.weekendPrice : court.weekdayPrice;
        const isWalkIn = bookingSource === "WALK_IN";
        if (isWalkIn) {
          const today = localDateKey(new Date(liveClockMs));
          if (bookingForm.bookingDate !== today) {
            notice.error("เช็คอินหน้างานใช้ได้เฉพาะวันนี้");
            return;
          }
        }
        for (const slot of bookingSelectedSlots) {
          const ok = isWalkIn
            ? isSlotEligibleForWalkIn(slot, bookingTimeline, bookingFormTimeOpts)
            : isSlotEligibleForAdvanceBooking(slot, bookingFormTimeOpts);
          if (!ok) {
            notice.error(
              isWalkIn
                ? "เช็คอินได้เฉพาะรอบปัจจุบันหรือรอบถัดไปที่ว่าง"
                : "จองได้เฉพาะรอบถัดไปที่ยังไม่เริ่ม",
            );
            return;
          }
        }
        const uniqueSlots = Array.from(
          new Map(
            bookingSelectedSlots.map((slot) => [`${slot.startTime}|${slot.endTime}`, slot] as const),
          ).values(),
        );
        const payDue = isWalkIn
          ? listedPrice
          : footballTurfComputePortalPayDue({
              mode: bookingPayMode,
              depositAmountBaht: settings.depositAmountBaht,
              totalBaht: listedPrice,
            });
        const method =
          bookingForm.paymentMethod === "TRANSFER"
            ? ("TRANSFER" as const)
            : bookingForm.paymentMethod === "ONSITE"
              ? ("ONSITE" as const)
              : ("UNPAID" as const);
        if (isWalkIn && method === "UNPAID") {
          notice.error("walk-in ต้องเลือกชำระเงินสดหรือโอนเต็มยอด");
          return;
        }
        if (!isWalkIn && (bookingPayMode === "DEPOSIT" || bookingPayMode === "FULL") && method === "UNPAID") {
          notice.error("เลือกชำระมัดจำหรือเต็มแล้ว — เลือกเงินสดหรือโอน");
          return;
        }
        const amountPaidBaht =
          method === "TRANSFER" || method === "ONSITE"
            ? Math.max(0, Math.round(Number(payDue ?? (isWalkIn ? listedPrice : 0))))
            : 0;
        if (isWalkIn && amountPaidBaht < listedPrice) {
          notice.error("walk-in ต้องชำระเต็มยอด");
          return;
        }
        const paymentStatus =
          method === "TRANSFER"
            ? ("PENDING_REVIEW" as const)
            : footballTurfComputePaymentStatus(listedPrice, amountPaidBaht);
        const shared = {
          courtId: court.id,
          courtName: court.name,
          bookingDate: bookingForm.bookingDate,
          customerName: bookingForm.customerName.trim(),
          customerPhone: bookingForm.customerPhone.trim(),
          teamName: bookingForm.teamName.trim(),
          playerCount: Number(bookingForm.playerCount) || 0,
          source: bookingSource,
          status: isWalkIn ? ("CHECKED_IN" as const) : ("BOOKED" as const),
          listedPrice,
          finalPrice: listedPrice,
          depositAmountBaht: payDue,
          amountPaidBaht,
          promotionSaleId: null,
          note: bookingForm.note.trim(),
          paymentMethod: method,
          paymentStatus,
          paymentSlipDataUrl: method === "TRANSFER" ? bookingForm.paymentSlipDataUrl : "",
          paymentReference: bookingForm.paymentReference.trim(),
        };
        const createdRows: FootballTurfBooking[] = [];
        for (const slot of uniqueSlots) {
          const created = await repo.createBooking({
            ...shared,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
          createdRows.push(created);
        }
        await upsertCustomerFromBookingFields();
        closeBookingModal();
        if (storageOnly) {
          await refresh();
        } else if (createdRows.length > 0) {
          applyLiveEvent({
            type: "booking.upsert",
            at: new Date().toISOString(),
            bookings: createdRows,
          });
        }
        return;
      }
    });
    } finally {
      setBookingSaving(false);
    }
  }

  async function onSaveCourt() {
    const name = courtForm.name.trim();
    if (!name) return;
    await runSave(async () => {
      const payload = {
        name,
        openTime: courtForm.openTime,
        closeTime: courtForm.closeTime,
        slotMinutes: Number(courtForm.slotMinutes) || 60,
        weekdayPrice: Number(courtForm.weekdayPrice) || 0,
        weekendPrice: Number(courtForm.weekendPrice) || 0,
        imageUrl: courtForm.imageUrl.trim(),
        isActive: courtForm.isActive,
      };
      if (editingCourtId != null) {
        await repo.updateCourt(editingCourtId, payload);
      } else {
        const created = await repo.createCourt(payload);
        setBookingForm((state) => ({
          ...state,
          courtId: String(created.id),
        }));
      }
      closeCourtModal();
      await refresh();
    });
  }

  async function onSavePromotion() {
    await runSave(async () => {
      const payload = {
        name: promotionForm.name.trim(),
        kind: (promotionForm.kind === "HOUR" ? "HOUR" : "COUNT") as FootballTurfPromotion["kind"],
        totalUses: Number(promotionForm.totalUses) || 1,
        durationMinutes: Number(promotionForm.durationMinutes) || 60,
        price: Number(promotionForm.price) || 0,
        isActive: promotionForm.isActive,
        note: promotionForm.note.trim(),
      };
      if (editingPromotionId != null) {
        await repo.updatePromotion(editingPromotionId, payload);
      } else {
        await repo.createPromotion(payload);
      }
      closePromotionModal();
      await refresh();
    });
  }

  async function onSavePromotionSale() {
    if (editingPromotionSaleId == null) return;
    if (saleEditForm.taxInvoiceEnabled) {
      if ((saleEditForm.billingName.trim() || saleEditForm.customerName.trim()).length < 2) {
        notice.error("กรอกชื่อในใบกำกับภาษีให้ถูกต้อง");
        return;
      }
      if (!isValidThaiId13(saleEditForm.taxId)) {
        notice.error("เลขประจำตัวผู้เสียภาษีต้องเป็น 13 หลัก");
        return;
      }
      if (saleEditForm.taxAddress.trim().length < 8) {
        notice.error("กรอกที่อยู่ในใบกำกับภาษีให้ครบ");
        return;
      }
    }
    await runSave(async () => {
      await repo.updatePromotionSale(editingPromotionSaleId, {
        customerName: saleEditForm.customerName.trim(),
        customerPhone: saleEditForm.customerPhone.trim(),
        teamName: saleEditForm.teamName.trim(),
        remainingUses: Number(saleEditForm.remainingUses) || 0,
        status: saleEditForm.status,
        paymentMethod: saleEditForm.paymentMethod,
        paymentStatus: saleEditForm.paymentStatus,
        paymentReference: saleEditForm.paymentReference.trim(),
        paymentSlipDataUrl:
          saleEditForm.paymentMethod === "TRANSFER" ? saleEditForm.paymentSlipDataUrl : "",
      });
      const phone = saleEditForm.customerPhone.trim();
      if (phone) {
        const phoneKey = phone.replace(/\D/g, "");
        const existing = customers.find(
          (c) => c.phone.replace(/\D/g, "") === phoneKey || c.phone === phone,
        );
        const taxPayload = {
          taxInvoiceEnabled: saleEditForm.taxInvoiceEnabled,
          billingName: saleEditForm.taxInvoiceEnabled
            ? saleEditForm.billingName.trim() || saleEditForm.customerName.trim()
            : "",
          taxId: saleEditForm.taxInvoiceEnabled ? saleEditForm.taxId.trim() : "",
          taxAddress: saleEditForm.taxInvoiceEnabled ? saleEditForm.taxAddress.trim() : "",
          taxBranch: saleEditForm.taxInvoiceEnabled ? saleEditForm.taxBranch.trim() : "",
        };
        if (existing) {
          await repo.updateCustomer(existing.id, {
            name: saleEditForm.customerName.trim() || existing.name,
            phone,
            teamName: saleEditForm.teamName.trim() || existing.teamName,
            ...taxPayload,
          });
        } else if (saleEditForm.taxInvoiceEnabled) {
          await repo.createCustomer({
            name: saleEditForm.customerName.trim() || phone,
            phone,
            teamName: saleEditForm.teamName.trim(),
            note: "",
            isActive: true,
            photoUrl: "",
            ...taxPayload,
          });
        }
      }
      closePromotionSaleEditModal();
      await refresh();
    });
  }

  async function onSaveCustomer() {
    const payload = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      teamName: customerForm.teamName.trim(),
      note: customerForm.note.trim(),
      isActive: customerForm.isActive,
      taxInvoiceEnabled: customerForm.taxInvoiceEnabled,
      billingName: customerForm.billingName.trim() || customerForm.name.trim(),
      taxId: customerForm.taxId.replace(/\D/g, "").slice(0, 13),
      taxAddress: customerForm.taxAddress.trim(),
      taxBranch: customerForm.taxBranch.trim(),
      photoUrl: customerForm.photoUrl.trim(),
    };
    if (!payload.name || !payload.phone) return;
    if (payload.taxInvoiceEnabled) {
      if (payload.billingName.length < 2) {
        notice.error("กรอกชื่อในใบกำกับภาษีให้ถูกต้อง");
        return;
      }
      if (!isValidThaiId13(payload.taxId)) {
        notice.error("เลขบัตรประชาชน / เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลักและถูกต้อง");
        return;
      }
      if (payload.taxAddress.length < 8) {
        notice.error("กรอกที่อยู่ในใบกำกับภาษีให้ครบ");
        return;
      }
    }
    await runSave(async () => {
      if (editingCustomerId != null) {
        await repo.updateCustomer(editingCustomerId, payload);
      } else {
        await repo.createCustomer(payload);
      }
      closeCustomerModal();
      await refresh();
    });
  }

  async function onCancelBooking(id: number) {
    const ok = await notice.confirm("ยกเลิกการจองนี้ใช่หรือไม่?", {
      title: "ยืนยันการยกเลิก",
      confirmLabel: "ยกเลิกจอง",
      tone: "warning",
    });
    if (!ok) return;
    await runSave(async () => {
      const updated = await repo.updateBooking(id, { status: "CANCELLED" });
      if (storageOnly) {
        await refresh();
      } else if (updated) {
        applyLiveEvent({
          type: "booking.upsert",
          at: new Date().toISOString(),
          bookings: [updated],
        });
      }
    });
  }

  async function onDeleteBooking(id: number) {
    const ok = await notice.confirm("ลบรายการจองนี้ออกจากระบบถาวรใช่หรือไม่?");
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteBooking(id);
      if (storageOnly) {
        await refresh();
      } else {
        applyLiveEvent({
          type: "booking.delete",
          at: new Date().toISOString(),
          ids: [id],
        });
      }
    });
  }

  async function onDeleteCourt(id: number, name: string) {
    const ok = await notice.confirm(
      `ลบสนาม "${name}" ใช่หรือไม่?\nถ้ามีประวัติจอง ระบบจะปิดใช้งานแทน`,
    );
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteCourt(id);
      await refresh();
    });
  }

  async function onDeletePromotion(id: number, name: string) {
    const ok = await notice.confirm(
      `ลบโปรโมชั่น "${name}" ใช่หรือไม่?\nถ้ามีการขายแล้ว ระบบจะปิดใช้งานแทน`,
    );
    if (!ok) return;
    await runSave(async () => {
      await repo.deletePromotion(id);
      await refresh();
    });
  }

  async function onDeletePromotionSale(id: number, label: string) {
    const ok = await notice.confirm(`ลบสิทธิ์ของ "${label}" ใช่หรือไม่?`);
    if (!ok) return;
    await runSave(async () => {
      await repo.deletePromotionSale(id);
      await refresh();
    });
  }

  async function onDeleteCustomer(id: number, name: string) {
    const ok = await notice.confirm(`ลบลูกค้า "${name}" ใช่หรือไม่?`);
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteCustomer(id);
      await refresh();
    });
  }

  async function onDeleteCostEntry(id: number) {
    const ok = await notice.confirm("ลบรายจ่ายนี้ใช่หรือไม่?");
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteCostEntry(id);
      await refresh();
    });
  }

  async function confirmBookingPayment(id: number) {
    await runSave(async () => {
      const item = bookings.find((row) => row.id === id);
      if (!item) return;
      const paid = Math.max(
        footballTurfBookingAmountPaidBaht(item),
        Math.max(0, Math.round(Number(item.depositAmountBaht ?? 0))),
        Math.max(0, Math.round(Number(item.amountPaidBaht ?? 0))),
      );
      const amountPaidBaht = paid > 0 ? paid : item.finalPrice;
      const paymentStatus = footballTurfComputePaymentStatus(item.finalPrice, amountPaidBaht);
      const updated = await repo.updateBooking(id, { amountPaidBaht, paymentStatus });
      if (storageOnly) {
        await refresh();
      } else if (updated) {
        applyLiveEvent({
          type: "booking.upsert",
          at: new Date().toISOString(),
          bookings: [updated],
        });
      }
      if (paymentStatus === "PAID") {
        setPrintBooking({ ...(updated ?? item), amountPaidBaht, paymentStatus: "PAID" });
      }
    });
  }

  function closeBalancePayModal() {
    setBalancePayOpen(false);
    setBalancePayBookingId(null);
    setBalancePayCheckInAfter(false);
    setBalancePayMethod("ONSITE");
    setBalancePayReference("");
    setBalancePaySlipDataUrl("");
    setBalancePayBusy(false);
  }

  function openBalancePayModal(booking: FootballTurfBooking, opts?: { checkInAfter?: boolean }) {
    setBalancePayBookingId(booking.id);
    setBalancePayCheckInAfter(Boolean(opts?.checkInAfter));
    setBalancePayMethod("ONSITE");
    setBalancePayReference("");
    setBalancePaySlipDataUrl("");
    setBalancePayBusy(false);
    setBalancePayOpen(true);
  }

  async function onBalancePaySlipSelected(file: File | null) {
    if (!file) return;
    setBalancePayBusy(true);
    try {
      const dataUrl = await prepareImageFileAsDataUrl(file);
      setBalancePaySlipDataUrl(dataUrl);
      setBalancePayMethod("TRANSFER");
    } catch (error) {
      notice.error(error instanceof Error ? error.message : "แนบสลิปไม่สำเร็จ");
    } finally {
      setBalancePayBusy(false);
    }
  }

  async function submitBalancePayment() {
    const balancePayBooking =
      balancePayBookingId == null ? null : bookings.find((row) => row.id === balancePayBookingId) ?? null;
    if (!balancePayBooking) return;
    const remain = footballTurfBookingRemainingBaht(balancePayBooking);
    if (remain <= 0) {
      if (balancePayCheckInAfter) {
        const checkInAfter = balancePayCheckInAfter;
        const bookingId = balancePayBooking.id;
        closeBalancePayModal();
        if (checkInAfter) await setBookingStatus(bookingId, "CHECKED_IN");
      } else {
        closeBalancePayModal();
      }
      return;
    }
    if (balancePayMethod === "TRANSFER" && !balancePaySlipDataUrl) {
      notice.error("โอนเงิน / พร้อมเพย์ ต้องแนบหรือถ่ายสลิป");
      return;
    }
    const checkInAfter = balancePayCheckInAfter;
    const bookingId = balancePayBooking.id;
    await runSave(async () => {
      let updated = await repo.updateBooking(bookingId, {
        amountPaidBaht: balancePayBooking.finalPrice,
        paymentStatus: balancePayMethod === "TRANSFER" ? "PENDING_REVIEW" : "PAID",
        paymentMethod: balancePayMethod,
        paymentSlipDataUrl:
          balancePayMethod === "TRANSFER" ? balancePaySlipDataUrl : balancePayBooking.paymentSlipDataUrl,
        paymentReference: balancePayReference.trim() || balancePayBooking.paymentReference,
      });
      if (checkInAfter && balancePayMethod === "ONSITE") {
        updated = (await repo.updateBooking(bookingId, { status: "CHECKED_IN" })) ?? updated;
      }
      closeBalancePayModal();
      if (storageOnly) {
        await refresh();
      } else if (updated) {
        const at = new Date().toISOString();
        applyLiveEvent({ type: "booking.upsert", at, bookings: [updated] });
        if (checkInAfter && balancePayMethod === "ONSITE") {
          applyLiveEvent({
            type: "booking.sessionStatus",
            at,
            courtId: updated.courtId,
            bookingDate: updated.bookingDate,
            customerName: updated.customerName,
            customerPhone: updated.customerPhone,
            status: "CHECKED_IN",
          });
        }
      }
      if (checkInAfter && balancePayMethod === "TRANSFER") {
        notice.success("รับสลิปแล้ว — ยืนยันชำระก่อนเช็กอิน");
      } else if (checkInAfter) {
        notice.success("ชำระครบและเช็กอินแล้ว");
      } else {
        notice.success("รับชำระส่วนที่เหลือแล้ว");
      }
      if (balancePayMethod === "ONSITE") {
        setPrintBooking({
          ...balancePayBooking,
          ...updated,
          amountPaidBaht: balancePayBooking.finalPrice,
          paymentStatus: "PAID",
          paymentMethod: "ONSITE",
          status:
            checkInAfter && balancePayBooking.status === "BOOKED"
              ? "CHECKED_IN"
              : balancePayBooking.status,
        });
      }
    });
  }

  async function collectBookingBalance(id: number) {
    const item = bookings.find((row) => row.id === id);
    if (!item) return;
    openBalancePayModal(item);
  }

  async function requestCheckIn(booking: FootballTurfBooking) {
    if (!footballTurfBookingIsFullyPaid(booking)) {
      openBalancePayModal(booking, { checkInAfter: true });
      return;
    }
    await setBookingStatus(booking.id, "CHECKED_IN");
  }

  function closeOverviewCheckInModal() {
    setOverviewCheckInModal(null);
  }

  function listCourtTodayBookedForCheckIn(courtId: number): FootballTurfBooking[] {
    const today = localDateKey(new Date(liveClockMs));
    return bookings
      .filter(
        (item) =>
          item.courtId === courtId &&
          item.bookingDate === today &&
          item.status === "BOOKED",
      )
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }

  /** เปิดแผงรายละเอียดคิวจองเพื่อเช็กอิน / ชำระเพิ่ม — ว่างไม่มีคิว → walk-in */
  function openOverviewCheckInHub(court: FootballTurfCourt, preferred?: FootballTurfBooking | null) {
    if (preferred) {
      setOverviewCheckInModal({ mode: "booking", bookingId: preferred.id });
      return;
    }
    const booked = listCourtTodayBookedForCheckIn(court.id);
    if (booked.length === 1) {
      setOverviewCheckInModal({ mode: "booking", bookingId: booked[0]!.id });
      return;
    }
    if (booked.length > 1) {
      setOverviewCheckInModal({ mode: "pick", courtId: court.id });
      return;
    }
    openCourtLiveBooking(court, "WALK_IN");
  }

  function openOverviewBookingDetail(booking: FootballTurfBooking) {
    setOverviewCheckInModal({ mode: "booking", bookingId: booking.id });
  }

  async function overviewRequestCheckIn(booking: FootballTurfBooking) {
    closeOverviewCheckInModal();
    await requestCheckIn(booking);
  }

  function overviewOpenBalancePay(booking: FootballTurfBooking, opts?: { checkInAfter?: boolean }) {
    closeOverviewCheckInModal();
    openBalancePayModal(booking, opts);
  }

  async function onSellPromotion() {
    const promotion = promotions.find((item) => item.id === Number(saleForm.promotionId));
    if (!promotion) return;
    if (!saleForm.customerName.trim() || !saleForm.customerPhone.trim()) return;
    if (saleForm.paymentMethod === "TRANSFER" && !saleForm.paymentSlipDataUrl) return;
    if (saleForm.taxInvoiceEnabled) {
      const billing = (saleForm.billingName.trim() || saleForm.customerName.trim()).trim();
      if (billing.length < 2) {
        notice.error("กรอกชื่อในใบกำกับภาษีให้ถูกต้อง");
        return;
      }
      if (!isValidThaiId13(saleForm.taxId)) {
        notice.error("เลขบัตรประชาชน / เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลักและถูกต้อง");
        return;
      }
      if (saleForm.taxAddress.trim().length < 8) {
        notice.error("กรอกที่อยู่ในใบกำกับภาษีให้ครบ");
        return;
      }
    }
    const wantTax = saleForm.taxInvoiceEnabled;
    const taxPayload = {
      taxInvoiceEnabled: wantTax,
      billingName: (saleForm.billingName.trim() || saleForm.customerName.trim()).trim(),
      taxId: saleForm.taxId.replace(/\D/g, "").slice(0, 13),
      taxAddress: saleForm.taxAddress.trim(),
      taxBranch: saleForm.taxBranch.trim(),
    };
    const paymentStatus =
      saleForm.paymentMethod === "TRANSFER"
        ? saleForm.paymentSlipDataUrl
          ? "PENDING_REVIEW"
          : "UNPAID"
        : "PAID";
    await runSave(async () => {
      const created = await repo.createPromotionSale({
        promotionId: promotion.id,
        promotionName: promotion.name,
        customerName: saleForm.customerName.trim(),
        customerPhone: saleForm.customerPhone.trim(),
        teamName: saleForm.teamName.trim(),
        totalUses: promotion.totalUses,
        price: promotion.price,
        paymentMethod: saleForm.paymentMethod,
        paymentStatus,
        paymentSlipDataUrl: saleForm.paymentSlipDataUrl,
        paymentReference: saleForm.paymentReference.trim(),
      });
      if (wantTax) {
        const phoneKey = saleForm.customerPhone.replace(/\D/g, "");
        const existing = customers.find(
          (c) => c.phone.replace(/\D/g, "") === phoneKey || c.phone === saleForm.customerPhone.trim(),
        );
        if (existing) {
          await repo.updateCustomer(existing.id, {
            name: saleForm.customerName.trim() || existing.name,
            teamName: saleForm.teamName.trim() || existing.teamName,
            ...taxPayload,
          });
        } else {
          await repo.createCustomer({
            name: saleForm.customerName.trim(),
            phone: saleForm.customerPhone.trim(),
            teamName: saleForm.teamName.trim(),
            note: "",
            isActive: true,
            photoUrl: "",
            ...taxPayload,
          });
        }
      }
      closeSaleModal();
      await refresh();
      if (created.paymentStatus === "PAID") {
        setPrintPreferTaxInvoice(wantTax);
        setPrintPromotionSale(created);
      } else if (wantTax) {
        notice.success("บันทึกแล้ว — ยืนยันชำระก่อนแล้วค่อยพิมพ์ใบกำกับ");
      }
    });
  }

  async function confirmPromotionSalePayment(id: number) {
    await runSave(async () => {
      const updated = await repo.updatePromotionSale(id, { paymentStatus: "PAID" });
      await refresh();
      if (updated) {
        setPrintPreferTaxInvoice(Boolean(
          customers.find((c) => c.phone.replace(/\D/g, "") === updated.customerPhone.replace(/\D/g, ""))
            ?.taxInvoiceEnabled,
        ));
        setPrintPromotionSale({ ...updated, paymentStatus: "PAID" });
      }
    });
  }

  async function onSaveCost() {
    const amount = Math.round(Number(costForm.amount) || 0);
    const itemLabel = costForm.itemLabel.trim();
    if (!itemLabel) {
      notice.error("กรอกรายละเอียดรายการ");
      return;
    }
    if (amount < 1) {
      notice.error("กรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    await runSave(async () => {
      const categoryId = Number(costForm.categoryId) || costCategories[0]?.id || 1;
      const note = costForm.note.trim();
      const paymentSlipUrl = costForm.paymentSlipUrl.trim();
      if (costEditingId != null) {
        const existing = costEntries.find((c) => c.id === costEditingId);
        await repo.updateCostEntry(costEditingId, {
          categoryId,
          spentAt: existing?.spentAt ?? new Date().toISOString(),
          amount,
          itemLabel,
          note,
          paymentSlipUrl,
        });
      } else {
        await repo.createCostEntry({
          categoryId,
          spentAt: new Date().toISOString(),
          amount,
          itemLabel,
          note,
          paymentSlipUrl,
        });
      }
      setCostOpen(false);
      resetCostForm();
      await refresh();
    });
  }

  async function onSaveCostCategory() {
    const name = costCatName.trim();
    if (!name) {
      notice.error("กรอกชื่อหมวดหมู่");
      return;
    }
    await runSave(async () => {
      if (costCatEdit) {
        await repo.updateCostCategory(costCatEdit.id, name);
      } else {
        await repo.createCostCategory(name);
      }
      setCostCatFormOpen(false);
      setCostCatEdit(null);
      setCostCatName("");
      await refresh();
    });
  }

  async function onDeleteCostCategory(cat: FootballTurfCostCategory) {
    const ok = await notice.confirm(
      `ลบหมวดหมู่ «${cat.name}» ใช่หรือไม่?\n(ถ้ามีรายจ่ายในหมวดนี้ต้องย้ายหรือลบก่อน)`,
    );
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteCostCategory(cat.id);
      if (costFilterCat === cat.id) setCostFilterCat("all");
      await refresh();
    });
  }

  async function onSaveIncome() {
    const amount = Math.round(Number(incomeForm.amount) || 0);
    const itemLabel = incomeForm.itemLabel.trim();
    if (!itemLabel) {
      notice.error("กรอกรายละเอียดรายการ");
      return;
    }
    if (amount < 1) {
      notice.error("กรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    const categoryId = Number(incomeForm.categoryId);
    if (!Number.isFinite(categoryId) || categoryId < 1) {
      notice.error("เลือกหมวดรายรับ หรือสร้างหมวดก่อน");
      return;
    }
    await runSave(async () => {
      const note = incomeForm.note.trim();
      const paymentSlipUrl = incomeForm.paymentSlipUrl.trim();
      if (incomeEditingId != null) {
        const existing = incomeEntries.find((c) => c.id === incomeEditingId);
        await repo.updateIncomeEntry(incomeEditingId, {
          categoryId,
          earnedAt: existing?.earnedAt ?? new Date().toISOString(),
          amount,
          itemLabel,
          note,
          paymentSlipUrl,
        });
      } else {
        await repo.createIncomeEntry({
          categoryId,
          earnedAt: new Date().toISOString(),
          amount,
          itemLabel,
          note,
          paymentSlipUrl,
        });
      }
      setIncomeOpen(false);
      resetIncomeForm();
      await refresh();
    });
  }

  async function onSaveIncomeCategory() {
    const name = incomeCatName.trim();
    if (!name) {
      notice.error("กรอกชื่อหมวดหมู่");
      return;
    }
    await runSave(async () => {
      if (incomeCatEdit) {
        await repo.updateIncomeCategory(incomeCatEdit.id, name);
      } else {
        await repo.createIncomeCategory(name);
      }
      setIncomeCatFormOpen(false);
      setIncomeCatEdit(null);
      setIncomeCatName("");
      await refresh();
    });
  }

  async function onDeleteIncomeCategory(cat: FootballTurfIncomeCategory) {
    if (cat.isBuiltin || cat.kind !== "CUSTOM") {
      notice.error("หมวดรายรับหลักลบไม่ได้");
      return;
    }
    const ok = await notice.confirm(
      `ลบหมวดหมู่ «${cat.name}» ใช่หรือไม่?\n(ถ้ามีรายรับในหมวดนี้ต้องย้ายหรือลบก่อน)`,
    );
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteIncomeCategory(cat.id);
      if (incomeFilterCat === cat.id) setIncomeFilterCat("all");
      await refresh();
    });
  }

  async function onDeleteIncomeEntry(id: number) {
    const ok = await notice.confirm("ลบรายรับนี้ใช่หรือไม่?");
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteIncomeEntry(id);
      await refresh();
    });
  }

  async function onSaveSettings() {
    if (settingsForm.portalBookingPaymentMode === "DEPOSIT") {
      const dep = Math.max(0, Math.round(Number(settingsForm.depositAmountBaht ?? 0)));
      if (dep <= 0) {
        notice.error("โหมดมัดจำต้องระบุจำนวนมัดจำมากกว่า 0 บาท");
        return;
      }
    }
    const ok = await notice.confirm("บันทึกการตั้งค่าสนามใช่หรือไม่?", {
      title: "ยืนยันการบันทึก",
      confirmLabel: "บันทึก",
      tone: "warning",
    });
    if (!ok) return;
    await runSave(async () => {
      const next = await repo.updateSettings({
        venueName: settingsForm.venueName.trim(),
        venueSubtitle: settingsForm.venueSubtitle.trim(),
        logoUrl: settingsForm.logoUrl.trim(),
        promptpayNumber: settingsForm.promptpayNumber.trim(),
        bankName: settingsForm.bankName.trim(),
        accountName: settingsForm.accountName.trim(),
        accountNumber: settingsForm.accountNumber.trim(),
        venueAddress: settingsForm.venueAddress.trim(),
        taxId: settingsForm.taxId.trim(),
        contactPhone: settingsForm.contactPhone.trim(),
        contactLine: settingsForm.contactLine.trim(),
        note: settingsForm.note.trim(),
        slipPaperSize: settingsForm.slipPaperSize,
        portalBookingPaymentMode: settingsForm.portalBookingPaymentMode,
        depositAmountBaht:
          settingsForm.portalBookingPaymentMode === "DEPOSIT"
            ? Math.max(0, Math.round(Number(settingsForm.depositAmountBaht ?? 0))) || null
            : null,
        portalBannerUrl: settingsForm.portalBannerUrl.trim(),
        portalGallery: settingsForm.portalGallery,
        facebookUrl: settingsForm.facebookUrl.trim(),
        mapUrl: settingsForm.mapUrl.trim(),
        ...staffDailyPinPatchBody({ pinDraft: staffPinDraft, clearPin: staffClearPin }),
      });
      setSettings(next);
      setSettingsForm(next);
      setStaffPinDraft("");
      setStaffClearPin(false);
    });
  }

  async function setBookingStatus(id: number, status: FootballTurfBooking["status"]) {
    if (status === "CHECKED_IN" || status === "PLAYING") {
      const item = bookings.find((row) => row.id === id);
      if (item && !footballTurfBookingIsFullyPaid(item)) {
        openBalancePayModal(item, { checkInAfter: status === "CHECKED_IN" });
        return;
      }
    }
    await runSave(async () => {
      const updated = await repo.updateBooking(id, { status });
      if (storageOnly) {
        await refresh();
      } else if (updated) {
        const at = new Date().toISOString();
        applyLiveEvent({ type: "booking.upsert", at, bookings: [updated] });
        if (status === "CHECKED_IN" || status === "PLAYING" || status === "COMPLETED") {
          applyLiveEvent({
            type: "booking.sessionStatus",
            at,
            courtId: updated.courtId,
            bookingDate: updated.bookingDate,
            customerName: updated.customerName,
            customerPhone: updated.customerPhone,
            status: status === "PLAYING" ? "CHECKED_IN" : status,
          });
        }
      }
      if (status === "CHECKED_IN") {
        notice.success("เช็กอินแล้ว — ทุกรอบของชื่อ/เบอร์เดียวกันถูกเช็กอินด้วย");
      } else if (status === "COMPLETED") {
        notice.success("เช็กเอาท์แล้ว — ปิดทุกรอบของเซสชันนี้แล้ว พร้อมรับคิวถัดไป");
      }
    });
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyMsg("คัดลอกลิงก์แล้ว");
  }

  async function openQrModal(title: string, url: string) {
    setQrOpen(true);
    setQrState({ title, url, dataUrl: "", loading: true });
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    setQrState({ title, url, dataUrl, loading: false });
  }

  function downloadQr() {
    if (!qrState.dataUrl || !qrState.title) return;
    const link = document.createElement("a");
    link.href = qrState.dataUrl;
    link.download = `${qrState.title.replace(/\s+/g, "-")}.png`;
    link.click();
  }

  function resetOverviewFilters() {
    setScheduleDate(todayDateKey);
    setOverviewCourtId("ALL");
  }

  function resetQueueFilters() {
    setQueueSearch("");
    setQueueStatus("ALL");
    setQueueCourtId("ALL");
    setQueueDatePreset("MONTH");
    setQueueDateFrom("");
    setQueueDateTo("");
    setQueueNeedsCloseOnly(false);
  }

  function resetOffersFilters() {
    setOffersSearch("");
    setOffersSaleStatus("ALL");
    setOffersMenu("packages");
  }

  return (
    <div className="min-h-0 text-slate-900">
      {activeTab === "overview" ? (
        <div className="space-y-4">
          <AppDashboardSection tone="violet">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ภาพรวมวันที่เลือก</p>
                  <div className="mt-3 grid w-full grid-cols-2 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.45fr)]">
                    <div className="relative flex min-h-[7.25rem] flex-col overflow-hidden rounded-[1rem] border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 px-4 py-4 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl">
                      <p className={cn(COMPACT_CARD_LABEL_CLASS, "text-indigo-700/80")}>สนามเปิดใช้งาน</p>
                      <p className={cn(COMPACT_CARD_VALUE_CLASS, "text-[#1e1b4b]")}>{filteredOverviewCourts.length}</p>
                    </div>
                    <div className="relative flex min-h-[7.25rem] flex-col overflow-hidden rounded-[1rem] border border-white/60 bg-gradient-to-br from-white/60 via-amber-50/35 to-orange-100/30 px-4 py-4 shadow-[0_18px_38px_-26px_rgba(217,119,6,0.35)] backdrop-blur-xl">
                      <p className={cn(COMPACT_CARD_LABEL_CLASS, "text-amber-700/80")}>รอบที่จอง</p>
                      <p className={cn(COMPACT_CARD_VALUE_CLASS, "text-[#1e1b4b]")}>{filteredOverviewBookings.length}</p>
                    </div>
                    <div className="col-span-2 relative flex min-h-[7.25rem] flex-col overflow-hidden rounded-[1rem] border border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 px-4 py-4 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl sm:col-span-1">
                      <p className={cn(COMPACT_CARD_LABEL_CLASS, "text-emerald-700/80")}>รายรับรวม</p>
                      <p className={cn(COMPACT_CARD_VALUE_CLASS, "text-[#1e1b4b] tabular-nums")}>
                        {formatMoney(overviewRevenueTotal)}
                      </p>
                    </div>
                    <div className="col-span-2 relative flex min-h-[7.25rem] flex-col overflow-hidden rounded-[1rem] border border-white/60 bg-gradient-to-br from-white/60 via-violet-50/35 to-violet-100/30 px-4 py-4 shadow-[0_18px_38px_-26px_rgba(124,58,237,0.4)] backdrop-blur-xl sm:col-span-1">
                      <p className={cn(COMPACT_CARD_LABEL_CLASS, "text-violet-700/80")}>กำไรขั้นต้น</p>
                      <p className={cn(COMPACT_CARD_VALUE_CLASS, "text-[#1e1b4b] tabular-nums")}>
                        {formatMoney(overviewProfitTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <FilterToolbar
                title="มุมมองข้อมูล"
                summary={overviewFilterSummary}
                activeCount={overviewActiveFilterCount}
                onReset={resetOverviewFilters}
              >
                <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <FilterField label="เลือกวันที่" icon={<CalendarDays className="h-4 w-4" />}>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className={FILTER_CONTROL_CLASS}
                    />
                  </FilterField>
                  <FilterField label="กรองตามสนาม" icon={<Landmark className="h-4 w-4" />}>
                    <select
                      value={overviewCourtId}
                      onChange={(e) => setOverviewCourtId(e.target.value)}
                      className={FILTER_CONTROL_CLASS}
                    >
                      <option value="ALL">ทุกสนาม</option>
                      {courts.map((court) => (
                        <option key={`overview-court-${court.id}`} value={String(court.id)}>
                          {court.name}
                        </option>
                      ))}
                    </select>
                  </FilterField>
                </div>
              </FilterToolbar>
            </div>
          </AppDashboardSection>

          <div className="grid gap-4 xl:grid-cols-1">
            <AppDashboardSection tone="violet">
              <AppSectionHeader
                tone="violet"
                title="สนามที่กำลังใช้งาน"
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredOverviewCourts.map((court) => {
                  const liveNow = new Date(liveClockMs);
                  const liveTodayKey = localDateKey(liveNow);
                  const nowMinutes = localNowMinutes(liveNow);
                  const hoursPhase = courtHoursPhase(court, nowMinutes);
                  const isHoursClosed = hoursPhase !== "OPEN";
                  const courtDayBookings = bookings
                    .filter(
                      (item) =>
                        item.courtId === court.id &&
                        item.bookingDate === liveTodayKey &&
                        item.status !== "CANCELLED",
                    )
                    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
                  const current = findCourtLiveBooking(courtDayBookings, {
                    isToday: true,
                    nowMinutes,
                  });
                  const next = findCourtNextBooking(courtDayBookings, { nowMinutes }, current);
                  const alertKind = courtLiveAlertKind(current, nowMinutes, courtDayBookings);
                  const currentSession = current
                    ? listFootballTurfSessionBookings(current, courtDayBookings)
                    : [];
                  const currentSessionLabel =
                    currentSession.length > 1
                      ? `${currentSession[0]!.startTime}–${currentSession[currentSession.length - 1]!.endTime} · ${currentSession.length} รอบ`
                      : current
                        ? `${current.startTime}–${current.endTime}`
                        : "";
                  const isNoShowAlert = alertKind === "NO_SHOW";
                  const isOvertimeAlert = alertKind === "OVERTIME";
                  /** นอกเวลาเปิด แต่ยังมีรอบค้างปิด → ไม่ถือว่าปิดสนิท */
                  const showAsClosed = isHoursClosed && !isOvertimeAlert && !current;
                  const idle = !current && !showAsClosed;
                  const accentTone: "emerald" | "indigo" | "amber" | "rose" | "sky" | "slate" = showAsClosed
                    ? "slate"
                    : isOvertimeAlert
                      ? "rose"
                      : isNoShowAlert
                        ? "amber"
                        : idle
                          ? "emerald"
                          : current?.status === "PLAYING"
                            ? "indigo"
                            : current?.status === "CHECKED_IN"
                              ? "sky"
                              : "amber";
                  const statusTone: "emerald" | "indigo" | "amber" | "rose" | "slate" = showAsClosed
                    ? "slate"
                    : isOvertimeAlert
                      ? "rose"
                      : isNoShowAlert
                        ? "amber"
                        : idle
                          ? "emerald"
                          : current?.status === "PLAYING" || current?.status === "CHECKED_IN"
                            ? "indigo"
                            : "amber";
                  const statusLabel = showAsClosed
                    ? "สนามปิด"
                    : idle
                      ? "ว่าง"
                      : isOvertimeAlert
                        ? "เลยเวลา"
                        : bookingStatusLabel(current!.status);
                  const nextIsContinuous =
                    Boolean(current && next) &&
                    timeToMinutes(next!.startTime) === timeToMinutes(current!.endTime);
                  const guestLabel = current
                    ? current.teamName || current.customerName
                    : null;
                  const nextGuestLabel = next ? next.teamName || next.customerName : null;
                  const hoursRangeLabel = `${court.openTime}–${court.closeTime}`;
                  const slotLabel = `รอบละ ${court.slotMinutes} นาที`;
                  const closedHint =
                    hoursPhase === "BEFORE_OPEN"
                      ? `ยังไม่ถึงเวลา · เปิด ${hoursRangeLabel} · ${slotLabel}`
                      : `หมดเวลาแล้ว · เปิด ${hoursRangeLabel} · ${slotLabel}`;

                  return (
                    <div
                      key={court.id}
                      className={cn(
                        footballTurfContentCardClass,
                        "flex h-full min-h-[11rem] flex-col pl-4 sm:pl-5",
                        showAsClosed && "opacity-95",
                        isOvertimeAlert && "ring-2 ring-rose-400/80 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]",
                        isNoShowAlert && "ring-2 ring-amber-400/80 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]",
                      )}
                    >
                      <span className={footballTurfCardAccentBarClass(accentTone)} aria-hidden />
                      {isNoShowAlert ? (
                        <span
                          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-500 text-white shadow-md ring-2 ring-white"
                          title="ถึงเวลาแล้ว ยังไม่เช็กอิน"
                          aria-label="ถึงเวลาแล้ว ยังไม่เช็กอิน"
                        >
                          <AlertTriangle className="h-4 w-4" aria-hidden />
                        </span>
                      ) : null}
                      {isOvertimeAlert ? (
                        <span
                          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300 bg-rose-500 text-white shadow-md ring-2 ring-white"
                          title="เลยเวลาสิ้นสุดรอบ ควรปิดรอบ"
                          aria-label="เลยเวลาสิ้นสุดรอบ ควรปิดรอบ"
                        >
                          <AlertTriangle className="h-4 w-4" aria-hidden />
                        </span>
                      ) : null}

                      <div
                        className={cn(
                          "flex shrink-0 items-start justify-between gap-2",
                          (isNoShowAlert || isOvertimeAlert) && "pr-9",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{court.name}</p>
                          <span className={cn(footballTurfMetaChipClass, "mt-1.5")}>
                            {hoursRangeLabel} · {slotLabel}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className={footballTurfCourtStatusBadgeClass(statusTone)}>{statusLabel}</span>
                        </div>
                      </div>

                      <div className="mt-3 min-h-0 flex-1 space-y-1.5">
                        {showAsClosed ? (
                          <div
                            className="rounded-xl border border-slate-200/90 bg-slate-50/95 px-2 py-1.5 text-[11px] font-bold text-slate-700"
                            role="status"
                          >
                            {closedHint}
                          </div>
                        ) : null}
                        {isNoShowAlert ? (
                          <div
                            className="flex items-start gap-1.5 rounded-xl border border-amber-300/90 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-950"
                            role="alert"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                            <span>ถึงเวลาแล้ว · ยังไม่เช็กอิน — แจ้งลูกค้าหรือเปิดคิว</span>
                          </div>
                        ) : null}
                        {isOvertimeAlert ? (
                          <div
                            className="flex items-start gap-1.5 rounded-xl border border-rose-300/90 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-950"
                            role="alert"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden />
                            <span>
                              {currentSession.length > 1
                                ? "เลยเวลาสิ้นสุดเซสชัน · ควรเช็กเอาท์ก่อนคิวถัดไป"
                                : "เลยเวลาสิ้นสุดรอบ · ควรปิดรอบก่อนคิวถัดไป"}
                            </span>
                          </div>
                        ) : null}

                        <p className="min-h-[2.5rem] text-xs font-medium leading-snug text-[#2e2a58]">
                          {guestLabel ? (
                            <button
                              type="button"
                              onClick={() => openOverviewBookingDetail(current!)}
                              className="block w-full rounded-xl text-left transition hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40"
                              aria-label={`ดูรายละเอียดคิว ${guestLabel}`}
                            >
                              <span className="font-semibold text-[#66638c]">
                                {isOvertimeAlert
                                  ? "ผู้ใช้ก่อนหน้า: "
                                  : current!.status === "BOOKED"
                                    ? "จอง: "
                                    : "เช็กอิน: "}
                              </span>
                              <span className="line-clamp-2">{guestLabel}</span>
                              <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
                                {currentSessionLabel || `${current!.startTime}–${current!.endTime}`} ·{" "}
                                {current!.customerPhone}
                              </span>
                              <span
                                className={cn(
                                  "mt-1 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black ring-1",
                                  bookingPaymentStatusClass(current!.paymentStatus),
                                )}
                              >
                                {bookingPaymentStatusLabel(current!.paymentStatus)}
                              </span>
                            </button>
                          ) : showAsClosed ? (
                            hoursPhase === "BEFORE_OPEN" ? (
                              nextGuestLabel ? (
                                <span className="text-[#8b87b8]">สนามปิด · มีคิวรอเปิด</span>
                              ) : (
                                <span className="text-[#8b87b8]">สนามปิด · ยังไม่มีผู้จองวันนี้</span>
                              )
                            ) : (
                              <span className="text-[#8b87b8]">สนามปิด · หมดเวลารอบวันนี้</span>
                            )
                          ) : nextGuestLabel ? (
                            <span className="text-[#8b87b8]">ตอนนี้ว่าง · รอคิวถัดไป</span>
                          ) : (
                            <span className="text-[#8b87b8]">ยังไม่มีผู้จองวันนี้</span>
                          )}
                        </p>

                        {next && nextGuestLabel && hoursPhase !== "AFTER_CLOSE" ? (
                          <button
                            type="button"
                            onClick={() => openOverviewBookingDetail(next)}
                            className={cn(
                              "w-full rounded-xl border px-2 py-1.5 text-left text-[11px] font-bold transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40",
                              nextIsContinuous
                                ? "border-violet-300/90 bg-violet-50/95 text-violet-950"
                                : "border-sky-200/90 bg-sky-50/95 text-sky-950",
                            )}
                            aria-label={`ดูคิว ${nextGuestLabel}`}
                          >
                            <p
                              className={cn(
                                "font-black uppercase tracking-wide",
                                nextIsContinuous ? "text-violet-800" : "text-sky-700",
                              )}
                            >
                              {hoursPhase === "BEFORE_OPEN"
                                ? "คิวรอเปิด"
                                : nextIsContinuous
                                  ? "จองต่อ"
                                  : "คิวถัดไป"}
                            </p>
                            <p className="mt-0.5 line-clamp-2 font-semibold text-[#2e2a58]">{nextGuestLabel}</p>
                            <p
                              className={cn(
                                "mt-0.5 text-[10px] font-semibold",
                                nextIsContinuous ? "text-violet-900/75" : "text-sky-800/80",
                              )}
                            >
                              {next.startTime}–{next.endTime}
                              {next.customerPhone ? ` · ${next.customerPhone}` : ""}
                            </p>
                            <span
                              className={cn(
                                "mt-1 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black ring-1",
                                bookingPaymentStatusClass(next.paymentStatus),
                              )}
                            >
                              {bookingPaymentStatusLabel(next.paymentStatus)}
                            </span>
                            {footballTurfBookingRemainingBaht(next) > 0 ? (
                              <span
                                className={cn(
                                  footballTurfChipActionButtonClass,
                                  "mt-1.5 inline-flex min-h-[28px] rounded-lg border border-amber-300 bg-white/90 px-2.5 py-1 text-[10px] text-amber-900",
                                )}
                              >
                                ค้าง {formatMoney(footballTurfBookingRemainingBaht(next))}
                              </span>
                            ) : null}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-auto flex shrink-0 flex-wrap items-center gap-1.5 pt-3">
                        {idle || (showAsClosed && hoursPhase === "BEFORE_OPEN") ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openCourtLiveBooking(court, "ONLINE")}
                              className={cn(footballTurfChipActionButtonClass, "border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6]")}

                              aria-label={`จอง ${court.name}`}
                            >
                              จอง
                            </button>
                            {idle ? (
                              <button
                                type="button"
                                onClick={() => openOverviewCheckInHub(court, next?.status === "BOOKED" ? next : null)}
                                className={cn(footballTurfChipActionButtonClass, "bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white")}

                                aria-label={`เช็กอิน ${court.name}`}
                              >
                                เช็กอิน
                              </button>
                            ) : null}
                          </>
                        ) : null}

                        {current?.status === "BOOKED" && isNoShowAlert ? (
                          <button
                            type="button"
                            onClick={() => void onMarkBookingNoShow(current.id)}
                            className={cn(footballTurfChipActionButtonClass, "border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900")}

                            aria-label={`ไม่มา เปิดคิว ${court.name}`}
                          >
                            ไม่มา · เปิดคิว
                          </button>
                        ) : null}

                        {current?.status === "BOOKED" ? (
                          <button
                            type="button"
                            onClick={() => openOverviewCheckInHub(court, current)}
                            className={cn(footballTurfChipActionButtonClass, "bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white")}

                            aria-label={`เช็กอิน ${court.name}`}
                          >
                            เช็กอิน
                          </button>
                        ) : null}

                        {current &&
                        (current.status === "CHECKED_IN" || current.status === "PLAYING" || isOvertimeAlert) ? (
                          <button
                            type="button"
                            onClick={() => void setBookingStatus(current.id, "COMPLETED")}
                            className={cn(
                              footballTurfChipActionButtonClass,
                              isOvertimeAlert
                                ? "border border-rose-400 bg-rose-600 text-white"
                                : "border border-indigo-300/70 bg-indigo-50 text-indigo-800",
                            )}
                            aria-label={`เช็กเอาท์ ${court.name}`}
                          >
                            {isOvertimeAlert ? "เช็กเอาท์ · เคลียร์" : "เช็กเอาท์"}
                          </button>
                        ) : null}

                        {current?.paymentStatus === "PENDING_REVIEW" ? (
                          <button
                            type="button"
                            onClick={() => void confirmBookingPayment(current.id)}
                            className={cn(footballTurfChipActionButtonClass, "border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-800")}

                            aria-label={`ยืนยันชำระ ${court.name}`}
                          >
                            ยืนยันชำระ
                          </button>
                        ) : null}

                        {current && footballTurfBookingRemainingBaht(current) > 0 ? (
                          <button
                            type="button"
                            onClick={() => openBalancePayModal(current)}
                            className={cn(footballTurfChipActionButtonClass, "border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900")}

                            aria-label={`รับชำระส่วนที่เหลือ ${court.name}`}
                          >
                            จ่ายเพิ่ม {formatMoney(footballTurfBookingRemainingBaht(current))}
                          </button>
                        ) : null}

                        {current && footballTurfBookingIsFullyPaid(current) ? (
                          <button
                            type="button"
                            onClick={() => setPrintBooking(current)}
                            className={cn(
                              footballTurfChipActionButtonClass,
                              "gap-1 border border-emerald-300 bg-emerald-50 text-emerald-900",
                            )}
                            aria-label={`พิมพ์สลิป ${court.name}`}
                          >
                            <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                            พิมพ์
                          </button>
                        ) : null}

                        {current ? (
                          <button
                            type="button"
                            onClick={() => openEditBookingModal(current)}
                            className={cn(footballTurfChipActionButtonClass, "border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6]")}

                            aria-label={`แก้ไขการจอง ${court.name}`}
                          >
                            แก้ไข
                          </button>
                        ) : null}

                        {!idle && !showAsClosed && next?.status === "BOOKED" ? (
                          <button
                            type="button"
                            onClick={() => openOverviewCheckInHub(court, next)}
                            className={cn(footballTurfChipActionButtonClass, "border border-violet-300/80 bg-violet-50 px-3 py-1.5 text-[11px] font-black text-violet-900")}

                            aria-label={`เช็กอินคิวถัดไป ${court.name}`}
                          >
                            เช็กอินคิวถัดไป
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AppDashboardSection>

          </div>

          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="ตารางเวลาจองรายสนาม"
              className="flex flex-row items-center justify-between gap-2 sm:gap-3"
              actionWrapClassName="hidden min-w-0 shrink-0 sm:block"
              action={
                <div className="flex max-w-full min-w-0 flex-nowrap items-center justify-end gap-2">
                  <div className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                    {scheduleDate}
                  </div>
                  {courts.length > 0 ? (
                    <nav className={footballTurfCourtTabShellClass} aria-label="เลือกสนามในตารางเวลา">
                      <div className="flex min-w-0 gap-1" role="tablist">
                        {courts.map((court) => {
                          const id = String(court.id);
                          const active = scheduleCourtId === id;
                          return (
                            <button
                              key={`schedule-court-tab-${court.id}`}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              aria-label={`ตาราง ${court.name}`}
                              onClick={() => setScheduleCourtId(id)}
                              className={footballTurfCourtTabPillClass(active)}
                            >
                              {court.name}
                            </button>
                          );
                        })}
                      </div>
                    </nav>
                  ) : null}
                </div>
              }
            />
            {courts.length > 0 ? (
              <div className="mt-2.5 w-full sm:hidden">
                <label
                  htmlFor="ft-overview-schedule-court"
                  className="mb-1.5 block text-[11px] font-black text-[#4d47b6]"
                >
                  กรุณาเลือกสนาม
                </label>
                <select
                  id="ft-overview-schedule-court"
                  value={scheduleCourtId}
                  onChange={(e) => setScheduleCourtId(e.target.value)}
                  className={footballTurfMobileSelectClass}
                  aria-label="กรุณาเลือกสนาม"
                >
                  {courts.map((court) => (
                    <option key={court.id} value={String(court.id)}>
                      {court.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="mt-4">
              {!selectedScheduleBoard ? (
                <AppEmptyState tone="violet">ยังไม่มีสนามให้แสดงตาราง</AppEmptyState>
              ) : (
                <div
                  key={`${selectedScheduleBoard.court.id}-${scheduleDate}`}
                  className="rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/85 via-white/70 to-cyan-50/45 p-3 shadow-sm sm:rounded-[1.5rem] sm:p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/70 pb-3 sm:gap-3 sm:pb-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">สนาม</p>
                      <h3 className="mt-0.5 truncate text-lg font-black tracking-tight text-slate-900 sm:mt-1 sm:text-xl">
                        {selectedScheduleBoard.court.name}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-white/80 px-2.5 py-1.5 text-right shadow-sm ring-1 ring-white/80 sm:rounded-xl sm:px-3 sm:py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">เวลาเปิดใช้งาน</p>
                      <p className="mt-0.5 text-xs font-black text-slate-700 sm:mt-1 sm:text-sm">
                        {selectedScheduleBoard.court.openTime} - {selectedScheduleBoard.court.closeTime}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4">
                    <label className="sr-only" htmlFor="ft-overview-schedule-status">
                      กรองสถานะช่วงเวลา
                    </label>
                    <select
                      id="ft-overview-schedule-status"
                      value={scheduleStatusFilter}
                      onChange={(e) =>
                        setScheduleStatusFilter(
                          e.target.value as
                            | "ALL"
                            | "FREE"
                            | "BOOKED"
                            | "CHECKED_IN"
                            | "COMPLETED"
                            | "PASSED"
                            | "NEEDS_CLOSE",
                        )
                      }
                      className={cn(footballTurfMobileSelectClass, "sm:hidden")}
                      aria-label="กรองสถานะช่วงเวลา"
                    >
                      <option value="ALL">
                        ทั้งหมด
                        {scheduleStatusCounts.ALL > 0 ? ` (${scheduleStatusCounts.ALL})` : ""}
                      </option>
                      <option value="FREE">ว่าง ({scheduleStatusCounts.FREE})</option>
                      <option value="BOOKED">จอง ({scheduleStatusCounts.BOOKED})</option>
                      <option value="CHECKED_IN">เช็กอิน ({scheduleStatusCounts.CHECKED_IN})</option>
                      <option value="COMPLETED">เช็กเอาท์ ({scheduleStatusCounts.COMPLETED})</option>
                      <option value="PASSED">หมดเวลา ({scheduleStatusCounts.PASSED})</option>
                      <option value="NEEDS_CLOSE">
                        {scheduleStatusCounts.NEEDS_CLOSE > 0
                          ? `ต้องปิดงาน (${scheduleStatusCounts.NEEDS_CLOSE})`
                          : "ต้องปิดงาน"}
                      </option>
                    </select>

                    <div
                      className="hidden flex-wrap items-center gap-1.5 sm:flex"
                      role="group"
                      aria-label="กรองสถานะช่วงเวลา"
                    >
                      {(
                        [
                          ["ALL", "ทั้งหมด"],
                          ["FREE", "ว่าง"],
                          ["BOOKED", "จอง"],
                          ["CHECKED_IN", "เช็กอิน"],
                          ["COMPLETED", "เช็กเอาท์"],
                          ["PASSED", "หมดเวลา"],
                        ] as const
                      ).map(([key, label]) => {
                        const count = scheduleStatusCounts[key];
                        const active = scheduleStatusFilter === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setScheduleStatusFilter(key)}
                            className={cn(
                              "min-h-[34px] rounded-full border px-3 text-[11px] font-black transition",
                              active
                                ? "border-[#5b61ff]/50 bg-[#ecebff] text-[#3b36a0] ring-2 ring-[#5b61ff]/20"
                                : "border-white/70 bg-white/75 text-[#4d47b6] hover:bg-white/95",
                            )}
                          >
                            {label}
                            {key !== "ALL" ? ` (${count})` : count > 0 ? ` (${count})` : ""}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        aria-pressed={scheduleStatusFilter === "NEEDS_CLOSE"}
                        onClick={() =>
                          setScheduleStatusFilter((prev) => (prev === "NEEDS_CLOSE" ? "ALL" : "NEEDS_CLOSE"))
                        }
                        className={cn(
                          "min-h-[34px] rounded-full border px-3 text-[11px] font-black transition",
                          scheduleStatusFilter === "NEEDS_CLOSE"
                            ? "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300/50"
                            : "border-amber-200/80 bg-amber-50/80 text-amber-800 hover:bg-amber-100/90",
                        )}
                      >
                        {scheduleStatusCounts.NEEDS_CLOSE > 0
                          ? `ต้องปิดงาน (${scheduleStatusCounts.NEEDS_CLOSE})`
                          : "ต้องปิดงาน"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 sm:mt-5">
                    {filteredScheduleTimeline.length === 0 ? (
                      <AppEmptyState tone="violet">ไม่พบช่วงเวลาตามตัวกรองสถานะ</AppEmptyState>
                    ) : (
                      filteredScheduleTimeline.map((slot) => {
                        const court = selectedScheduleBoard.court;
                        const timePassed = isSlotTimePassed(slot, scheduleBoardTimeOpts);
                        const timeCurrent = isSlotTimeCurrent(slot, scheduleBoardTimeOpts);
                        const booking = timePassed ? null : slot.booking;
                        return (
                          <div
                            key={`${court.id}-${slot.startTime}`}
                            className={cn(
                              "flex flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm",
                              timePassed
                                ? "border-slate-200/70 bg-slate-100/80 opacity-80"
                                : booking
                                  ? timeCurrent
                                    ? "border-emerald-200/80 bg-gradient-to-r from-white/95 via-emerald-50/50 to-white/90"
                                    : "border-white/80 bg-white/90"
                                  : "border-slate-200/80 bg-slate-50/85",
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <div
                                className={cn(
                                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                                  timePassed
                                    ? "bg-slate-200/80 text-slate-400 ring-slate-300/70"
                                    : booking
                                      ? "bg-white text-slate-700 ring-slate-200"
                                      : "bg-slate-100 text-slate-400 ring-slate-200",
                                )}
                              >
                                <Clock3 className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    "text-sm font-black",
                                    timePassed ? "text-slate-400" : "text-slate-900",
                                  )}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-xs font-medium",
                                    timePassed ? "text-slate-400" : "text-slate-500",
                                  )}
                                >
                                  {timePassed
                                    ? "ไม่มีผู้จอง / ผู้เล่น"
                                    : booking
                                      ? `${booking.teamName || booking.customerName} · ${booking.customerPhone}`
                                      : timeCurrent
                                        ? "รอบปัจจุบัน · ใช้เช็คอินหน้างาน"
                                        : "ว่าง · จองล่วงหน้าได้"}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                              <span
                                className={cn(
                                  "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                                  timePassed
                                    ? "bg-slate-200/80 text-slate-500 ring-slate-300/80"
                                    : booking
                                      ? bookingStatusClass(booking.status)
                                      : "bg-slate-50 text-slate-500 ring-slate-200",
                                )}
                              >
                                {timePassed ? "หมดเวลา" : booking ? bookingStatusLabel(booking.status) : "ว่าง"}
                              </span>
                              {booking && !timePassed ? (
                                <span
                                  className={cn(
                                    "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                                    bookingPaymentStatusClass(booking.paymentStatus),
                                  )}
                                >
                                  {bookingPaymentStatusLabel(booking.paymentStatus)}
                                </span>
                              ) : null}
                              {booking && !timePassed ? (
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                                  {formatMoney(booking.finalPrice)}
                                </span>
                              ) : null}
                              {booking &&
                              !timePassed &&
                              footballTurfBookingRemainingBaht(booking) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => openBalancePayModal(booking)}
                                  className={cn(footballTurfChipActionButtonClass, "border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900")}

                                  aria-label={`รับชำระค้าง ${court.name} ${slot.startTime}`}
                                >
                                  จ่ายเพิ่ม {formatMoney(footballTurfBookingRemainingBaht(booking))}
                                </button>
                              ) : null}
                              {booking && !timePassed && footballTurfBookingIsFullyPaid(booking) ? (
                                <button
                                  type="button"
                                  onClick={() => setPrintBooking(booking)}
                                  className={cn(
                                    footballTurfChipActionButtonClass,
                                    "gap-1 border border-emerald-300 bg-emerald-50 text-emerald-900",
                                  )}
                                  aria-label={`พิมพ์สลิป ${court.name} ${slot.startTime}`}
                                >
                                  <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                                  พิมพ์
                                </button>
                              ) : null}
                              {booking && !timePassed && booking.status === "BOOKED" ? (
                                <button
                                  type="button"
                                  onClick={() => void requestCheckIn(booking)}
                                  className={cn(footballTurfChipActionButtonClass, "border border-violet-300/80 bg-violet-50 px-3 py-1.5 text-[11px] font-black text-violet-900")}

                                  aria-label={`เช็กอิน ${court.name} ${slot.startTime}`}
                                >
                                  เช็กอิน
                                </button>
                              ) : null}
                              {!booking &&
                              !timePassed &&
                              isSlotEligibleForAdvanceBooking(slot, scheduleBoardTimeOpts) ? (
                                <button
                                  type="button"
                                  onClick={() => openScheduleSlotBooking(court, slot.startTime, slot.endTime)}
                                  className={cn(footballTurfChipActionButtonClass, "bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white")}

                                  aria-label={`จอง ${court.name} ${slot.startTime}`}
                                >
                                  จอง
                                </button>
                              ) : null}
                              {!booking &&
                              !timePassed &&
                              isSlotEligibleForWalkIn(
                                slot,
                                selectedScheduleBoard.timeline,
                                scheduleBoardTimeOpts,
                              ) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCourtLiveBooking(court, "WALK_IN", {
                                      startTime: slot.startTime,
                                      endTime: slot.endTime,
                                    })
                                  }
                                  className={cn(footballTurfChipActionButtonClass, "border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800")}

                                  aria-label={`เช็คอิน walk-in ${court.name} ${slot.startTime}`}
                                >
                                  เช็คอิน
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </AppDashboardSection>
        </div>
      ) : null}

      {activeTab === "queue" ? (
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="จอง"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  aria-label={queueFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  aria-pressed={queueFilterOpen}
                  onClick={() => setQueueFilterOpen((v) => !v)}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    footballTurfInteractiveButtonClass,
                    "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 text-[#4d47b6] sm:min-w-0 sm:gap-2 sm:px-4",
                    queueFiltersActive && "ring-2 ring-amber-300/60",
                  )}
                >
                  <SlidersHorizontal className="h-5 w-5 sm:hidden" aria-hidden />
                  <span className="hidden sm:inline">{queueFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                  {queueFiltersActive ? (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden />
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label="เพิ่มการจอง"
                  onClick={() => openBookingModal("ONLINE")}
                  className={cn(
                    "app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 text-sm font-black shadow-sm sm:min-w-0 sm:px-4",
                    footballTurfInteractiveButtonClass,
                  )}
                >
                  <span className="sm:hidden" aria-hidden>
                    +
                  </span>
                  <span className="hidden sm:inline">+ เพิ่มการจอง</span>
                </button>
              </div>
            }
          />

          <div className={cn("mt-3 space-y-3", queueFilterOpen ? "block" : "hidden")}>
            <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการจอง">
              {(
                [
                  ["TODAY", "วันนี้"],
                  ["MONTH", "เดือนนี้"],
                  ["YEAR", "ปีนี้"],
                  ["CUSTOM", "ช่วงเวลา"],
                  ["ALL", "ทั้งหมด"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={queueDatePreset === key}
                  onClick={() => {
                    setQueueDatePreset(key);
                    if (key !== "CUSTOM") {
                      setQueueDateFrom("");
                      setQueueDateTo("");
                    }
                  }}
                  className={cn(
                    footballTurfFilterChipClass(queueDatePreset === key),
                    "min-h-[36px] rounded-full px-3 text-xs",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={queueNeedsCloseOnly}
                onClick={() => setQueueNeedsCloseOnly((v) => !v)}
                className={cn(
                  footballTurfInteractiveButtonClass,
                  "min-h-[36px] rounded-full border px-3 text-xs font-black",
                  queueNeedsCloseOnly
                    ? "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300/50"
                    : "border-amber-200/80 bg-amber-50/70 text-amber-800 hover:bg-amber-100/80",
                )}
              >
                {queueNeedsCloseCount > 0 ? `ต้องปิดงาน (${queueNeedsCloseCount})` : "ต้องปิดงาน"}
              </button>
            </div>

            {queueDatePreset === "CUSTOM" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="min-w-0 space-y-1 text-xs font-bold text-slate-600">
                  จากวันที่
                  <input
                    type="date"
                    value={queueDateFrom}
                    onChange={(e) => setQueueDateFrom(e.target.value)}
                    className={FILTER_CONTROL_CLASS}
                  />
                </label>
                <label className="min-w-0 space-y-1 text-xs font-bold text-slate-600">
                  ถึงวันที่
                  <input
                    type="date"
                    value={queueDateTo}
                    onChange={(e) => setQueueDateTo(e.target.value)}
                    className={FILTER_CONTROL_CLASS}
                  />
                </label>
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="search"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className={FILTER_CONTROL_CLASS}
                placeholder="ค้นหา ชื่อ/เบอร์/สนาม"
              />
              <select value={queueStatus} onChange={(e) => setQueueStatus(e.target.value)} className={FILTER_CONTROL_CLASS}>
                <option value="ALL">ทุกสถานะ</option>
                <option value="BOOKED">จอง</option>
                <option value="CHECKED_IN">เช็กอิน</option>
                <option value="PLAYING">เช็กอิน (ใช้งาน)</option>
                <option value="COMPLETED">เช็กเอาท์</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>
              <select value={queueCourtId} onChange={(e) => setQueueCourtId(e.target.value)} className={FILTER_CONTROL_CLASS}>
                <option value="ALL">ทุกสนาม</option>
                {courts.map((court) => (
                  <option key={`queue-court-${court.id}`} value={String(court.id)}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetQueueFilters}
                className={cn(
                  appTemplateOutlineButtonClass,
                  footballTurfInteractiveButtonClass,
                  "min-h-[40px] rounded-xl px-4 text-xs font-black text-[#4d47b6]",
                )}
              >
                ล้างตัวกรอง
              </button>
            </div>
            {queueFilterSummary ? (
              <p className="text-[11px] font-semibold text-[#8b87b8]">{queueFilterSummary}</p>
            ) : null}
          </div>

          {!queueFilterOpen ? (
            <p className="mt-3 text-xs font-semibold text-[#8b87b8]">
              ตัวกรองถูกซ่อน{queueFiltersActive ? " · มีเงื่อนไขกรองอยู่" : ""} — กด «แสดงกรอง» เพื่อเปิด
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {queueFilteredBookings.length === 0 ? (
              <AppEmptyState tone="violet">ไม่พบรายการจองตามตัวกรอง</AppEmptyState>
            ) : (
              queueFilteredBookings.map((item) => {
                const overdue = footballBookingNeedsClose(
                  item,
                  {
                    todayDateKey,
                    nowMinutes: localNowMinutes(new Date(liveClockMs)),
                  },
                  bookings,
                );
                const guest = item.teamName || item.customerName;
                const accent =
                  item.status === "BOOKED"
                    ? "amber"
                    : item.status === "CHECKED_IN" || item.status === "PLAYING"
                      ? "indigo"
                      : item.status === "COMPLETED"
                        ? "emerald"
                        : item.status === "CANCELLED"
                          ? "rose"
                          : "slate";
                return (
                  <div
                    key={item.id}
                    className={cn(
                      footballTurfContentCardClass,
                      "relative overflow-hidden pl-5 pr-12 sm:pl-6 sm:pr-14",
                      overdue && "ring-2 ring-amber-400/70",
                    )}
                  >
                    <span className={footballTurfCardAccentBarClass(overdue ? "amber" : accent)} aria-hidden />
                    <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
                      <button
                        type="button"
                        className={cn(assetRowEditIconButtonClass, footballTurfInteractiveButtonClass)}
                        aria-label={`จัดการการจอง ${guest}`}
                        title="จัดการ"
                        onClick={() => openEditBookingModal(item)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <div className="hidden text-right md:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">ยอดรวม</p>
                        <p className="bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] bg-clip-text text-lg font-black tabular-nums leading-tight text-transparent">
                          {formatMoney(item.finalPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff]/15 to-violet-100 text-sm font-black text-[#4d47b6] ring-1 ring-[#5b61ff]/20">
                        {getBookingInitials(guest)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-base font-black tracking-tight text-[#1e1b4b]">{guest}</p>
                          <span className={cn("rounded-lg px-2.5 py-1 text-[11px] font-black ring-1", bookingStatusClass(item.status))}>
                            {bookingStatusLabel(item.status)}
                          </span>
                          <span
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                              bookingPaymentStatusClass(item.paymentStatus),
                            )}
                          >
                            {bookingPaymentStatusLabel(item.paymentStatus)}
                          </span>
                          {overdue ? (
                            <span
                              className="inline-flex h-7 w-7 items-center justify-center text-amber-700"
                              title={footballBookingOverdueLabel(item.status)}
                              aria-label={footballBookingOverdueLabel(item.status)}
                              role="status"
                            >
                              <AlertTriangle className="h-4 w-4" aria-hidden />
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm font-medium text-[#66638c]">
                          {item.courtName} · {item.bookingDate} · {item.startTime}–{item.endTime}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#8b87b8]">
                          <button
                            type="button"
                            className={cn(
                              "font-black text-[#4d47b6] underline-offset-2 hover:underline",
                              footballTurfInteractiveButtonClass,
                            )}
                            onClick={() => setCustomerStatsPhone(item.customerPhone)}
                            aria-label={`ดูสถิติลูกค้า ${item.customerPhone}`}
                          >
                            {item.customerPhone}
                          </button>
                          {item.source === "WALK_IN" ? " · เช็กอินหน้างาน" : " · จองล่วงหน้า"}
                          {item.paymentMethod === "TRANSFER" ? " · โอนเงิน" : item.paymentMethod === "ONSITE" ? " · ชำระหน้าสนาม" : ""}
                        </p>

                        {item.paymentSlipDataUrl ? (
                          <div className="mt-3 flex items-center gap-3">
                            <AppImageThumb
                              src={item.paymentSlipDataUrl}
                              alt={`สลิปการจอง ${guest}`}
                              onOpen={() => item.paymentSlipDataUrl && saleSlipLightbox.open(item.paymentSlipDataUrl)}
                              className="h-14 w-14"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-emerald-800">แนบสลิปแล้ว</p>
                              <p className="truncate text-[11px] font-medium text-emerald-700">
                                {item.paymentReference || "ไม่มีเลขอ้างอิง"}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.paymentStatus === "PENDING_REVIEW" ? (
                            <button
                              type="button"
                              onClick={() => void confirmBookingPayment(item.id)}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                "border border-cyan-200 bg-cyan-50 text-cyan-700",
                              )}
                            >
                              ยืนยันชำระ
                            </button>
                          ) : null}
                          {item.paymentStatus === "PARTIAL" ||
                          (footballTurfBookingRemainingBaht(item) > 0 &&
                            item.paymentStatus !== "PENDING_REVIEW" &&
                            item.paymentStatus !== "PAID") ? (
                            <button
                              type="button"
                              onClick={() => void collectBookingBalance(item.id)}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                "border border-amber-200 bg-amber-50 text-amber-800",
                              )}
                            >
                              จ่ายเพิ่ม {formatMoney(footballTurfBookingRemainingBaht(item))}
                            </button>
                          ) : null}
                          {footballTurfBookingIsFullyPaid(item) ? (
                            <button
                              type="button"
                              onClick={() => setPrintBooking(item)}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                "gap-1 border border-emerald-200 bg-emerald-50 text-emerald-800",
                              )}
                              aria-label={`พิมพ์สลิป ${guest}`}
                            >
                              <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                              พิมพ์
                            </button>
                          ) : null}
                          {item.status === "BOOKED" ? (
                            <button
                              type="button"
                              onClick={() => void requestCheckIn(item)}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                "border border-sky-200 bg-sky-50 text-sky-700",
                              )}
                            >
                              เช็กอิน
                            </button>
                          ) : null}
                          {item.status === "CHECKED_IN" || item.status === "PLAYING" ? (
                            <button
                              type="button"
                              onClick={() => void setBookingStatus(item.id, "COMPLETED")}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                "border border-indigo-200 bg-indigo-50 text-indigo-700",
                              )}
                            >
                              เช็กเอาท์
                            </button>
                          ) : null}
                          {item.status !== "CANCELLED" && item.status !== "COMPLETED" ? (
                            <button
                              type="button"
                              onClick={() => void onCancelBooking(item.id)}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                "border border-amber-200 bg-amber-50 text-amber-700",
                              )}
                            >
                              ยกเลิก
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={cn(assetRowRemoveIconButtonClass, footballTurfInteractiveButtonClass)}
                            aria-label={`ลบการจอง ${guest}`}
                            title="ลบ"
                            onClick={() => void onDeleteBooking(item.id)}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </AppDashboardSection>
      ) : null}

      {activeTab === "finance" ? (
        <div className="space-y-4 sm:space-y-6">
          <section aria-label={`สรุปการเงิน ${financeRangeLabel}`}>
            <ul className={footballTurfFinanceStatsGridClass}>
              <li className={footballTurfFinanceStatCardClass}>
                <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
                  รายรับ · {financeRangeLabel}
                </p>
                <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
                  {formatMoney(financeRevenueTotal)}
                </p>
              </li>
              <li className={footballTurfFinanceStatCardClass}>
                <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">
                  รายจ่าย · {financeRangeLabel}
                </p>
                <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
                  {formatMoney(financeCostTotal)}
                </p>
              </li>
              <li className={cn(footballTurfFinanceStatCardClass, footballTurfFinanceStatTailClass)}>
                <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">สุทธิ</p>
                <p
                  className={cn(
                    "mt-2 text-left text-2xl font-black tabular-nums sm:text-3xl",
                    financeNetTotal < 0 ? "text-rose-800" : "text-[#1e1b4b]",
                  )}
                >
                  {formatMoney(financeNetTotal)}
                </p>
              </li>
            </ul>
          </section>

          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="การเงิน"
              className="flex flex-row items-start justify-between gap-3 sm:items-center"
              actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
              action={
                <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setFinanceFilterOpen((o) => !o)}
                    aria-expanded={financeFilterOpen}
                    aria-controls="ft-finance-filter-panel"
                    aria-label={financeFilterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                    title={financeFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "relative inline-flex min-h-[40px] items-center justify-center gap-1.5 px-3 text-xs font-black text-[#4d47b6]",
                      financeFilterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                      financeFiltersActive && !financeFilterOpen && "border-amber-300/80 bg-amber-50/90",
                    )}
                  >
                    <SlidersHorizontal className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="hidden sm:inline">{financeFilterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                    {financeFiltersActive ? (
                      <span
                        className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceChartsOpen((o) => !o)}
                    aria-expanded={financeChartsOpen}
                    aria-controls="ft-finance-charts"
                    aria-label={financeChartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                    title={financeChartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "inline-flex min-h-[40px] items-center justify-center px-3 text-xs font-black text-[#4d47b6]",
                      financeChartsOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                    )}
                  >
                    <BarChart3 className="h-5 w-5 shrink-0 sm:mr-1.5" aria-hidden />
                    <span className="hidden sm:inline">{financeChartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    aria-label="รีเฟรชข้อมูลรายงาน"
                    title="รีเฟรช"
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[1rem] px-0 text-[#4d47b6] sm:min-w-0 sm:px-3",
                    )}
                  >
                    <RefreshCw className="h-5 w-5 shrink-0 sm:mr-1.5" aria-hidden />
                    <span className="hidden sm:inline">รีเฟรช</span>
                  </button>
                </div>
              }
            />

            <div
              id="ft-finance-filter-panel"
              className={cn("mt-4 space-y-3", financeFilterOpen ? "block" : "hidden")}
            >
              <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
                {(
                  [
                    { id: "TODAY" as const, label: "วันนี้" },
                    { id: "MONTH" as const, label: "เดือนนี้" },
                    { id: "YEAR" as const, label: "ปีนี้" },
                    { id: "CUSTOM" as const, label: "กำหนดเอง" },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => selectFinanceRange(chip.id)}
                    className={footballTurfFinanceRangeChipClass(financeRange === chip.id)}
                    aria-pressed={financeRange === chip.id}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {financeRange === "CUSTOM" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="min-w-0">
                    <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                    <input
                      type="date"
                      value={financeStartDate}
                      onChange={(e) => setFinanceStartDate(e.target.value || todayDateKey)}
                      aria-label="ตั้งแต่วันที่"
                      className={cn(footballTurfFieldClass, "mt-1 min-h-[44px]")}
                    />
                  </label>
                  <label className="min-w-0">
                    <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                    <input
                      type="date"
                      value={financeEndDate}
                      onChange={(e) => setFinanceEndDate(e.target.value || todayDateKey)}
                      aria-label="ถึงวันที่"
                      className={cn(footballTurfFieldClass, "mt-1 min-h-[44px]")}
                    />
                  </label>
                </div>
              ) : null}
              <div className={cn("grid gap-3", financeFiltersActive ? "sm:grid-cols-12" : undefined)}>
                <label className={cn("min-w-0", financeFiltersActive ? "sm:col-span-9" : undefined)}>
                  <span className="sr-only">ค้นหารายการ</span>
                  <input
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                    placeholder="ค้นหาชื่อทีม เบอร์โทร รายการ…"
                    aria-label="ค้นหารายการการเงิน"
                    inputMode="search"
                    className={cn(footballTurfFieldClass, "mt-0 min-h-[44px]")}
                  />
                </label>
                {financeFiltersActive ? (
                  <div className="flex items-stretch sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => resetFinanceFilters()}
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-2xl px-3 text-sm font-black text-[#4d47b6]",
                      )}
                      aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
                    >
                      รีเซ็ต · เดือนนี้
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {financeRangeLabel}</p>
            </div>

            {financeChartsOpen ? (
              <div id="ft-finance-charts" className="mt-4 space-y-3">
                <p className="text-sm font-black text-[#1e1b4b]">รายรับเทียบรายจ่าย · {financeRangeLabel}</p>
                <AppSparkChartPanel className="w-full min-w-0">
                  <AppRevenueCostColumnChart
                    className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                    compact
                    title=""
                    subtitle=""
                    emptyText="ยังไม่มีข้อมูลในช่วงนี้"
                    buckets={financeChartBuckets}
                    formatTitle={(b) =>
                      `${b.label}: รายรับ ${formatMoney(b.revenue)} · รายจ่าย ${formatMoney(b.cost)}`
                    }
                  />
                </AppSparkChartPanel>
              </div>
            ) : null}

            <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
              <nav className={footballTurfFinanceSubTabShellClass} aria-label="เมนูการเงิน">
                <div className="flex w-full min-w-0 gap-1" role="tablist">
                  {(
                    [
                      { id: "history" as const, label: "ประวัติ / รายรับ" },
                      { id: "expenses" as const, label: "รายจ่าย" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={financePanel === tab.id}
                      id={`ft-finance-tab-${tab.id}`}
                      aria-controls={`ft-finance-panel-${tab.id}`}
                      onClick={() => setFinancePanel(tab.id)}
                      className={footballTurfFinanceSubTabPillClass(financePanel === tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </nav>

              {financePanel === "history" ? (
                <div id="ft-finance-panel-history" role="tabpanel" aria-labelledby="ft-finance-tab-history">
                  <AppSectionHeader
                    tone="slate"
                    title="ประวัติ / รายรับ"
                    className="flex flex-row items-start justify-between gap-3 sm:items-center"
                    actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                    action={
                      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIncomeCatFormOpen(false);
                            setIncomeCatModalOpen(true);
                          }}
                          className={cn(
                            appTemplateOutlineButtonClass,
                            "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
                          )}
                          aria-label="จัดการหมวดหมู่รายรับ"
                          title="หมวดหมู่"
                        >
                          หมวดหมู่
                        </button>
                        <button
                          type="button"
                          onClick={openIncomeCreate}
                          className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4"
                          aria-label="เพิ่มรายรับ"
                        >
                          <span className="sm:hidden">+</span>
                          <span className="hidden sm:inline">+ เพิ่มรายรับ</span>
                        </button>
                      </div>
                    }
                  />
                  <p className="mt-2 text-xs font-semibold text-[#66638c]">
                    ตามช่วง · {financeRangeLabel}
                    {financeSearch.trim() ? ` · ค้นหา «${financeSearch.trim()}»` : ""}
                  </p>

                  <div
                    className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
                    role="group"
                    aria-label="กรองตามหมวดรายรับ"
                  >
                    <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
                      <button
                        type="button"
                        onClick={() => setIncomeFilterCat("all")}
                        className={cn(
                          "shrink-0 snap-start transition",
                          footballTurfFilterChipClass(incomeFilterCat === "all"),
                        )}
                        aria-pressed={incomeFilterCat === "all"}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncomeFilterCat("COURT_RENTAL")}
                        className={cn(
                          "shrink-0 snap-start transition",
                          footballTurfFilterChipClass(incomeFilterCat === "COURT_RENTAL"),
                        )}
                        aria-pressed={incomeFilterCat === "COURT_RENTAL"}
                      >
                        ค่าสนาม
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncomeFilterCat("PROMOTION")}
                        className={cn(
                          "shrink-0 snap-start transition",
                          footballTurfFilterChipClass(incomeFilterCat === "PROMOTION"),
                        )}
                        aria-pressed={incomeFilterCat === "PROMOTION"}
                      >
                        โปรโมชัน
                      </button>
                      {customIncomeCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setIncomeFilterCat(c.id)}
                          className={cn(
                            "shrink-0 snap-start transition",
                            footballTurfFilterChipClass(incomeFilterCat === c.id),
                          )}
                          aria-pressed={incomeFilterCat === c.id}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {financeHistoryRows.length === 0 ? (
                    <AppEmptyState tone="slate" className="mt-4">
                      ไม่พบรายรับในช่วงนี้
                    </AppEmptyState>
                  ) : (
                    <div
                      className={cn("mt-4 max-h-[min(70vh,40rem)] min-h-0", appDashboardInnerScrollClass)}
                      role="region"
                      aria-label="ประวัติรายรับ"
                    >
                      <ul className="space-y-2 pr-0.5">
                        {financeHistoryRows.map((item) => {
                          const booking =
                            item.kind === "BOOKING"
                              ? bookings.find((b) => `booking-${b.id}` === item.id)
                              : null;
                          const sale =
                            item.kind === "PROMOTION"
                              ? promotionSales.find((s) => `promotion-${s.id}` === item.id)
                              : null;
                          const income =
                            item.kind === "INCOME"
                              ? incomeEntries.find((e) => `income-${e.id}` === item.id)
                              : null;
                          const phone = booking?.customerPhone ?? sale?.customerPhone ?? "";
                          const phoneKey = phone.replace(/\D/g, "");
                          const cust = customers.find(
                            (c) => c.phone.replace(/\D/g, "") === phoneKey || c.phone === phone,
                          );
                          const wantsTax = Boolean(cust?.taxInvoiceEnabled);
                          const kindLabel =
                            item.kind === "PROMOTION"
                              ? "โปรโมชัน"
                              : item.kind === "INCOME"
                                ? item.categoryLabel
                                : "ค่าสนาม";
                          return (
                          <li key={item.id} className={footballTurfFinanceListItemClass}>
                            <div className="flex items-start gap-2">
                              {item.slipUrl ? (
                                <AppImageThumb
                                  src={item.slipUrl}
                                  alt={`สลิป ${item.title}`}
                                  onOpen={() => saleSlipLightbox.open(item.slipUrl)}
                                  className="h-14 w-14 shrink-0"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-[#1e1b4b]">{item.title}</p>
                                <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{item.subtitle}</p>
                                <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                                  {item.dateLabel}
                                  {` · ${kindLabel}`}
                                  {wantsTax ? " · ใบกำกับ" : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <p className="text-lg font-black tabular-nums text-emerald-700">
                                  {formatMoney(item.amount)}
                                </p>
                                <div className="flex items-center gap-1">
                                  {item.kind === "BOOKING" || item.kind === "PROMOTION" ? (
                                    <AppSlipPrintIconButton
                                      onClick={() => {
                                        setPrintPreferTaxInvoice(wantsTax);
                                        if (booking) {
                                          setPrintPromotionSale(null);
                                          setPrintBooking(booking);
                                        } else if (sale) {
                                          setPrintBooking(null);
                                          setPrintPromotionSale(sale);
                                        }
                                      }}
                                      aria-label={
                                        wantsTax
                                          ? `พิมพ์สลิปหรือใบกำกับ ${item.title}`
                                          : `พิมพ์สลิป ${item.title}`
                                      }
                                      title={wantsTax ? "พิมพ์สลิป / ใบกำกับ" : "พิมพ์สลิป"}
                                    />
                                  ) : null}
                                  {item.kind === "BOOKING" ? (
                                    <>
                                      <button
                                        type="button"
                                        className={assetRowEditIconButtonClass}
                                        aria-label={`แก้ไขรายรับ ${item.title}`}
                                        title="แก้ไข"
                                        onClick={() => {
                                          if (booking) openEditBookingModal(booking);
                                        }}
                                      >
                                        <IconRowEdit className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className={assetRowRemoveIconButtonClass}
                                        aria-label={`ลบรายรับ ${item.title}`}
                                        title="ลบ"
                                        onClick={() => {
                                          const id = Number(item.id.replace("booking-", ""));
                                          if (Number.isFinite(id)) void onDeleteBooking(id);
                                        }}
                                      >
                                        <IconRowRemove className="h-4 w-4" aria-hidden />
                                      </button>
                                    </>
                                  ) : null}
                                  {item.kind === "PROMOTION" ? (
                                    <>
                                      <button
                                        type="button"
                                        className={assetRowEditIconButtonClass}
                                        aria-label={`แก้ไขรายรับโปร ${item.title}`}
                                        title="แก้ไข"
                                        onClick={() => {
                                          if (sale) openPromotionSaleEditModal(sale);
                                        }}
                                      >
                                        <IconRowEdit className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className={assetRowRemoveIconButtonClass}
                                        aria-label={`ลบรายรับโปร ${item.title}`}
                                        title="ลบ"
                                        onClick={() => {
                                          const id = Number(item.id.replace("promotion-", ""));
                                          if (Number.isFinite(id)) void onDeletePromotionSale(id, item.title);
                                        }}
                                      >
                                        <IconRowRemove className="h-4 w-4" aria-hidden />
                                      </button>
                                    </>
                                  ) : null}
                                  {item.kind === "INCOME" && income ? (
                                    <>
                                      <button
                                        type="button"
                                        className={assetRowEditIconButtonClass}
                                        aria-label={`แก้ไขรายรับ ${item.title}`}
                                        title="แก้ไข"
                                        onClick={() => openIncomeEdit(income)}
                                      >
                                        <IconRowEdit className="h-4 w-4" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className={assetRowRemoveIconButtonClass}
                                        aria-label={`ลบรายรับ ${item.title}`}
                                        title="ลบ"
                                        onClick={() => void onDeleteIncomeEntry(income.id)}
                                      >
                                        <IconRowRemove className="h-4 w-4" aria-hidden />
                                      </button>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {financePanel === "expenses" ? (
                <div id="ft-finance-panel-expenses" role="tabpanel" aria-labelledby="ft-finance-tab-expenses">
                  <AppSectionHeader
                    tone="slate"
                    title="รายจ่าย"
                    className="flex flex-row items-start justify-between gap-3 sm:items-center"
                    actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
                    action={
                      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCostCatFormOpen(false);
                            setCostCatModalOpen(true);
                          }}
                          className={cn(
                            appTemplateOutlineButtonClass,
                            "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
                          )}
                          aria-label="จัดการหมวดหมู่รายจ่าย"
                          title="หมวดหมู่"
                        >
                          หมวดหมู่
                        </button>
                        <button
                          type="button"
                          onClick={openCostCreate}
                          className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4"
                          aria-label="เพิ่มรายจ่าย"
                        >
                          <span className="sm:hidden">+</span>
                          <span className="hidden sm:inline">+ เพิ่มรายจ่าย</span>
                        </button>
                      </div>
                    }
                  />
                  <p className="mt-2 text-xs font-semibold text-[#66638c]">ต้นทุน · {financeRangeLabel}</p>

                  <div
                    className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
                    role="group"
                    aria-label="กรองตามหมวดหมู่"
                  >
                    <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
                      <button
                        type="button"
                        onClick={() => setCostFilterCat("all")}
                        className={cn("shrink-0 snap-start transition", footballTurfFilterChipClass(costFilterCat === "all"))}
                        aria-pressed={costFilterCat === "all"}
                      >
                        ทั้งหมด
                      </button>
                      {costCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCostFilterCat(c.id)}
                          className={cn(
                            "shrink-0 snap-start transition",
                            footballTurfFilterChipClass(costFilterCat === c.id),
                          )}
                          aria-pressed={costFilterCat === c.id}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {costCategories.length === 0 ? (
                    <p className="mt-3 text-xs font-semibold text-amber-800">
                      สร้างหมวดก่อนจึงจะบันทึกรายจ่ายได้ — กด «หมวดหมู่»
                    </p>
                  ) : null}

                  {financeExpenseRows.length === 0 ? (
                    <AppEmptyState tone="slate" className="mt-4">
                      {costCategories.length === 0
                        ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มรายจ่าย"
                        : "ยังไม่มีรายจ่ายในช่วงนี้"}
                    </AppEmptyState>
                  ) : (
                    <div
                      className={cn("mt-4 max-h-[min(70vh,40rem)] min-h-0", appDashboardInnerScrollClass)}
                      role="region"
                      aria-label="รายการรายจ่าย"
                    >
                      <ul className="space-y-2 pr-0.5">
                        {financeExpenseRows.map((item) => {
                          const entry = costEntries.find((c) => `cost-${c.id}` === item.id);
                          return (
                            <li key={item.id} className={cn(footballTurfFinanceListItemClass, "flex items-start gap-2")}>
                              {item.slipUrl ? (
                                <AppImageThumb
                                  src={item.slipUrl}
                                  alt={`สลิป ${item.title}`}
                                  onOpen={() => saleSlipLightbox.open(item.slipUrl)}
                                  className="h-14 w-14 shrink-0"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#66638c]">{item.dateLabel}</p>
                                <p className="mt-0.5 text-sm font-black text-[#1e1b4b]">{item.title}</p>
                                <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">{item.subtitle}</p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <p className="text-base font-black tabular-nums text-rose-600">
                                  {formatMoney(item.amount)}
                                </p>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    className={assetRowEditIconButtonClass}
                                    aria-label={`แก้ไขรายจ่าย ${item.title}`}
                                    title="แก้ไข"
                                    onClick={() => entry && openCostEdit(entry)}
                                  >
                                    <IconRowEdit className="h-4 w-4" aria-hidden />
                                  </button>
                                  <button
                                    type="button"
                                    className={assetRowRemoveIconButtonClass}
                                    aria-label={`ลบรายจ่าย ${item.title}`}
                                    title="ลบ"
                                    onClick={() => void onDeleteCostEntry(Number(item.id.replace("cost-", "")))}
                                  >
                                    <IconRowRemove className="h-4 w-4" aria-hidden />
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </AppDashboardSection>
        </div>
      ) : null}

      {activeTab === "offers" ? (
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="โปร / ลูกค้า"
            className="flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-3"
            actionWrapClassName="min-w-0 shrink-0 self-center"
            action={
              crmSection === "offers" ? (
                <div className={cn(footballTurfChipWrapRowClass, "justify-end")}>
                  <button
                    type="button"
                    aria-label={offersFilterOpen ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง"}
                    aria-pressed={offersFilterOpen}
                    onClick={() => setOffersFilterOpen((v) => !v)}
                    className={cn(
                      footballTurfMobileFilterIconButtonClass,
                      offersActiveFilterCount > 0 && "ring-2 ring-amber-300/60",
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    {offersActiveFilterCount > 0 ? (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => openPromotionModal()}
                    aria-label="เพิ่มโปรโมชั่น"
                    className={cn(
                      appTemplateOutlineButtonClass,
                      footballTurfHeaderIconButtonClass,
                      "text-[#4d47b6]",
                    )}
                  >
                    <span aria-hidden>+</span>
                    <span className="ml-1 hidden sm:inline">เพิ่มโปร</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleOpen(true)}
                    aria-label="ขายโปรโมชั่น"
                    className={cn("app-btn-primary shadow-sm", footballTurfHeaderIconButtonClass)}
                  >
                    <TicketPercent className="h-4 w-4 sm:hidden" aria-hidden />
                    <span className="hidden sm:inline">ขายโปร</span>
                  </button>
                </div>
              ) : (
                <div className={cn(footballTurfChipWrapRowClass, "justify-end")}>
                  <button
                    type="button"
                    aria-label={customersFilterOpen ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง"}
                    aria-pressed={customersFilterOpen}
                    onClick={() => setCustomersFilterOpen((v) => !v)}
                    className={cn(
                      footballTurfMobileFilterIconButtonClass,
                      (Boolean(customerSearch.trim()) || customersMenu !== "all") && "ring-2 ring-amber-300/60",
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    {Boolean(customerSearch.trim()) || customersMenu !== "all" ? (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label="เพิ่มลูกค้า"
                    onClick={() => openCustomerModal()}
                    className={cn("app-btn-primary shrink-0 shadow-sm", footballTurfHeaderIconButtonClass)}
                  >
                    <span aria-hidden>+</span>
                    <span className="ml-1 hidden sm:inline">เพิ่มลูกค้า</span>
                  </button>
                </div>
              )
            }
          />

          <nav className={cn(footballTurfPrimaryTabShellClass, "mt-3")} aria-label="เมนูหลักโปรหรือลูกค้า">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {(
                [
                  { id: "offers" as const, label: "โปรโมชัน" },
                  { id: "customers" as const, label: "ลูกค้า" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={crmSection === tab.id}
                  onClick={() => setCrmSection(tab.id)}
                  className={footballTurfPrimaryTabPillClass(crmSection === tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {crmSection === "offers" ? (
            <>
          <nav className={cn(footballTurfFilterChipShellClass, "mt-3")} aria-label="กรองแพ็กหรือสิทธิ์">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {(
                [
                  { id: "packages" as const, label: "แพ็กโปร", count: offersStatsSummary.packages },
                  { id: "holders" as const, label: "ถือสิทธิ์", count: offersStatsSummary.holders },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={offersMenu === tab.id}
                  id={`ft-offers-tab-${tab.id}`}
                  aria-controls={`ft-offers-panel-${tab.id}`}
                  onClick={() => setOffersMenu(tab.id)}
                  className={footballTurfFilterChipClass(offersMenu === tab.id)}
                >
                  {tab.label}
                  <span className="ml-1 opacity-80">({tab.count.toLocaleString("th-TH")})</span>
                </button>
              ))}
            </div>
          </nav>

          {offersMenu === "holders" ? (
            <div
              className={cn(footballTurfFilterChipShellClass, "mt-2")}
              role="group"
              aria-label="กรองสถานะสิทธิ์"
            >
              {(
                [
                  { id: "ALL" as const, label: "ทั้งหมด", short: "ทั้งหมด", count: offersStatsSummary.holders },
                  { id: "ACTIVE" as const, label: "ยังใช้ได้", short: "ใช้ได้", count: offersStatsSummary.holdersActive },
                  { id: "USED_UP" as const, label: "ใช้ครบ", short: "ครบ", count: offersStatsSummary.holdersUsedUp },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setOffersSaleStatus(chip.id)}
                  className={footballTurfFilterChipClass(offersSaleStatus === chip.id)}
                  aria-pressed={offersSaleStatus === chip.id}
                >
                  <span className="sm:hidden">{chip.short}</span>
                  <span className="hidden sm:inline">{chip.label}</span>
                  <span className="ml-1 opacity-75">({chip.count.toLocaleString("th-TH")})</span>
                </button>
              ))}
              {offersStatsSummary.holdersPending > 0 ? (
                <span className="inline-flex min-h-7 items-center rounded-lg bg-amber-50 px-2 text-[10px] font-black leading-none text-amber-800 ring-1 ring-amber-200 sm:min-h-8 sm:px-2.5 sm:text-[11px]">
                  รอ {offersStatsSummary.holdersPending.toLocaleString("th-TH")}
                </span>
              ) : null}
            </div>
          ) : null}

          {offersFilterOpen ? (
            <div className="mt-3 space-y-2 rounded-[1.25rem] border border-[#e8e6fc]/80 bg-white/70 p-3 shadow-sm sm:hidden">
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">ค้นหา</span>
                <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200/85 bg-white px-3">
                  <Search className="h-4 w-4 shrink-0 text-[#5b61ff]" aria-hidden />
                  <input
                    type="search"
                    value={offersSearch}
                    onChange={(e) => setOffersSearch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
                    placeholder={
                      offersMenu === "packages" ? "ชื่อโปรหรือหมายเหตุ" : "ชื่อ ทีม เบอร์ หรือโปร"
                    }
                    aria-label="ค้นหาโปรโมชั่น"
                  />
                </div>
              </label>
              {offersActiveFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    resetOffersFilters();
                    setOffersFilterOpen(false);
                  }}
                  className="text-xs font-black text-[#4d47b6]"
                >
                  ล้างตัวกรอง
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="hidden sm:block">
            <FilterToolbar
              title={offersMenu === "packages" ? "ค้นหาแพ็กโปร" : "ค้นหาผู้ถือสิทธิ์"}
              summary={
                offersFilterSummary ||
                (offersMenu === "packages"
                  ? `แพ็กเปิดใช้งาน ${offersStatsSummary.packagesActive.toLocaleString("th-TH")} / ${offersStatsSummary.packages.toLocaleString("th-TH")}`
                  : `แสดง ${offersFilteredSales.length.toLocaleString("th-TH")} รายการ`)
              }
              activeCount={offersActiveFilterCount}
              onReset={resetOffersFilters}
              mobileCollapsed={false}
            >
              <FilterField label="ค้นหา" icon={<Search className="h-4 w-4" />}>
                <input
                  type="search"
                  value={offersSearch}
                  onChange={(e) => setOffersSearch(e.target.value)}
                  className={FILTER_CONTROL_CLASS}
                  placeholder={
                    offersMenu === "packages"
                      ? "ชื่อโปรหรือหมายเหตุ"
                      : "ชื่อลูกค้า ทีม เบอร์ หรือชื่อโปร"
                  }
                />
              </FilterField>
            </FilterToolbar>
          </div>

          {offersMenu === "packages" ? (
            <div
              id="ft-offers-panel-packages"
              role="tabpanel"
              aria-labelledby="ft-offers-tab-packages"
              className="mt-4 space-y-3"
            >
              {offersFilteredPromotions.length === 0 ? (
                <AppEmptyState tone="violet">ไม่พบโปรโมชั่นตามตัวกรอง</AppEmptyState>
              ) : (
                offersFilteredPromotions.map((item) => (
                  <div key={item.id} className={footballTurfPanelCardClass}>
                    <div className={cn(footballTurfCardAccentBarClass(item.isActive ? "violet" : "slate"))} />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{item.name}</p>
                          <span
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200",
                            )}
                          >
                            {item.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#8b87b8]">
                          {item.totalUses} รอบ · {item.durationMinutes} นาทีต่อรอบ
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <p className="mr-1 text-base font-black text-[#4d47b6]">{formatMoney(item.price)}</p>
                        <button
                          type="button"
                          className={cn(assetRowEditIconButtonClass, footballTurfInteractiveButtonClass)}
                          aria-label={`แก้ไขโปรโมชั่น ${item.name}`}
                          title="แก้ไข"
                          onClick={() => openPromotionModal(item)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={cn(assetRowRemoveIconButtonClass, footballTurfInteractiveButtonClass)}
                          aria-label={`ลบโปรโมชั่น ${item.name}`}
                          title="ลบ"
                          onClick={() => void onDeletePromotion(item.id, item.name)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div
              id="ft-offers-panel-holders"
              role="tabpanel"
              aria-labelledby="ft-offers-tab-holders"
              className="mt-4 space-y-3"
            >
              {offersFilteredSales.length === 0 ? (
                <AppEmptyState tone="violet">ไม่พบลูกค้าที่ถือสิทธิ์ตามตัวกรอง</AppEmptyState>
              ) : (
                offersFilteredSales.map((item) => (
                  <div key={item.id} className={footballTurfPanelCardClass}>
                    <div
                      className={cn(
                        footballTurfCardAccentBarClass(
                          item.status === "ACTIVE"
                            ? item.paymentStatus === "PAID"
                              ? "emerald"
                              : "amber"
                            : "slate",
                        ),
                      )}
                    />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-black tracking-tight text-[#1e1b4b]">
                          {item.teamName || item.customerName}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-[#8b87b8]">
                          {item.promotionName} · {item.customerPhone}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                              bookingPaymentStatusClass(item.paymentStatus),
                            )}
                          >
                            {bookingPaymentStatusLabel(item.paymentStatus)}
                          </span>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                            {item.paymentMethod === "TRANSFER"
                              ? "โอนเงิน"
                              : item.paymentMethod === "CASH"
                                ? "เงินสด"
                                : "ชำระหน้าสนาม"}
                          </span>
                          <span className="text-xs font-black text-[#4d47b6]">{formatMoney(item.price)}</span>
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200">
                            เหลือ {item.remainingUses}/{item.totalUses}
                          </span>
                        </div>
                        {item.paymentSlipDataUrl ? (
                          <div className="mt-3">
                            <AppImageThumb
                              src={item.paymentSlipDataUrl}
                              alt={`สลิป ${item.promotionName}`}
                              onOpen={() =>
                                item.paymentSlipDataUrl && saleSlipLightbox.open(item.paymentSlipDataUrl)
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {item.paymentStatus === "PENDING_REVIEW" || item.paymentStatus === "UNPAID" ? (
                            <button
                              type="button"
                              onClick={() => void confirmPromotionSalePayment(item.id)}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                footballTurfInteractiveButtonClass,
                                "border border-emerald-200 bg-emerald-50 text-emerald-700",
                              )}
                            >
                              ยืนยันชำระ
                            </button>
                          ) : null}
                          {item.paymentStatus === "PAID" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPrintPreferTaxInvoice(
                                  Boolean(
                                    customers.find(
                                      (c) =>
                                        c.phone.replace(/\D/g, "") ===
                                        item.customerPhone.replace(/\D/g, ""),
                                    )?.taxInvoiceEnabled,
                                  ),
                                );
                                setPrintPromotionSale(item);
                              }}
                              className={cn(
                                footballTurfChipActionButtonClass,
                                footballTurfInteractiveButtonClass,
                                "border border-indigo-200 bg-indigo-50 text-indigo-700",
                              )}
                              aria-label={`พิมพ์สลิป ${item.teamName || item.customerName}`}
                            >
                              พิมพ์
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={cn(assetRowEditIconButtonClass, footballTurfInteractiveButtonClass)}
                            aria-label={`แก้ไขสิทธิ์ ${item.teamName || item.customerName}`}
                            title="แก้ไข"
                            onClick={() => openPromotionSaleEditModal(item)}
                          >
                            <IconRowEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={cn(assetRowRemoveIconButtonClass, footballTurfInteractiveButtonClass)}
                            aria-label={`ลบสิทธิ์ ${item.teamName || item.customerName}`}
                            title="ลบ"
                            onClick={() =>
                              void onDeletePromotionSale(item.id, item.teamName || item.customerName)
                            }
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
            </>
          ) : null}

          {crmSection === "customers" ? (
            <>
          <nav className={cn(footballTurfFilterChipShellClass, "mt-3")} aria-label="กรองลูกค้า">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {(
                [
                  { id: "all" as const, label: "ทั้งหมด", count: customerStatsSummary.total },
                  { id: "active" as const, label: "ใช้งาน", count: customerStatsSummary.active },
                  { id: "inactive" as const, label: "ปิด", count: customerStatsSummary.inactive },
                  { id: "tax" as const, label: "ใบกำกับ", count: customerStatsSummary.taxReady },
                  { id: "points" as const, label: "คะแนน", count: customerStatsSummary.withPoints },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={customersMenu === tab.id}
                  id={`ft-customers-tab-${tab.id}`}
                  aria-controls="ft-customers-panel"
                  onClick={() => setCustomersMenu(tab.id)}
                  className={footballTurfFilterChipClass(customersMenu === tab.id)}
                >
                  {tab.label}
                  <span className="ml-1 opacity-80">({tab.count.toLocaleString("th-TH")})</span>
                </button>
              ))}
            </div>
          </nav>

          {customersFilterOpen ? (
            <div className="mt-3 space-y-2 rounded-[1.25rem] border border-[#e8e6fc]/80 bg-white/70 p-3 shadow-sm sm:hidden">
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">ค้นหา</span>
                <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200/85 bg-white px-3">
                  <Search className="h-4 w-4 shrink-0 text-[#5b61ff]" aria-hidden />
                  <input
                    type="search"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
                    placeholder="ชื่อ เบอร์โทร ทีม"
                    aria-label="ค้นหาลูกค้า"
                  />
                </div>
              </label>
              {Boolean(customerSearch.trim()) || customersMenu !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearch("");
                    setCustomersMenu("all");
                    setCustomersFilterOpen(false);
                  }}
                  className="text-xs font-black text-[#4d47b6]"
                >
                  ล้างตัวกรอง
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="hidden sm:block">
            <FilterToolbar
              title="ค้นหาลูกค้า"
              summary={
                customerSearch.trim()
                  ? `ค้นหา "${customerSearch.trim()}"`
                  : customersMenu === "all"
                    ? "แสดงลูกค้าทั้งหมด"
                    : `กรองตามเมนู · ${customersFiltered.length} รายการ`
              }
              activeCount={Number(Boolean(customerSearch.trim())) + Number(customersMenu !== "all")}
              onReset={() => {
                setCustomerSearch("");
                setCustomersMenu("all");
              }}
              mobileCollapsed={false}
            >
              <FilterField label="ค้นหา" icon={<Search className="h-4 w-4" />}>
                <input
                  type="search"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className={FILTER_CONTROL_CLASS}
                  placeholder="ชื่อ เบอร์โทร ทีม"
                />
              </FilterField>
            </FilterToolbar>
          </div>

          <div id="ft-customers-panel" role="tabpanel" aria-labelledby={`ft-customers-tab-${customersMenu}`} className="mt-4 space-y-3">
            {customersFiltered.length === 0 ? (
              <AppEmptyState tone="violet">ไม่พบลูกค้าตามตัวกรอง</AppEmptyState>
            ) : (
              customersFiltered.map((item) => (
                <div key={item.id} className={footballTurfPanelCardClass}>
                  <div className={cn(footballTurfCardAccentBarClass(item.isActive ? "violet" : "slate"))} />
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {item.photoUrl ? (
                        <AppImageThumb
                          src={item.photoUrl}
                          alt={`รูป ${item.name}`}
                          onOpen={() => customerPhotoLightbox.open(item.photoUrl)}
                          className="h-14 w-14 shrink-0"
                        />
                      ) : (
                        <span
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-sm font-black text-[#4d47b6] ring-1 ring-white/70"
                          aria-hidden
                        >
                          {(item.name.trim().charAt(0) || "?").toUpperCase()}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCustomerStatsPhone(item.phone)}
                        className={cn(
                          "min-w-0 flex-1 rounded-xl p-1 text-left outline-none transition-all duration-200",
                          "hover:bg-white/55 focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35",
                        )}
                        aria-label={`ดูสถิติลูกค้า ${item.name}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black tracking-tight text-[#1e1b4b]">{item.name}</p>
                          <span
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                              item.isActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-500 ring-slate-200",
                            )}
                          >
                            {item.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                          </span>
                          {(item.pointsBalance ?? 0) > 0 || (item.totalEarned ?? 0) > 0 ? (
                            <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-800 ring-1 ring-violet-200">
                              {(item.pointsBalance ?? 0).toLocaleString("th-TH")} คะแนน
                            </span>
                          ) : null}
                          {item.taxInvoiceEnabled ? (
                            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800 ring-1 ring-amber-200">
                              ใบกำกับภาษี
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#66638c]">
                          {item.phone}
                          {item.teamName ? ` · ${item.teamName}` : ""}
                        </p>
                        {item.note ? <p className="mt-1 text-xs text-[#8b87b8]">{item.note}</p> : null}
                      </button>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        className={cn(assetRowEditIconButtonClass, footballTurfInteractiveButtonClass)}
                        aria-label={`แก้ไขลูกค้า ${item.name}`}
                        title="แก้ไข"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openCustomerModal(item);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={cn(assetRowRemoveIconButtonClass, footballTurfInteractiveButtonClass)}
                        aria-label={`ลบลูกค้า ${item.name}`}
                        title="ลบ"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void onDeleteCustomer(item.id, item.name);
                        }}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
            </>
          ) : null}
        </AppDashboardSection>
      ) : null}

      {activeTab === "qr" && !staffPortal ? (
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <button
              type="button"
              onClick={() => setQrHubModal("customer")}
              className={footballTurfHubCardVioletClass}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#7c66ff] text-white shadow-lg">
                  <QrCode className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR / ลิงก์ลูกค้า</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">ลิงก์จองสนาม · QR พอร์ทัลลูกค้า</p>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#5b61ff]">คลิกเพื่อเปิด</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setQrHubModal("staff")}
              className={footballTurfHubCardAmberClass}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR พนักงาน</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">ลิงก์ลับ · ภาพรวม · จอง · โปร</p>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-amber-800">คลิกเพื่อเปิด</p>
                </div>
              </div>
            </button>
          </div>

          <FormModal
            open={qrHubModal === "customer"}
            onClose={() => setQrHubModal(null)}
            size="lg"
            appearance="glass"
            glassTint="violet"
            mobileCentered
            title="QR / ลิงก์ลูกค้า"
            description="ลิงก์จองสนามสำหรับลูกค้า — คัดลอก · สแกน QR · ดาวน์โหลดโปสเตอร์"
            footer={
              <div className="flex justify-end">
                <button
                  type="button"
                  className="app-btn-primary rounded-[1rem] px-4 py-2 text-sm font-bold"
                  onClick={() => setQrHubModal(null)}
                >
                  ปิด
                </button>
              </div>
            }
          >
            <ModulePublicLinkQrPanel
              pageUrl={publicBookUrl}
              shopLabel={settings.venueName || "สนามฟุตบอล"}
              logoUrl={settings.logoUrl || null}
              tagline="สแกนเข้าหน้าจองสนาม — เลือกวัน · ช่วงเวลา · ชำระมัดจำ/เต็ม"
              mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อจองสนามฟุตบอล"
              openPrimaryLabel="เปิดหน้าจองลูกค้า"
              openSecondaryLabel="เปิดหน้า"
              downloadFilePrefix="football-turf-customer-qr"
            />
          </FormModal>

          <FormModal
            open={qrHubModal === "staff"}
            onClose={() => setQrHubModal(null)}
            size="lg"
            appearance="glass"
            glassTint="amber"
            mobileCentered
            title="QR พนักงาน"
            description="สร้างลิงก์ถาวรให้พนักงานใช้ภาพรวม · จอง · โปร — ตั้งรหัสประจำวันได้ที่ตั้งค่า → ชำระเงิน"
            footer={
              <div className="flex justify-end">
                <button
                  type="button"
                  className="app-btn-primary rounded-[1rem] px-4 py-2 text-sm font-bold"
                  onClick={() => setQrHubModal(null)}
                >
                  ปิด
                </button>
              </div>
            }
          >
            <ModuleStaffTokenQrPanel
              staffLinkApiPath="/api/football-turf/session/staff-link"
              shopLabel={settings.venueName || "สนามฟุตบอล"}
              logoUrl={settings.logoUrl || null}
              tagline="สแกนเข้าหน้าพนักงาน — ภาพรวม · จอง · โปร"
              mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อเข้าหน้าพนักงานสนามฟุตบอล"
              openPrimaryLabel="เปิดหน้าพนักงาน"
            />
          </FormModal>
        </div>
      ) : null}

      {activeTab === "courts" ? (
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="จัดการสนาม"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button
                type="button"
                aria-label="เพิ่มสนาม"
                onClick={() => openCourtModal()}
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 text-sm font-black shadow-sm sm:min-w-0 sm:px-4"
              >
                <span className="sm:hidden" aria-hidden>
                  +
                </span>
                <span className="hidden sm:inline">+ เพิ่มสนาม</span>
              </button>
            }
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courts.length === 0 ? (
              <AppEmptyState tone="violet" className="md:col-span-2 xl:col-span-3">
                ยังไม่มีสนาม — กดเพิ่มสนามเพื่อเริ่มตั้งค่ารอบและราคา
              </AppEmptyState>
            ) : (
              courts.map((court) => (
                <div
                  key={court.id}
                  className={cn(
                    footballTurfContentCardClass,
                    "flex h-full flex-col overflow-hidden !p-0",
                    !court.isActive && "opacity-70",
                  )}
                >
                  <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-indigo-50">
                    {court.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={court.imageUrl}
                        alt={court.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                        <Landmark className="h-8 w-8" aria-hidden />
                        <span className="text-[11px] font-bold">ยังไม่มีรูป</span>
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-black ring-1",
                        court.isActive
                          ? "bg-emerald-50/95 text-emerald-800 ring-emerald-200"
                          : "bg-slate-100/95 text-slate-600 ring-slate-300",
                      )}
                    >
                      {court.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{court.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#66638c]">
                        เปิด {court.openTime}–{court.closeTime} น. (เวลาไทย) · รอบละ {court.slotMinutes} นาที
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#4d47b6]">
                        จ–ศ {formatMoney(court.weekdayPrice)} · น–อา {formatMoney(court.weekendPrice)}
                      </p>
                    </div>
                    <div className="mt-auto flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${court.name}`}
                        title="แก้ไข"
                        onClick={() => openCourtModal(court)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบสนาม ${court.name}`}
                        title="ลบ"
                        onClick={() => void onDeleteCourt(court.id, court.name)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </AppDashboardSection>
      ) : null}

      {activeTab === "settings" ? (
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="ตั้งค่า"
            className="flex flex-row items-center justify-between gap-2 sm:gap-3"
            actionWrapClassName="min-w-0 shrink-0 self-center"
            action={
              settingsMenu !== "loyalty" && settingsMenu !== "preview" ? (
                <button
                  type="button"
                  onClick={() => void onSaveSettings()}
                  className={cn("app-btn-primary shrink-0 shadow-sm", footballTurfHeaderIconButtonClass)}
                  aria-label="บันทึกการตั้งค่า"
                >
                  <span className="text-[11px] sm:text-sm">บันทึก</span>
                </button>
              ) : null
            }
          />

          <div className="mt-3 w-full sm:hidden">
            <label
              htmlFor="ft-settings-menu-mobile"
              className="mb-1.5 block text-[11px] font-black text-[#4d47b6]"
            >
              กรุณาเลือกหมวดตั้งค่า
            </label>
            <select
              id="ft-settings-menu-mobile"
              value={settingsMenu}
              onChange={(e) =>
                setSettingsMenu(e.target.value as "venue" | "payment" | "docs" | "loyalty" | "preview")
              }
              className={footballTurfMobileSelectClass}
              aria-label="กรุณาเลือกหมวดตั้งค่า"
            >
              <option value="venue">ข้อมูลสนาม</option>
              <option value="payment">รับโอน / จอง</option>
              <option value="docs">เอกสาร · สลิป</option>
              <option value="loyalty">คะแนน</option>
              <option value="preview">ตัวอย่าง</option>
            </select>
          </div>

          <div className="mt-3 hidden w-full sm:block">
            <nav className={footballTurfPrimaryTabShellClass} aria-label="เมนูตั้งค่า">
              <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
                {(
                  [
                    { id: "venue" as const, label: "ข้อมูลสนาม" },
                    { id: "payment" as const, label: "รับโอน / จอง" },
                    { id: "docs" as const, label: "เอกสาร · สลิป" },
                    { id: "loyalty" as const, label: "คะแนน" },
                    { id: "preview" as const, label: "ตัวอย่าง" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={settingsMenu === tab.id}
                    id={`ft-settings-tab-${tab.id}`}
                    aria-controls={`ft-settings-panel-${tab.id}`}
                    onClick={() => setSettingsMenu(tab.id)}
                    className={cn(footballTurfPrimaryTabPillClass(settingsMenu === tab.id), "grow-0 basis-auto")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          <div className="mt-4 space-y-4">
            {settingsMenu === "venue" ? (
              <div id="ft-settings-panel-venue" role="tabpanel" aria-labelledby="ft-settings-tab-venue" className="space-y-4">
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>ชื่อและภาพรวม</p>
                  <div className="mt-3 space-y-4">
                    <AppShopLogoField
                      logoUrl={settingsForm.logoUrl.trim() || null}
                      fallbackLabel={settingsForm.venueName || "สนาม"}
                      uploadUrl="/api/football-turf/upload"
                      onLogoUrlChange={(url) => setSettingsForm((state) => ({ ...state, logoUrl: url }))}
                      labels={{ gallery: "เลือกโลโก้", camera: "ถ่ายโลโก้" }}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={footballTurfLabelClass}>
                        ชื่อสนาม
                        <input
                          className={footballTurfFieldClass}
                          value={settingsForm.venueName}
                          onChange={(e) => setSettingsForm((state) => ({ ...state, venueName: e.target.value }))}
                          placeholder="เช่น สนามฟุตบอล MAWELL"
                        />
                      </label>
                      <label className={footballTurfLabelClass}>
                        ชื่อบรรทัดรอง
                        <input
                          className={footballTurfFieldClass}
                          value={settingsForm.venueSubtitle}
                          onChange={(e) => setSettingsForm((state) => ({ ...state, venueSubtitle: e.target.value }))}
                          placeholder="เช่น สนามหญ้าเทียม"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>ข้อมูลติดต่อ</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className={footballTurfLabelClass}>
                      เบอร์ติดต่อ
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.contactPhone}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, contactPhone: e.target.value }))}
                        placeholder="เบอร์ติดต่อสนาม"
                      />
                    </label>
                    <label className={footballTurfLabelClass}>
                      LINE / ช่องทางอื่น
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.contactLine}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, contactLine: e.target.value }))}
                        placeholder="LINE OA / Facebook"
                      />
                    </label>
                    <label className={cn(footballTurfLabelClass, "sm:col-span-2")}>
                      ที่อยู่สนาม
                      <textarea
                        className={cn(footballTurfFieldClass, "min-h-[110px]")}
                        value={settingsForm.venueAddress}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, venueAddress: e.target.value }))}
                        placeholder="ที่อยู่สำหรับลูกค้าและเอกสาร"
                      />
                    </label>
                  </div>
                </div>
                <FootballTurfPortalMediaSettings
                  bannerUrl={settingsForm.portalBannerUrl}
                  gallery={settingsForm.portalGallery}
                  facebookUrl={settingsForm.facebookUrl}
                  mapUrl={settingsForm.mapUrl}
                  onBannerUrlChange={(url) =>
                    setSettingsForm((state) => ({ ...state, portalBannerUrl: url }))
                  }
                  onGalleryChange={(urls) =>
                    setSettingsForm((state) => ({ ...state, portalGallery: urls }))
                  }
                  onFacebookUrlChange={(url) =>
                    setSettingsForm((state) => ({ ...state, facebookUrl: url }))
                  }
                  onMapUrlChange={(url) => setSettingsForm((state) => ({ ...state, mapUrl: url }))}
                />
              </div>
            ) : null}

            {settingsMenu === "payment" ? (
              <div id="ft-settings-panel-payment" role="tabpanel" aria-labelledby="ft-settings-tab-payment" className="space-y-4">
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>ข้อมูลรับโอน</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className={footballTurfLabelClass}>
                      หมายเลขพร้อมเพย์
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.promptpayNumber}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, promptpayNumber: e.target.value }))}
                        placeholder="เบอร์พร้อมเพย์"
                      />
                    </label>
                    <label className={footballTurfLabelClass}>
                      ธนาคาร
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.bankName}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, bankName: e.target.value }))}
                        placeholder="ชื่อธนาคาร"
                      />
                    </label>
                    <label className={footballTurfLabelClass}>
                      ชื่อบัญชี
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.accountName}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, accountName: e.target.value }))}
                        placeholder="ชื่อเจ้าของบัญชี"
                      />
                    </label>
                    <label className={footballTurfLabelClass}>
                      หมายเลขบัญชี
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.accountNumber}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, accountNumber: e.target.value }))}
                        placeholder="เลขบัญชีธนาคาร"
                      />
                    </label>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>ชำระตอนจองจากลิงก์ลูกค้า</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        { value: "NONE", label: "ไม่ต้องชำระ" },
                        { value: "DEPOSIT", label: "มัดจำ" },
                        { value: "FULL", label: "ชำระเต็มยอด" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setSettingsForm((state) => ({
                            ...state,
                            portalBookingPaymentMode: opt.value,
                          }))
                        }
                        className={cn(
                          "min-h-[44px] rounded-xl border px-3 text-sm font-black",
                          footballTurfInteractiveButtonClass,
                          settingsForm.portalBookingPaymentMode === opt.value
                            ? "border-[#5b61ff]/50 bg-[#5b61ff]/15 text-[#4d47b6] ring-1 ring-[#5b61ff]/25"
                            : "border-white/60 bg-white/70 text-[#66638c]",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {settingsForm.portalBookingPaymentMode === "DEPOSIT" ? (
                    <label className={cn(footballTurfLabelClass, "mt-3 block")}>
                      จำนวนมัดจำ (บาท)
                      <input
                        type="number"
                        min={0}
                        className={footballTurfFieldClass}
                        value={settingsForm.depositAmountBaht ?? ""}
                        onChange={(e) =>
                          setSettingsForm((state) => ({
                            ...state,
                            depositAmountBaht: e.target.value === "" ? null : Number(e.target.value),
                          }))
                        }
                        placeholder="เช่น 300"
                      />
                    </label>
                  ) : null}
                </div>
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>ลิงก์พนักงาน</p>
                  <div className="mt-3">
                    <AppStaffDailyPinSettingsField
                      fieldClassName={footballTurfFieldClass}
                      pinSet={Boolean(settingsForm.staffDailyPinSet)}
                      pinDraft={staffPinDraft}
                      onPinDraftChange={setStaffPinDraft}
                      clearPin={staffClearPin}
                      onClearPinChange={setStaffClearPin}
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-[#8b87b8]">
                    สร้าง QR / ลิงก์ได้ที่แท็บ QR · ตั้งรหัสแล้วพนักงานต้องใส่ทุกวัน (เวลาไทย)
                  </p>
                </div>
              </div>
            ) : null}

            {settingsMenu === "docs" ? (
              <div id="ft-settings-panel-docs" role="tabpanel" aria-labelledby="ft-settings-tab-docs" className="space-y-4">
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>เอกสาร</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className={footballTurfLabelClass}>
                      หมายเลขกำกับภาษี
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.taxId}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, taxId: e.target.value }))}
                        placeholder="เลขผู้เสียภาษี"
                      />
                    </label>
                    <label className={footballTurfLabelClass}>
                      หมายเหตุอื่นๆ
                      <input
                        className={footballTurfFieldClass}
                        value={settingsForm.note}
                        onChange={(e) => setSettingsForm((state) => ({ ...state, note: e.target.value }))}
                        placeholder="ข้อมูลอื่นที่ต้องการแสดง"
                      />
                    </label>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <p className={footballTurfSectionEyebrowClass}>สลิปใบเสร็จ</p>
                  <div className="mt-3">
                    <AppSlipPaperSizeSettingsField
                      fieldClassName={footballTurfFieldClass}
                      hint="ใช้ตอนพิมพ์ใบเสร็จ · เฉพาะโมดูลสนามฟุตบอล"
                      value={settingsForm.slipPaperSize ?? "SLIP_58"}
                      onChange={(slipPaperSize) =>
                        setSettingsForm((state) => ({ ...state, slipPaperSize }))
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {settingsMenu === "loyalty" ? (
              <div id="ft-settings-panel-loyalty" role="tabpanel" aria-labelledby="ft-settings-tab-loyalty">
                <FootballTurfLoyaltySettingsPanel embedded />
              </div>
            ) : null}

            {settingsMenu === "preview" ? (
              <div id="ft-settings-panel-preview" role="tabpanel" aria-labelledby="ft-settings-tab-preview" className="space-y-3">
                <div className={cn(footballTurfPanelCardClass, "border-[#e8e6fc]/80")}>
                  <p className={cn(footballTurfSectionEyebrowClass, "text-[#4d47b6]")}>โมดูล</p>
                  <div className="mt-3 flex items-start gap-3">
                    {settingsForm.logoUrl.trim() ? (
                      <Image
                        src={settingsForm.logoUrl.trim()}
                        alt=""
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <h2
                        className="text-2xl font-black tracking-tight text-[#1e1b4b]"
                        style={MODULE_TITLE_FONT}
                      >
                        {FOOTBALL_TURF_MODULE_NAME}
                      </h2>
                      <p className="mt-1 text-sm font-bold text-[#66638c]">
                        {settingsForm.venueName.trim() || settingsForm.venueSubtitle.trim() || "ยังไม่ได้ตั้งชื่อสนาม"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#4d47b6] ring-1 ring-indigo-100">
                      <CreditCard className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className={footballTurfSectionEyebrowClass}>รับโอนเงินค่าจอง</p>
                      <p className="mt-2 text-sm font-black text-[#1e1b4b]">
                        {settingsForm.promptpayNumber.trim() || settingsForm.accountNumber.trim() || "-"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#66638c]">
                        {settingsForm.accountName.trim() || settingsForm.bankName.trim() || "ยังไม่ได้ตั้งค่าบัญชี"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className={footballTurfSectionEyebrowClass}>ที่อยู่สนาม</p>
                      <p className="mt-2 text-sm font-medium text-[#5f5a8a]">
                        {settingsForm.venueAddress.trim() || "-"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                      <Phone className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className={footballTurfSectionEyebrowClass}>ติดต่อ</p>
                      <p className="mt-2 text-sm font-medium text-[#5f5a8a]">
                        {settingsForm.contactPhone.trim() || "-"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#8b87b8]">
                        {settingsForm.contactLine.trim() || settingsForm.taxId.trim() || "-"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={footballTurfPanelCardClass}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                      <FileText className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className={footballTurfSectionEyebrowClass}>หมายเหตุ · สลิป</p>
                      <p className="mt-2 text-sm font-medium text-[#5f5a8a]">
                        {settingsForm.note.trim() || "ไม่มีข้อมูลเพิ่มเติม"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#8b87b8]">
                        {settingsForm.portalBookingPaymentMode === "DEPOSIT"
                          ? `มัดจำ ${Number(settingsForm.depositAmountBaht ?? 0).toLocaleString("th-TH")} บาท`
                          : settingsForm.portalBookingPaymentMode === "FULL"
                            ? "ชำระเต็มยอด"
                            : "ไม่ต้องชำระตอนจอง"}
                        {" · "}
                        {settingsForm.slipPaperSize || "SLIP_58"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {settingsMenu !== "loyalty" && settingsMenu !== "preview" ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void onSaveSettings()}
                  className={cn(
                    "app-btn-primary rounded-2xl px-5 py-3 text-sm font-black shadow-lg",
                    footballTurfInteractiveButtonClass,
                  )}
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            ) : null}
          </div>
        </AppDashboardSection>
      ) : null}

      <FormModal
        open={bookingOpen}
        onClose={closeBookingModal}
        title={editingBookingId != null ? "แก้ไขการจอง" : bookingSource === "WALK_IN" ? "เพิ่มคิว walk-in" : "เพิ่มการจองสนาม"}
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={closeBookingModal}
            submitLabel={
              editingBookingId != null
                ? "บันทึกการแก้ไข"
                : bookingSelectedSlots.length > 1
                  ? `บันทึก ${bookingSelectedSlots.length} คิว`
                  : "บันทึกคิว"
            }
            submitDisabled={!canSubmitBooking || bookingSaving}
            onSubmit={() => void onCreateBooking()}
          />
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-600">สนาม<select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={bookingForm.courtId} onChange={(e) => updateBookingCourt(e.target.value)}>{courts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              วันที่
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:bg-slate-100"
                value={bookingForm.bookingDate}
                min={localDateKey(new Date(liveClockMs))}
                disabled={bookingSource === "WALK_IN" && editingBookingId == null}
                onChange={(e) => updateBookingDate(e.target.value)}
              />
            </label>
          </div>
          {editingBookingId == null ? (
            <p className="text-xs font-semibold text-[#66638c]">
              {bookingSource === "WALK_IN"
                ? "เช็คอิน: เลือกรอบปัจจุบันที่ว่าง หรือรอบถัดไปที่ยังไม่มีคนจอง (วันนี้เท่านั้น · เลือกได้ทีละรอบ)"
                : "จอง: เลือกรอบถัดไปที่ยังไม่เริ่มเท่านั้น — ไม่รวมรอบที่กำลังเล่น"}
            </p>
          ) : null}
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {editingBookingId != null ? "ช่วงเวลา" : "เลือกช่วงเวลาได้หลายรอบ"}
                </p>
                {editingBookingId == null ? (
                  <p className="mt-1 text-xs font-semibold text-[#66638c]">กดเลือก/ยกเลิกช่วงว่าง · บันทึกเป็นหลายคิว</p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {editingBookingId != null ? "ช่วงเวลาที่เลือก" : "สรุปที่เลือก"}
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {editingBookingId != null
                    ? bookingForm.startTime && bookingForm.endTime
                      ? `${bookingForm.startTime} - ${bookingForm.endTime}`
                      : "ไม่มีช่วงว่าง"
                    : bookingSelectedSlots.length > 0
                      ? `${bookingSelectedSlots.length} ช่วง · รวม ${formatMoney(bookingSelectedTotal)}`
                      : "ยังไม่ได้เลือกช่วง"}
                </p>
              </div>
            </div>
            {editingBookingId != null ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-slate-600">
                  เวลาเริ่ม (24 ชม.)
                  <AppTime24Input
                    aria-label="เวลาเริ่ม"
                    minuteStep={1}
                    value={bookingForm.startTime}
                    onChange={(startTime) => setBookingForm((state) => ({ ...state, startTime }))}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-slate-600">
                  เวลาสิ้นสุด (24 ชม.)
                  <AppTime24Input
                    aria-label="เวลาสิ้นสุด"
                    minuteStep={1}
                    value={bookingForm.endTime}
                    onChange={(endTime) => setBookingForm((state) => ({ ...state, endTime }))}
                  />
                </label>
              </div>
            ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {bookingTimeline.length === 0 ? (
                <div className="sm:col-span-2">
                  <AppEmptyState tone="violet">ยังไม่มีช่วงเวลาให้เลือกสำหรับสนามนี้</AppEmptyState>
                </div>
              ) : (
                bookingTimeline.map((slot) => {
                  const isBooked = Boolean(slot.booking);
                  const timePassed = !isBooked && isSlotTimePassed(slot, bookingFormTimeOpts);
                  const eligible =
                    !isBooked &&
                    !timePassed &&
                    (bookingSource === "WALK_IN"
                      ? isSlotEligibleForWalkIn(slot, bookingTimeline, bookingFormTimeOpts)
                      : isSlotEligibleForAdvanceBooking(slot, bookingFormTimeOpts));
                  const isBlocked = isBooked || timePassed || !eligible;
                  const isSelected =
                    !isBlocked &&
                    bookingSelectedSlots.some(
                      (row) => row.startTime === slot.startTime && row.endTime === slot.endTime,
                    );
                  return (
                    <button
                      key={`booking-slot-${slot.startTime}-${slot.endTime}`}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => toggleBookingSlot(slot.startTime, slot.endTime)}
                      className={cn(
                        "rounded-[1.35rem] border px-4 py-3 text-left transition-all",
                        isBlocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100/80 opacity-70"
                          : isSelected
                            ? "border-emerald-300 bg-emerald-50 shadow-sm ring-2 ring-emerald-200/70"
                            : "border-white/80 bg-white/90 shadow-sm hover:border-emerald-200 hover:bg-emerald-50/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {isBooked
                              ? `${slot.booking?.teamName || slot.booking?.customerName} · ${slot.booking?.customerPhone}`
                              : timePassed
                                ? "หมดเวลา · จองไม่ได้"
                                : !eligible
                                  ? bookingSource === "WALK_IN"
                                    ? "ไม่ใช่รอบปัจจุบัน/รอบถัดไป"
                                    : "จองได้เฉพาะรอบถัดไป"
                                  : isSelected
                                    ? "เลือกแล้ว · กดอีกครั้งเพื่อยกเลิก"
                                    : "ว่าง · กดเพื่อเลือก"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                            isBooked
                              ? bookingStatusClass(slot.booking!.status)
                              : timePassed || !eligible
                                ? "bg-slate-200 text-slate-500 ring-slate-300"
                                : isSelected
                                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                  : "bg-slate-50 text-slate-500 ring-slate-200",
                          )}
                        >
                          {isBooked
                            ? bookingStatusLabel(slot.booking!.status)
                            : timePassed
                              ? "หมดเวลา"
                              : !eligible
                                ? "เลือกไม่ได้"
                                : isSelected
                                  ? "เลือกแล้ว"
                                  : "ว่าง"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            )}
          </div>
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ข้อมูลลูกค้า / ทีม</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FootballTurfMemberPhoneSearchField
                phone={bookingForm.customerPhone}
                onPhoneChange={(value) => {
                  setBookingForm((s) => ({ ...s, customerPhone: value }));
                  setBookingCustomerCandidates([]);
                  setBookingCustomerHint(null);
                }}
                onSearch={searchBookingCustomer}
                candidates={bookingCustomerCandidates}
                onSelect={applyCustomerToBooking}
                hint={bookingCustomerHint}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="ชื่อลูกค้า"
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm((s) => ({ ...s, customerName: e.target.value }))}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="ชื่อทีม"
                value={bookingForm.teamName}
                onChange={(e) => setBookingForm((s) => ({ ...s, teamName: e.target.value }))}
              />
              <textarea
                className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 sm:col-span-2"
                placeholder="หมายเหตุ"
                value={bookingForm.note}
                onChange={(e) => setBookingForm((s) => ({ ...s, note: e.target.value }))}
              />
              {editingBookingId != null ? (
                <label className="space-y-1.5 text-sm font-medium text-slate-600 sm:col-span-2">
                  สถานะชำระเงิน
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                    value={bookingForm.paymentStatus}
                    onChange={(e) =>
                      setBookingForm((s) => ({
                        ...s,
                        paymentStatus: e.target.value as FootballTurfBookingPaymentStatus,
                      }))
                    }
                  >
                    <option value="UNPAID">ยังไม่ชำระ</option>
                    <option value="PENDING_REVIEW">รอตรวจสลิป</option>
                    <option value="PARTIAL">ชำระบางส่วน</option>
                    <option value="PAID">ชำระแล้ว</option>
                  </select>
                </label>
              ) : null}

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition sm:col-span-2",
                  footballTurfInteractiveButtonClass,
                  bookingTax.taxInvoiceEnabled
                    ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b] ring-1 ring-[#5b61ff]/20"
                    : "border-white/60 bg-white/55 text-slate-700 hover:bg-white/80",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#5b61ff]"
                  checked={bookingTax.taxInvoiceEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setBookingTax((s) => ({
                      ...s,
                      taxInvoiceEnabled: enabled,
                      billingName:
                        enabled && !s.billingName.trim()
                          ? bookingForm.customerName.trim()
                          : s.billingName,
                    }));
                    if (enabled && bookingForm.customerPhone.trim()) {
                      const matches = findFootballTurfCustomersByPhone(
                        customers,
                        bookingForm.customerPhone,
                      );
                      const cust =
                        matches.length === 1
                          ? matches[0]
                          : matches.find(
                              (c) =>
                                normalizeFtPhoneDigits(c.phone) ===
                                normalizeFtPhoneDigits(bookingForm.customerPhone),
                            );
                      if (cust && customerHasTaxProfile(cust)) {
                        setBookingTax(taxFieldsFromCustomer(cust));
                      }
                    }
                  }}
                />
                <span>
                  <span className="block">ต้องการใบกำกับภาษี</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
                    ถ้าสมาชิกมีข้อมูลใบกำกับอยู่แล้ว ระบบจะดึงมาให้ — พิมพ์จากปุ่มพิมพ์ในประวัติการเงิน
                  </span>
                </span>
              </label>
              {bookingTax.taxInvoiceEnabled ? (
                <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3 sm:col-span-2">
                  <p className="text-xs font-bold text-[#4d47b6]">ข้อมูลใบกำกับภาษี</p>
                  <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                    ชื่อ / ชื่อบริษัทในใบกำกับ
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                      value={bookingTax.billingName}
                      onChange={(e) => setBookingTax((s) => ({ ...s, billingName: e.target.value }))}
                      placeholder="ชื่อตามบัตรประชาชน หรือชื่อนิติบุคคล"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                      value={bookingTax.taxId}
                      onChange={(e) =>
                        setBookingTax((s) => ({
                          ...s,
                          taxId: e.target.value.replace(/\D/g, "").slice(0, 13),
                        }))
                      }
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                    ที่อยู่ลูกค้าในใบกำกับ
                    <textarea
                      className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                      value={bookingTax.taxAddress}
                      onChange={(e) => setBookingTax((s) => ({ ...s, taxAddress: e.target.value }))}
                      placeholder="บ้านเลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                    สาขา (ถ้ามี)
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                      value={bookingTax.taxBranch}
                      onChange={(e) => setBookingTax((s) => ({ ...s, taxBranch: e.target.value }))}
                      placeholder="เช่น สำนักงานใหญ่"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          {editingBookingId != null ? (
            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ชำระเงิน / สลิป</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBookingForm((s) => ({
                      ...s,
                      paymentMethod: "ONSITE",
                      paymentSlipDataUrl: "",
                    }))
                  }
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-black transition",
                    bookingForm.paymentMethod === "ONSITE"
                      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                      : "bg-white text-slate-500 ring-1 ring-slate-200",
                  )}
                >
                  เงินสด / หน้าสนาม
                </button>
                <button
                  type="button"
                  onClick={() => setBookingForm((s) => ({ ...s, paymentMethod: "TRANSFER" }))}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-black transition",
                    bookingForm.paymentMethod === "TRANSFER"
                      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                      : "bg-white text-slate-500 ring-1 ring-slate-200",
                  )}
                >
                  โอนเงิน / พร้อมเพย์
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm font-black text-slate-900">สลิปชำระ (ไม่บังคับ)</p>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                  value={bookingForm.paymentReference}
                  onChange={(e) => setBookingForm((s) => ({ ...s, paymentReference: e.target.value }))}
                />
                <AppGalleryCameraFileInputs
                  galleryInputRef={bookingSlipGalleryRef}
                  cameraInputRef={bookingSlipCameraInputRef}
                  onChange={(ev) => {
                    const f = ev.target.files?.[0];
                    ev.target.value = "";
                    if (!f) return;
                    void onBookingEditSlipSelected(f);
                  }}
                />
                <AppImagePickCameraButtons
                  busy={bookingEditSlipBusy || bookingSlipBusy}
                  onPickGallery={() => bookingSlipGalleryRef.current?.click()}
                  onPickCamera={() =>
                    openBookingSlipCamera((file) => {
                      void onBookingEditSlipSelected(file);
                    })
                  }
                  labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                />
                {bookingForm.paymentSlipDataUrl ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <AppImageThumb
                      src={bookingForm.paymentSlipDataUrl}
                      alt="สลิปรายรับ"
                      onOpen={() => saleSlipLightbox.open(bookingForm.paymentSlipDataUrl)}
                      className="h-20 w-20"
                    />
                    <button
                      type="button"
                      className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold text-rose-600")}
                      onClick={() => setBookingForm((s) => ({ ...s, paymentSlipDataUrl: "" }))}
                    >
                      ลบสลิป
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-[#66638c]">ยังไม่มีสลิป — อัปโหลดหรือถ่ายใหม่ได้</p>
                )}
              </div>
            </div>
          ) : null}

          {editingBookingId == null ? (
            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">การชำระเงิน</p>
              {bookingSource !== "WALK_IN" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingPayMode("DEPOSIT");
                      setBookingForm((s) => ({ ...s, paymentMethod: "TRANSFER", paymentSlipDataUrl: "" }));
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-black transition",
                      bookingPayMode === "DEPOSIT"
                        ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                        : "bg-white text-slate-500 ring-1 ring-slate-200",
                    )}
                  >
                    มัดจำ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingPayMode("FULL");
                      setBookingForm((s) => ({ ...s, paymentMethod: "TRANSFER", paymentSlipDataUrl: "" }));
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-black transition",
                      bookingPayMode === "FULL"
                        ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                        : "bg-white text-slate-500 ring-1 ring-slate-200",
                    )}
                  >
                    ชำระเต็ม
                  </button>
                </div>
              ) : null}
              <p className="mt-2 text-sm font-black text-[#1e1b4b]">
                {bookingSource === "WALK_IN"
                  ? `ชำระเต็มยอด · ${formatMoney(bookingSelectedTotal)}`
                  : bookingDepositMisconfigured
                    ? "เลือกมัดจำแล้ว แต่ยังไม่ได้ตั้งจำนวนมัดจำ — ไปแท็บตั้งค่า"
                    : bookingPayMode === "DEPOSIT"
                      ? `มัดจำตอนจอง · ${formatMoney(bookingPayDueTotal ?? 0)}${
                          bookingSelectedSlots.length > 1 ? ` (${bookingSelectedSlots.length} คิว)` : ""
                        }`
                      : `ชำระเต็มยอด · ${formatMoney(bookingPayDueTotal ?? bookingSelectedTotal)}`}
              </p>
              {bookingSource === "WALK_IN" ? (
                <p className="mt-1 text-xs font-semibold text-[#66638c]">
                  walk-in เช็กอินหน้างานต้องชำระเต็มก่อนเข้าสนาม
                </p>
              ) : bookingRequiresPay ? (
                <p className="mt-1 text-xs font-semibold text-[#66638c]">
                  ยอดค่าสนามรวม {formatMoney(bookingSelectedTotal)}
                  {bookingPayMode === "DEPOSIT" ? " · ส่วนที่เหลือชำระหน้าสนาม" : ""}
                </p>
              ) : bookingSelectedTotal > 0 ? (
                <p className="mt-1 text-xs font-semibold text-[#66638c]">
                  ยอดค่าสนามรวม {formatMoney(bookingSelectedTotal)}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBookingForm((s) => ({
                      ...s,
                      paymentMethod: "ONSITE",
                      paymentSlipDataUrl: "",
                    }))
                  }
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-black transition",
                    bookingForm.paymentMethod === "ONSITE"
                      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                      : "bg-white text-slate-500 ring-1 ring-slate-200",
                  )}
                >
                  {bookingSource === "WALK_IN"
                    ? "เงินสด / ชำระเต็มหน้าสนาม"
                    : bookingPayMode === "DEPOSIT"
                      ? "รับมัดจำเงินสด"
                      : "รับชำระเต็มเงินสด"}
                </button>
                <button
                  type="button"
                  onClick={() => setBookingForm((s) => ({ ...s, paymentMethod: "TRANSFER" }))}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-black transition",
                    bookingForm.paymentMethod === "TRANSFER"
                      ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                      : "bg-white text-slate-500 ring-1 ring-slate-200",
                  )}
                >
                  โอนเงิน / พร้อมเพย์
                </button>
              </div>

              {bookingForm.paymentMethod === "TRANSFER" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-black text-slate-900">
                        QR พร้อมเพย์ · {formatMoney(bookingPayDueTotal ?? bookingSelectedTotal)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      {bookingPromptPayQr.loading ? (
                        <p className="py-16 text-xs font-bold text-slate-400">กำลังสร้าง QR...</p>
                      ) : bookingPromptPayQr.dataUrl ? (
                        <Image
                          src={bookingPromptPayQr.dataUrl}
                          alt="QR พร้อมเพย์"
                          width={220}
                          height={220}
                          className="h-[220px] w-[220px] rounded-2xl bg-white p-2"
                          unoptimized
                        />
                      ) : (
                        <p className="py-10 text-center text-xs font-bold text-rose-600">
                          {bookingPromptPayQr.configured === false
                            ? "ยังไม่ได้ตั้งเบอร์พร้อมเพย์ในแท็บตั้งค่า"
                            : "สร้าง QR ไม่สำเร็จ"}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 space-y-2 text-xs font-medium text-slate-600">
                      <p>
                        พร้อมเพย์:{" "}
                        <span className="font-black text-slate-900">{settings.promptpayNumber || "-"}</span>
                      </p>
                      <p>
                        บัญชี:{" "}
                        <span className="font-black text-slate-900">{settings.accountNumber || "-"}</span>
                      </p>
                      <p>
                        {settings.bankName || settings.accountName
                          ? `${settings.bankName} · ${settings.accountName}`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-black text-slate-900">แนบสลิป</p>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold leading-snug text-[#66638c]">
                      {bookingSource === "WALK_IN"
                        ? "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินเต็มยอด"
                        : footballTurfPortalSlipProofMessage(bookingPayMode)}
                    </p>
                    <input
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                      placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                      value={bookingForm.paymentReference}
                      onChange={(e) => setBookingForm((s) => ({ ...s, paymentReference: e.target.value }))}
                    />
                    <div className="mt-3 space-y-3">
                      <AppGalleryCameraFileInputs
                        galleryInputRef={bookingSlipGalleryRef}
                        cameraInputRef={bookingSlipCameraInputRef}
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          ev.target.value = "";
                          if (!f) return;
                          void onBookingSlipSelected(f);
                        }}
                      />
                      <AppImagePickCameraButtons
                        onPickGallery={() => bookingSlipGalleryRef.current?.click()}
                        onPickCamera={() =>
                          openBookingSlipCamera((file) => {
                            void onBookingSlipSelected(file);
                          })
                        }
                        busy={bookingSlipBusy}
                        labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                      />
                    </div>
                    {bookingForm.paymentSlipDataUrl ? (
                      <div className="mt-3">
                        <AppImageThumb
                          src={bookingForm.paymentSlipDataUrl}
                          alt="สลิปการจอง"
                          onOpen={() => saleSlipLightbox.open(bookingForm.paymentSlipDataUrl)}
                          className="h-24 w-24"
                        />
                        <p className="mt-2 text-xs font-bold text-emerald-700">แนบสลิปแล้ว — บันทึกแล้วรอตรวจชำระ</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-bold text-amber-700">ต้องแนบหรือถ่ายสลิปก่อนบันทึกเมื่อเลือกโอนเงิน</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {bookingSource === "WALK_IN"
                    ? "บันทึกเป็นชำระเต็มแล้ว และเช็กอินทันที"
                    : bookingRequiresPay
                      ? "บันทึกเป็นรับชำระแล้วทันที (เงินสด / หน้าสนาม)"
                      : "บันทึกคิว — ชำระภายหลังได้"}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title={qrState.title || "QR ลิงก์"}
        footer={
          <FormModalFooterActions
            onCancel={() => setQrOpen(false)}
            cancelLabel="ปิด"
            submitLabel="ดาวน์โหลด QR"
            submitDisabled={!qrState.dataUrl}
            onSubmit={downloadQr}
          />
        }
      >
        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ลิงก์ปลายทาง</p>
            <p className="mt-2 break-all rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
              {qrState.url || "-"}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-[1.9rem] border border-white/70 bg-white/85 p-6 shadow-sm">
            {qrState.loading ? (
              <div className="flex h-[260px] w-[260px] items-center justify-center rounded-[1.75rem] bg-slate-50 text-sm font-bold text-slate-400 ring-1 ring-slate-200">
                กำลังสร้าง QR...
              </div>
            ) : qrState.dataUrl ? (
              <Image src={qrState.dataUrl} alt={qrState.title || "QR"} width={260} height={260} className="h-[260px] w-[260px] rounded-[1.75rem] bg-white p-3 ring-1 ring-slate-200" unoptimized />
            ) : (
              <div className="flex h-[260px] w-[260px] items-center justify-center rounded-[1.75rem] bg-slate-50 text-sm font-bold text-slate-400 ring-1 ring-slate-200">
                ยังไม่มี QR
              </div>
            )}
            {qrState.dataUrl ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => void copyText(qrState.url)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700">
                  คัดลอกลิงก์
                </button>
                <button type="button" onClick={downloadQr} className="app-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-sm">
                  <Download className="h-3.5 w-3.5" />
                  ดาวน์โหลด PNG
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={courtOpen}
        onClose={closeCourtModal}
        title={editingCourtId != null ? "แก้ไขสนาม" : "เพิ่มสนาม"}
        footer={
          <FormModalFooterActions
            onCancel={closeCourtModal}
            submitLabel="บันทึกสนาม"
            submitDisabled={!courtForm.name.trim()}
            onSubmit={() => void onSaveCourt()}
          />
        }
      >
        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 ring-1 ring-slate-200">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">รายละเอียดสนาม</p>
                <p className="mt-1 text-sm font-medium text-slate-600">เช่น สนาม A, สนาม 7 คน, สนามในร่ม หรือสนาม VIP</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="ชื่อสนาม"
                value={courtForm.name}
                onChange={(e) => setCourtForm((state) => ({ ...state, name: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">รูปสนาม</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">รูปปกที่ใช้แสดงในการจัดการสนาม</p>
            <div className="mt-3 space-y-3">
              <AppGalleryCameraFileInputs
                galleryInputRef={courtImageGalleryRef}
                cameraInputRef={courtCameraInputRef}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!f) return;
                  void onCourtImageSelected(f);
                }}
              />
              <AppImagePickCameraButtons
                onPickGallery={() => courtImageGalleryRef.current?.click()}
                onPickCamera={() =>
                  openCourtCamera((file) => {
                    void onCourtImageSelected(file);
                  })
                }
                busy={courtImageBusy}
                labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป" }}
              />
              {courtForm.imageUrl ? (
                <div className="flex items-start gap-3">
                  <AppImageThumb
                    src={courtForm.imageUrl}
                    alt="รูปสนาม"
                    onOpen={() => courtImageLightbox.open(courtForm.imageUrl)}
                    className="h-24 w-24"
                  />
                  <button
                    type="button"
                    className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-3 text-xs font-black text-rose-600")}
                    onClick={() => setCourtForm((s) => ({ ...s, imageUrl: "" }))}
                  >
                    ลบรูป
                  </button>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400">ยังไม่ได้แนบรูป</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              เวลาเปิด (เวลาไทย · 24 ชม.)
              <AppTime24Input
                aria-label="เวลาเปิด"
                minuteStep={1}
                value={courtForm.openTime}
                onChange={(openTime) => setCourtForm((state) => ({ ...state, openTime }))}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              เวลาปิด (เวลาไทย · 24 ชม.)
              <AppTime24Input
                aria-label="เวลาปิด"
                minuteStep={1}
                value={courtForm.closeTime}
                onChange={(closeTime) => setCourtForm((state) => ({ ...state, closeTime }))}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              นาทีต่อรอบ
              <input
                inputMode="numeric"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="60"
                value={courtForm.slotMinutes}
                onChange={(e) => setCourtForm((state) => ({ ...state, slotMinutes: e.target.value.replace(/\D/g, "").slice(0, 3) }))}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              ราคาวันธรรมดา
              <input
                inputMode="numeric"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="900"
                value={courtForm.weekdayPrice}
                onChange={(e) => setCourtForm((state) => ({ ...state, weekdayPrice: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              ราคาวันหยุด
              <input
                inputMode="numeric"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                placeholder="1200"
                value={courtForm.weekendPrice}
                onChange={(e) => setCourtForm((state) => ({ ...state, weekendPrice: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              />
            </label>
          </div>
          {editingCourtId != null ? (
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={courtForm.isActive}
                onChange={(e) => setCourtForm((state) => ({ ...state, isActive: e.target.checked }))}
              />
              เปิดใช้งานสนาม
            </label>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={promotionOpen}
        onClose={closePromotionModal}
        title={editingPromotionId != null ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น"}
        footer={
          <FormModalFooterActions
            onCancel={closePromotionModal}
            submitLabel="บันทึกโปรโมชั่น"
            onSubmit={() => void onSavePromotion()}
          />
        }
      >
        <div className="grid gap-4">
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อโปรโมชั่น" value={promotionForm.name} onChange={(e) => setPromotionForm((s) => ({ ...s, name: e.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-3">
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={promotionForm.kind} onChange={(e) => setPromotionForm((s) => ({ ...s, kind: e.target.value }))}><option value="COUNT">จำนวนรอบ</option><option value="HOUR">จำนวนชั่วโมง</option></select>
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="จำนวนสิทธิ์" value={promotionForm.totalUses} onChange={(e) => setPromotionForm((s) => ({ ...s, totalUses: e.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ราคา" value={promotionForm.price} onChange={(e) => setPromotionForm((s) => ({ ...s, price: e.target.value }))} />
          </div>
          <textarea className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700" rows={3} placeholder="หมายเหตุ" value={promotionForm.note} onChange={(e) => setPromotionForm((s) => ({ ...s, note: e.target.value }))} />
          {editingPromotionId != null ? (
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={promotionForm.isActive}
                onChange={(e) => setPromotionForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              เปิดใช้งานโปรโมชั่น
            </label>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={saleOpen}
        onClose={closeSaleModal}
        title="ขายโปรโมชั่น"
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={closeSaleModal}
            submitLabel="บันทึกการขาย"
            submitDisabled={
              !saleForm.customerName.trim() ||
              !saleForm.customerPhone.trim() ||
              (saleForm.paymentMethod === "TRANSFER" && !saleForm.paymentSlipDataUrl) ||
              (saleForm.taxInvoiceEnabled &&
                ((saleForm.billingName.trim() || saleForm.customerName.trim()).length < 2 ||
                  !isValidThaiId13(saleForm.taxId) ||
                  saleForm.taxAddress.trim().length < 8))
            }
            onSubmit={() => void onSellPromotion()}
          />
        }
      >
        <div className="grid gap-4">
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
            value={saleForm.promotionId}
            onChange={(e) => setSaleForm((s) => ({ ...s, promotionId: e.target.value }))}
          >
            {promotions.filter((item) => item.isActive).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {formatMoney(item.price)}
              </option>
            ))}
          </select>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อลูกค้า" value={saleForm.customerName} onChange={(e) => setSaleForm((s) => ({ ...s, customerName: e.target.value }))} />
          <FootballTurfMemberPhoneSearchField
            phone={saleForm.customerPhone}
            onPhoneChange={(value) => {
              setSaleForm((s) => ({ ...s, customerPhone: value }));
              setSaleCustomerCandidates([]);
              setSaleCustomerHint(null);
            }}
            onSearch={searchSaleCustomer}
            candidates={saleCustomerCandidates}
            onSelect={(cust) => {
              applyCustomerTaxToSaleForm(cust.phone, cust.name);
              setSaleForm((s) => ({
                ...s,
                customerPhone: cust.phone,
                customerName: s.customerName.trim() || cust.name,
                teamName: s.teamName.trim() || cust.teamName,
              }));
            }}
            hint={saleCustomerHint}
          />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อทีม" value={saleForm.teamName} onChange={(e) => setSaleForm((s) => ({ ...s, teamName: e.target.value }))} />

          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">การชำระเงิน</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSaleForm((s) => ({ ...s, paymentMethod: "ONSITE", paymentSlipDataUrl: "" }))}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-black transition",
                  saleForm.paymentMethod === "ONSITE"
                    ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                    : "bg-white text-slate-500 ring-1 ring-slate-200",
                )}
              >
                เงินสด / หน้าสนาม
              </button>
              <button
                type="button"
                onClick={() => setSaleForm((s) => ({ ...s, paymentMethod: "TRANSFER" }))}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-black transition",
                  saleForm.paymentMethod === "TRANSFER"
                    ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                    : "bg-white text-slate-500 ring-1 ring-slate-200",
                )}
              >
                โอนเงิน / พร้อมเพย์
              </button>
            </div>

            {selectedSalePromotion ? (
              <p className="mt-3 text-sm font-black text-violet-700">ยอดที่ต้องชำระ {formatMoney(selectedSalePromotion.price)}</p>
            ) : null}

            {saleForm.paymentMethod === "TRANSFER" ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-black text-slate-900">QR พร้อมเพย์</p>
                  </div>
                  <div className="mt-3 flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    {salePromptPayQr.loading ? (
                      <p className="py-16 text-xs font-bold text-slate-400">กำลังสร้าง QR...</p>
                    ) : salePromptPayQr.dataUrl ? (
                      <Image src={salePromptPayQr.dataUrl} alt="QR พร้อมเพย์" width={220} height={220} className="h-[220px] w-[220px] rounded-2xl bg-white p-2" unoptimized />
                    ) : (
                      <p className="py-10 text-center text-xs font-bold text-rose-600">
                        {salePromptPayQr.configured === false
                          ? "ยังไม่ได้ตั้งเบอร์พร้อมเพย์ในแท็บตั้งค่า"
                          : "สร้าง QR ไม่สำเร็จ"}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 space-y-2 text-xs font-medium text-slate-600">
                    <p>พร้อมเพย์: <span className="font-black text-slate-900">{settings.promptpayNumber || "-"}</span></p>
                    <p>บัญชี: <span className="font-black text-slate-900">{settings.accountNumber || "-"}</span></p>
                    <p>{settings.bankName || settings.accountName ? `${settings.bankName} · ${settings.accountName}` : "-"}</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-black text-slate-900">แนบสลิป</p>
                  </div>
                  <input
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                    placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                    value={saleForm.paymentReference}
                    onChange={(e) => setSaleForm((s) => ({ ...s, paymentReference: e.target.value }))}
                  />
                  <div className="mt-3 space-y-3">
                    <AppGalleryCameraFileInputs
                      galleryInputRef={saleSlipGalleryRef}
                      cameraInputRef={saleSlipCameraInputRef}
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        void onSaleSlipSelected(f);
                      }}
                    />
                    <AppImagePickCameraButtons
                      onPickGallery={() => saleSlipGalleryRef.current?.click()}
                      onPickCamera={() =>
                        openSaleSlipCamera((file) => {
                          void onSaleSlipSelected(file);
                        })
                      }
                      busy={saleSlipBusy}
                      labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                    />
                  </div>
                  {saleForm.paymentSlipDataUrl ? (
                    <div className="mt-3">
                      <AppImageThumb
                        src={saleForm.paymentSlipDataUrl}
                        alt="สลิปขายโปร"
                        onOpen={() => saleSlipLightbox.open(saleForm.paymentSlipDataUrl)}
                        className="h-24 w-24"
                      />
                      <p className="mt-2 text-xs font-bold text-emerald-700">แนบสลิปแล้ว — บันทึกแล้วรอตรวจชำระ</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-bold text-amber-700">ต้องแนบหรือถ่ายสลิปก่อนบันทึกเมื่อเลือกโอนเงิน</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs font-medium text-slate-500">บันทึกเป็นชำระแล้วทันที (เงินสด / หน้าสนาม)</p>
            )}
          </div>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition",
              footballTurfInteractiveButtonClass,
              saleForm.taxInvoiceEnabled
                ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b] ring-1 ring-[#5b61ff]/20"
                : "border-white/60 bg-white/55 text-slate-700 hover:bg-white/80",
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#5b61ff]"
              checked={saleForm.taxInvoiceEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                setSaleForm((s) => ({
                  ...s,
                  taxInvoiceEnabled: enabled,
                  billingName: enabled && !s.billingName.trim() ? s.customerName.trim() : s.billingName,
                }));
                if (enabled && saleForm.customerPhone.trim()) {
                  applyCustomerTaxToSaleForm(saleForm.customerPhone, saleForm.customerName);
                }
              }}
            />
            <span>
              <span className="block">ต้องการใบกำกับภาษี</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
                ติ๊กแล้วกรอกชื่อ · เลขผู้เสียภาษี · ที่อยู่ — พิมพ์หลังชำระครบ
              </span>
            </span>
          </label>
          {saleForm.taxInvoiceEnabled ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
              <p className="text-xs font-bold text-[#4d47b6]">ข้อมูลใบกำกับภาษี</p>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ชื่อ / ชื่อบริษัทในใบกำกับ
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleForm.billingName}
                  onChange={(e) => setSaleForm((s) => ({ ...s, billingName: e.target.value }))}
                  placeholder="ชื่อตามบัตรประชาชน หรือชื่อนิติบุคคล"
                  aria-label="ชื่อในใบกำกับภาษี"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                เลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleForm.taxId}
                  onChange={(e) =>
                    setSaleForm((s) => ({
                      ...s,
                      taxId: e.target.value.replace(/\D/g, "").slice(0, 13),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="1234567890123"
                  aria-label="เลขบัตรประชาชนหรือเลขผู้เสียภาษี"
                />
                {saleForm.taxId.trim() && !isValidThaiId13(saleForm.taxId) ? (
                  <span className="font-semibold text-rose-600">เลข 13 หลักไม่ถูกต้อง</span>
                ) : null}
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ที่อยู่
                <textarea
                  className="w-full min-h-[88px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleForm.taxAddress}
                  onChange={(e) => setSaleForm((s) => ({ ...s, taxAddress: e.target.value }))}
                  placeholder="บ้านเลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์"
                  aria-label="ที่อยู่ลูกค้าในใบกำกับ"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                สาขา (ถ้ามี)
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleForm.taxBranch}
                  onChange={(e) => setSaleForm((s) => ({ ...s, taxBranch: e.target.value }))}
                  placeholder="เช่น สำนักงานใหญ่ / สาขา 00000"
                  aria-label="สาขาลูกค้า"
                />
              </label>
            </div>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={saleEditOpen}
        onClose={closePromotionSaleEditModal}
        title="แก้ไขรายรับโปรโมชัน"
        description="ข้อมูลลูกค้า · สลิป · ใบกำกับภาษี"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={closePromotionSaleEditModal}
            submitLabel="บันทึก"
            submitDisabled={
              saleEditSlipBusy ||
              (saleEditForm.taxInvoiceEnabled &&
                ((saleEditForm.billingName.trim() || saleEditForm.customerName.trim()).length < 2 ||
                  !isValidThaiId13(saleEditForm.taxId) ||
                  saleEditForm.taxAddress.trim().length < 8))
            }
            onSubmit={() => void onSavePromotionSale()}
          />
        }
      >
        <div className="grid gap-4">
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อลูกค้า" value={saleEditForm.customerName} onChange={(e) => setSaleEditForm((s) => ({ ...s, customerName: e.target.value }))} />
          <FootballTurfMemberPhoneSearchField
            phone={saleEditForm.customerPhone}
            onPhoneChange={(value) => {
              setSaleEditForm((s) => ({ ...s, customerPhone: value }));
              setSaleEditCustomerCandidates([]);
              setSaleEditCustomerHint(null);
            }}
            onSearch={searchSaleEditCustomer}
            candidates={saleEditCustomerCandidates}
            onSelect={applyCustomerToSaleEdit}
            hint={saleEditCustomerHint}
          />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อทีม" value={saleEditForm.teamName} onChange={(e) => setSaleEditForm((s) => ({ ...s, teamName: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="สิทธิ์คงเหลือ" value={saleEditForm.remainingUses} onChange={(e) => setSaleEditForm((s) => ({ ...s, remainingUses: e.target.value.replace(/\D/g, "") }))} />
          <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={saleEditForm.status} onChange={(e) => setSaleEditForm((s) => ({ ...s, status: e.target.value as FootballTurfPromotionSale["status"] }))}>
            <option value="ACTIVE">ใช้งานได้</option>
            <option value="USED_UP">ใช้ครบแล้ว</option>
            <option value="DISABLED">ปิดใช้งาน</option>
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
              value={saleEditForm.paymentMethod}
              onChange={(e) => {
                const method = e.target.value as FootballTurfPromotionSalePaymentMethod;
                setSaleEditForm((s) => ({
                  ...s,
                  paymentMethod: method,
                  paymentSlipDataUrl: method === "TRANSFER" ? s.paymentSlipDataUrl : "",
                }));
              }}
            >
              <option value="ONSITE">เงินสด / หน้าสนาม</option>
              <option value="TRANSFER">โอนเงิน</option>
              <option value="CASH">เงินสด</option>
            </select>
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={saleEditForm.paymentStatus} onChange={(e) => setSaleEditForm((s) => ({ ...s, paymentStatus: e.target.value as FootballTurfBookingPaymentStatus }))}>
              <option value="UNPAID">ยังไม่ชำระ</option>
              <option value="PENDING_REVIEW">รอตรวจสลิป</option>
              <option value="PAID">ชำระแล้ว</option>
            </select>
          </div>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="เลขอ้างอิงการโอน" value={saleEditForm.paymentReference} onChange={(e) => setSaleEditForm((s) => ({ ...s, paymentReference: e.target.value }))} />

          <div className="space-y-3 rounded-[1.25rem] border border-white bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-900">สลิปชำระ (ไม่บังคับ)</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={saleEditSlipGalleryRef}
              cameraInputRef={saleEditSlipCameraInputRef}
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = "";
                if (!f) return;
                void onSaleEditSlipSelected(f);
              }}
            />
            <AppImagePickCameraButtons
              busy={saleEditSlipBusy}
              onPickGallery={() => saleEditSlipGalleryRef.current?.click()}
              onPickCamera={() =>
                openSaleEditSlipCamera((file) => {
                  void onSaleEditSlipSelected(file);
                })
              }
              labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
            />
            {saleEditForm.paymentSlipDataUrl ? (
              <div className="flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={saleEditForm.paymentSlipDataUrl}
                  alt="สลิปขายโปร"
                  onOpen={() =>
                    saleEditForm.paymentSlipDataUrl && saleSlipLightbox.open(saleEditForm.paymentSlipDataUrl)
                  }
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold text-rose-600")}
                  onClick={() => setSaleEditForm((s) => ({ ...s, paymentSlipDataUrl: "" }))}
                >
                  ลบสลิป
                </button>
              </div>
            ) : (
              <p className="text-xs font-medium text-[#66638c]">ยังไม่มีสลิป — อัปโหลดหรือถ่ายใหม่ได้</p>
            )}
          </div>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition",
              footballTurfInteractiveButtonClass,
              saleEditForm.taxInvoiceEnabled
                ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b] ring-1 ring-[#5b61ff]/20"
                : "border-white/60 bg-white/55 text-slate-700 hover:bg-white/80",
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#5b61ff]"
              checked={saleEditForm.taxInvoiceEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                if (enabled && saleEditForm.customerPhone.trim()) {
                  const matches = findFootballTurfCustomersByPhone(customers, saleEditForm.customerPhone);
                  const cust =
                    matches.length === 1
                      ? matches[0]
                      : matches.find(
                          (c) =>
                            normalizeFtPhoneDigits(c.phone) ===
                            normalizeFtPhoneDigits(saleEditForm.customerPhone),
                        );
                  if (cust && customerHasTaxProfile(cust)) {
                    setSaleEditForm((s) => ({ ...s, ...taxFieldsFromCustomer(cust) }));
                    return;
                  }
                }
                setSaleEditForm((s) => ({
                  ...s,
                  taxInvoiceEnabled: enabled,
                  billingName:
                    enabled && !s.billingName.trim() ? s.customerName.trim() : s.billingName,
                }));
              }}
            />
            <span>
              <span className="block">ต้องการใบกำกับภาษี</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
                ติ๊กแล้วกรอกชื่อ · เลขผู้เสียภาษี · ที่อยู่ — พิมพ์จากปุ่มพิมพ์ในประวัติการเงิน
              </span>
            </span>
          </label>
          {saleEditForm.taxInvoiceEnabled ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
              <p className="text-xs font-bold text-[#4d47b6]">ข้อมูลใบกำกับภาษี</p>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ชื่อ / ชื่อบริษัทในใบกำกับ
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleEditForm.billingName}
                  onChange={(e) => setSaleEditForm((s) => ({ ...s, billingName: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                เลขประจำตัวผู้เสียภาษี (13 หลัก)
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleEditForm.taxId}
                  onChange={(e) =>
                    setSaleEditForm((s) => ({
                      ...s,
                      taxId: e.target.value.replace(/\D/g, "").slice(0, 13),
                    }))
                  }
                  inputMode="numeric"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ที่อยู่ลูกค้าในใบกำกับ
                <textarea
                  className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                  value={saleEditForm.taxAddress}
                  onChange={(e) => setSaleEditForm((s) => ({ ...s, taxAddress: e.target.value }))}
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                สาขา (ถ้ามี)
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                  value={saleEditForm.taxBranch}
                  onChange={(e) => setSaleEditForm((s) => ({ ...s, taxBranch: e.target.value }))}
                />
              </label>
            </div>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={customerOpen}
        onClose={closeCustomerModal}
        title={editingCustomerId != null ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}
        footer={
          <FormModalFooterActions
            onCancel={closeCustomerModal}
            submitLabel="บันทึกลูกค้า"
            submitDisabled={
              !customerForm.name.trim() ||
              !customerForm.phone.trim() ||
              (customerForm.taxInvoiceEnabled &&
                ((customerForm.billingName.trim() || customerForm.name.trim()).length < 2 ||
                  !isValidThaiId13(customerForm.taxId) ||
                  customerForm.taxAddress.trim().length < 8))
            }
            onSubmit={() => void onSaveCustomer()}
          />
        }
      >
        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">รูปโปรไฟล์</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">อัปโหลดจากแกลเลอรี หรือถ่ายด้วยกล้อง</p>
            <div className="mt-3 space-y-3">
              <AppGalleryCameraFileInputs
                galleryInputRef={customerPhotoGalleryRef}
                cameraInputRef={customerPhotoCameraInputRef}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!f) return;
                  void onCustomerPhotoSelected(f);
                }}
              />
              <AppImagePickCameraButtons
                onPickGallery={() => customerPhotoGalleryRef.current?.click()}
                onPickCamera={() =>
                  openCustomerPhotoCamera((file) => {
                    void onCustomerPhotoSelected(file);
                  })
                }
                busy={customerPhotoBusy}
                labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป" }}
              />
              {customerForm.photoUrl ? (
                <div className="flex items-start gap-3">
                  <AppImageThumb
                    src={customerForm.photoUrl}
                    alt="รูปลูกค้า"
                    onOpen={() => customerPhotoLightbox.open(customerForm.photoUrl)}
                    className="h-24 w-24"
                  />
                  <button
                    type="button"
                    className={cn(
                      appTemplateOutlineButtonClass,
                      footballTurfInteractiveButtonClass,
                      "min-h-[40px] rounded-xl px-3 text-xs font-black text-rose-600",
                    )}
                    onClick={() => setCustomerForm((s) => ({ ...s, photoUrl: "" }))}
                  >
                    ลบรูป
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <input className={footballTurfFieldClass} placeholder="ชื่อลูกค้า" value={customerForm.name} onChange={(e) => setCustomerForm((s) => ({ ...s, name: e.target.value }))} />
          <input className={footballTurfFieldClass} placeholder="เบอร์โทร" value={customerForm.phone} onChange={(e) => setCustomerForm((s) => ({ ...s, phone: e.target.value }))} />
          <input className={footballTurfFieldClass} placeholder="ชื่อทีม" value={customerForm.teamName} onChange={(e) => setCustomerForm((s) => ({ ...s, teamName: e.target.value }))} />
          <textarea className={cn(footballTurfFieldClass, "min-h-[88px] font-medium")} rows={3} placeholder="หมายเหตุ" value={customerForm.note} onChange={(e) => setCustomerForm((s) => ({ ...s, note: e.target.value }))} />
          <label
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition",
              footballTurfInteractiveButtonClass,
              customerForm.taxInvoiceEnabled
                ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b] ring-1 ring-[#5b61ff]/20"
                : "border-white/60 bg-white/55 text-slate-700 hover:bg-white/80",
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#5b61ff]"
              checked={customerForm.taxInvoiceEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                setCustomerForm((s) => ({
                  ...s,
                  taxInvoiceEnabled: enabled,
                  billingName: enabled && !s.billingName.trim() ? s.name.trim() : s.billingName,
                }));
              }}
            />
            <span>
              <span className="block">ต้องการใบกำกับภาษี</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
                ติ๊กแล้วกรอกชื่อ · เลขผู้เสียภาษี · ที่อยู่ — ใช้ตอนพิมพ์อัตโนมัติ
              </span>
            </span>
          </label>
          {customerForm.taxInvoiceEnabled ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
              <p className="text-xs font-bold text-[#4d47b6]">ข้อมูลใบกำกับภาษี</p>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ชื่อ / ชื่อบริษัทในใบกำกับ
                <input
                  className={footballTurfFieldClass}
                  value={customerForm.billingName}
                  onChange={(e) => setCustomerForm((s) => ({ ...s, billingName: e.target.value }))}
                  placeholder="ชื่อตามบัตรประชาชน หรือชื่อนิติบุคคล"
                  aria-label="ชื่อในใบกำกับภาษี"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                เลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
                <input
                  className={footballTurfFieldClass}
                  value={customerForm.taxId}
                  onChange={(e) =>
                    setCustomerForm((s) => ({
                      ...s,
                      taxId: e.target.value.replace(/\D/g, "").slice(0, 13),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="1234567890123"
                  aria-label="เลขบัตรประชาชนหรือเลขผู้เสียภาษี"
                />
                {customerForm.taxId.trim() && !isValidThaiId13(customerForm.taxId) ? (
                  <span className="font-semibold text-rose-600">เลข 13 หลักไม่ถูกต้อง</span>
                ) : null}
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ที่อยู่
                <textarea
                  className={cn(footballTurfFieldClass, "min-h-[88px]")}
                  value={customerForm.taxAddress}
                  onChange={(e) => setCustomerForm((s) => ({ ...s, taxAddress: e.target.value }))}
                  placeholder="บ้านเลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์"
                  aria-label="ที่อยู่ลูกค้าในใบกำกับ"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                สาขา (ถ้ามี)
                <input
                  className={footballTurfFieldClass}
                  value={customerForm.taxBranch}
                  onChange={(e) => setCustomerForm((s) => ({ ...s, taxBranch: e.target.value }))}
                  placeholder="เช่น สำนักงานใหญ่ / สาขา 00000"
                  aria-label="สาขาลูกค้า"
                />
              </label>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={customerForm.isActive} onChange={(e) => setCustomerForm((s) => ({ ...s, isActive: e.target.checked }))} />
            เปิดใช้งานลูกค้า
          </label>
        </div>
      </FormModal>

      <FormModal
        open={costOpen}
        onClose={() => {
          setCostOpen(false);
          resetCostForm();
        }}
        title={costEditingId != null ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setCostOpen(false);
              resetCostForm();
            }}
            submitLabel="บันทึกรายจ่าย"
            onSubmit={() => void onSaveCost()}
          />
        }
      >
        <div className="grid gap-4">
          <label className={footballTurfLabelClass}>
            หมวดหมู่
            <select
              className={footballTurfFieldClass}
              value={costForm.categoryId}
              onChange={(e) => setCostForm((s) => ({ ...s, categoryId: e.target.value }))}
            >
              {costCategories.length === 0 ? (
                <option value="1">ทั่วไป</option>
              ) : (
                costCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className={footballTurfLabelClass}>
            รายละเอียดรายการ
            <input
              className={footballTurfFieldClass}
              placeholder="เช่น ค่าน้ำ ค่าดูแลสนาม"
              value={costForm.itemLabel}
              onChange={(e) => setCostForm((s) => ({ ...s, itemLabel: e.target.value }))}
            />
          </label>
          <label className={footballTurfLabelClass}>
            จำนวนเงิน (บาท)
            <input
              className={footballTurfFieldClass}
              inputMode="numeric"
              placeholder="0"
              value={costForm.amount}
              onChange={(e) => setCostForm((s) => ({ ...s, amount: e.target.value }))}
            />
          </label>
          <label className={footballTurfLabelClass}>
            หมายเหตุ (ไม่บังคับ)
            <textarea
              className={cn(footballTurfFieldClass, "min-h-[88px]")}
              rows={3}
              placeholder="หมายเหตุ"
              value={costForm.note}
              onChange={(e) => setCostForm((s) => ({ ...s, note: e.target.value }))}
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#4d47b6]">รูปสลิป (ไม่บังคับ)</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={costGalleryRef}
              cameraInputRef={costCamera.cameraInputRef}
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = "";
                if (!f) return;
                void uploadCostSlip(f);
              }}
            />
            <AppImagePickCameraButtons
              busy={costSlipBusy}
              onPickGallery={() => costGalleryRef.current?.click()}
              onPickCamera={() => costCamera.openCamera((file) => void uploadCostSlip(file))}
            />
            {costForm.paymentSlipUrl ? (
              <div className="flex items-center gap-3">
                <AppImageThumb
                  src={costForm.paymentSlipUrl}
                  alt="สลิปรายจ่าย"
                  onOpen={() => saleSlipLightbox.open(costForm.paymentSlipUrl)}
                  className="h-14 w-14"
                />
                <button
                  type="button"
                  className={cn(appTemplateOutlineButtonClass, "min-h-[40px] px-3 text-xs font-black text-rose-600")}
                  onClick={() => setCostForm((s) => ({ ...s, paymentSlipUrl: "" }))}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={costCatModalOpen}
        onClose={() => setCostCatModalOpen(false)}
        title="หมวดหมู่รายจ่าย"
        footer={
          <button
            type="button"
            onClick={() => setCostCatModalOpen(false)}
            className={cn(appTemplateOutlineButtonClass, "min-h-[44px] w-full sm:w-auto sm:min-w-[7rem]")}
          >
            ปิด
          </button>
        }
      >
        <div className="space-y-3">
          <button
            type="button"
            className="app-btn-primary min-h-[40px] w-full rounded-xl px-4 text-sm font-black"
            onClick={() => {
              setCostCatEdit(null);
              setCostCatName("");
              setCostCatFormOpen(true);
            }}
          >
            + เพิ่มหมวดหมู่
          </button>
          {costCategories.length === 0 ? (
            <AppEmptyState tone="slate">ยังไม่มีหมวดหมู่</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {costCategories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5"
                >
                  <p className="min-w-0 truncate text-sm font-black text-[#1e1b4b]">{cat.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไขหมวด ${cat.name}`}
                      title="แก้ไข"
                      onClick={() => {
                        setCostCatEdit(cat);
                        setCostCatName(cat.name);
                        setCostCatFormOpen(true);
                      }}
                    >
                      <IconRowEdit className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบหมวด ${cat.name}`}
                      title="ลบ"
                      onClick={() => void onDeleteCostCategory(cat)}
                    >
                      <IconRowRemove className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormModal>

      <FormModal
        open={costCatFormOpen}
        onClose={() => {
          setCostCatFormOpen(false);
          setCostCatEdit(null);
          setCostCatName("");
        }}
        title={costCatEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setCostCatFormOpen(false);
              setCostCatEdit(null);
              setCostCatName("");
            }}
            submitLabel="บันทึก"
            onSubmit={() => void onSaveCostCategory()}
          />
        }
      >
        <label className={footballTurfLabelClass}>
          ชื่อหมวดหมู่
          <input
            className={footballTurfFieldClass}
            value={costCatName}
            onChange={(e) => setCostCatName(e.target.value)}
            placeholder="เช่น ค่าน้ำค่าไฟ"
          />
        </label>
      </FormModal>

      <FormModal
        open={incomeOpen}
        onClose={() => {
          setIncomeOpen(false);
          resetIncomeForm();
        }}
        title={incomeEditingId != null ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setIncomeOpen(false);
              resetIncomeForm();
            }}
            submitLabel="บันทึกรายรับ"
            onSubmit={() => void onSaveIncome()}
          />
        }
      >
        <div className="grid gap-4">
          <label className={footballTurfLabelClass}>
            หมวดหมู่
            <select
              className={footballTurfFieldClass}
              value={incomeForm.categoryId}
              onChange={(e) => setIncomeForm((s) => ({ ...s, categoryId: e.target.value }))}
            >
              {customIncomeCategories.length === 0 ? (
                <option value="">สร้างหมวดก่อน</option>
              ) : (
                customIncomeCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <p className="text-[11px] font-semibold text-[#8b87b8]">
            ค่าสนาม / โปรโมชัน มาจากการจองและขายโปรอัตโนมัติ — เพิ่มรายรับมือได้เฉพาะหมวดอื่น เช่น เช่าพื้นที่
          </p>
          <label className={footballTurfLabelClass}>
            รายละเอียดรายการ
            <input
              className={footballTurfFieldClass}
              placeholder="เช่น ค่าเช่าบูธขายของ"
              value={incomeForm.itemLabel}
              onChange={(e) => setIncomeForm((s) => ({ ...s, itemLabel: e.target.value }))}
            />
          </label>
          <label className={footballTurfLabelClass}>
            จำนวนเงิน (บาท)
            <input
              className={footballTurfFieldClass}
              inputMode="numeric"
              placeholder="0"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm((s) => ({ ...s, amount: e.target.value }))}
            />
          </label>
          <label className={footballTurfLabelClass}>
            หมายเหตุ (ไม่บังคับ)
            <textarea
              className={cn(footballTurfFieldClass, "min-h-[88px]")}
              rows={3}
              placeholder="หมายเหตุ"
              value={incomeForm.note}
              onChange={(e) => setIncomeForm((s) => ({ ...s, note: e.target.value }))}
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#4d47b6]">รูปสลิป (ไม่บังคับ)</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={incomeGalleryRef}
              cameraInputRef={incomeCamera.cameraInputRef}
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = "";
                if (!f) return;
                void uploadIncomeSlip(f);
              }}
            />
            <AppImagePickCameraButtons
              busy={incomeSlipBusy}
              onPickGallery={() => incomeGalleryRef.current?.click()}
              onPickCamera={() => incomeCamera.openCamera((file) => void uploadIncomeSlip(file))}
            />
            {incomeForm.paymentSlipUrl ? (
              <div className="flex items-center gap-3">
                <AppImageThumb
                  src={incomeForm.paymentSlipUrl}
                  alt="สลิปรายรับ"
                  onOpen={() => saleSlipLightbox.open(incomeForm.paymentSlipUrl)}
                  className="h-14 w-14"
                />
                <button
                  type="button"
                  className={cn(appTemplateOutlineButtonClass, "min-h-[40px] px-3 text-xs font-black text-rose-600")}
                  onClick={() => setIncomeForm((s) => ({ ...s, paymentSlipUrl: "" }))}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={incomeCatModalOpen}
        onClose={() => setIncomeCatModalOpen(false)}
        title="หมวดหมู่รายรับ"
        footer={
          <button
            type="button"
            onClick={() => setIncomeCatModalOpen(false)}
            className={cn(appTemplateOutlineButtonClass, "min-h-[44px] w-full sm:w-auto sm:min-w-[7rem]")}
          >
            ปิด
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#66638c]">
            หมวดหลัก: ค่าสนาม · โปรโมชัน (จากจอง/ขายโปร) — เพิ่มหมวดอื่นได้ด้านล่าง
          </p>
          <ul className="space-y-2">
            {incomeCategories
              .filter((c) => c.isBuiltin || c.kind !== "CUSTOM")
              .map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-[#5b61ff]/25 bg-[#ecebff]/50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#1e1b4b]">{cat.name}</p>
                    <p className="text-[10px] font-semibold text-[#8b87b8]">หมวดหลัก · ลบไม่ได้</p>
                  </div>
                </li>
              ))}
          </ul>
          <button
            type="button"
            className="app-btn-primary min-h-[40px] w-full rounded-xl px-4 text-sm font-black"
            onClick={() => {
              setIncomeCatEdit(null);
              setIncomeCatName("");
              setIncomeCatFormOpen(true);
            }}
          >
            + เพิ่มหมวดหมู่
          </button>
          {customIncomeCategories.length === 0 ? (
            <AppEmptyState tone="slate">ยังไม่มีหมวดอื่น</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {customIncomeCategories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5"
                >
                  <p className="min-w-0 truncate text-sm font-black text-[#1e1b4b]">{cat.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไขหมวด ${cat.name}`}
                      title="แก้ไข"
                      onClick={() => {
                        setIncomeCatEdit(cat);
                        setIncomeCatName(cat.name);
                        setIncomeCatFormOpen(true);
                      }}
                    >
                      <IconRowEdit className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบหมวด ${cat.name}`}
                      title="ลบ"
                      onClick={() => void onDeleteIncomeCategory(cat)}
                    >
                      <IconRowRemove className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormModal>

      <FormModal
        open={incomeCatFormOpen}
        onClose={() => {
          setIncomeCatFormOpen(false);
          setIncomeCatEdit(null);
          setIncomeCatName("");
        }}
        title={incomeCatEdit ? "แก้ไขหมวดหมู่รายรับ" : "เพิ่มหมวดหมู่รายรับ"}
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setIncomeCatFormOpen(false);
              setIncomeCatEdit(null);
              setIncomeCatName("");
            }}
            submitLabel="บันทึก"
            onSubmit={() => void onSaveIncomeCategory()}
          />
        }
      >
        <label className={footballTurfLabelClass}>
          ชื่อหมวดหมู่
          <input
            className={footballTurfFieldClass}
            value={incomeCatName}
            onChange={(e) => setIncomeCatName(e.target.value)}
            placeholder="เช่น เช่าพื้นที่ขายของ"
          />
        </label>
      </FormModal>

      <FormModal
        open={overviewCheckInModal != null}
        onClose={closeOverviewCheckInModal}
        title={
          overviewCheckInModal?.mode === "pick"
            ? "เลือกคิวเพื่อเช็กอิน"
            : "รายละเอียดคิว · เช็กอิน / ชำระเพิ่ม"
        }
        description={
          overviewCheckInModal?.mode === "pick"
            ? (() => {
                const court = courts.find((c) => c.id === overviewCheckInModal.courtId);
                return court ? `${court.name} · คิวจองวันนี้` : undefined;
              })()
            : overviewCheckInModal?.mode === "booking"
              ? (() => {
                  const b = bookings.find((row) => row.id === overviewCheckInModal.bookingId);
                  if (!b) return undefined;
                  return `${b.courtName} · ${b.bookingDate} · ${b.startTime}–${b.endTime}`;
                })()
              : undefined
        }
        size="lg"
        mobileCentered
        footer={
          overviewCheckInModal?.mode === "pick" ? (
            <FormModalFooterActions
              onCancel={closeOverviewCheckInModal}
              cancelLabel="ปิด"
              submitLabel="เช็กอิน walk-in"
              onSubmit={() => {
                const court = courts.find((c) => c.id === overviewCheckInModal.courtId);
                closeOverviewCheckInModal();
                if (court) openCourtLiveBooking(court, "WALK_IN");
              }}
            />
          ) : overviewCheckInModal?.mode === "booking" ? (
            (() => {
              const booking = bookings.find((row) => row.id === overviewCheckInModal.bookingId);
              if (!booking) {
                return (
                  <FormModalFooterActions
                    onCancel={closeOverviewCheckInModal}
                    cancelLabel="ปิด"
                    submitLabel="ปิด"
                    onSubmit={closeOverviewCheckInModal}
                  />
                );
              }
              if (booking.status === "BOOKED") {
                return (
                  <FormModalFooterActions
                    onCancel={closeOverviewCheckInModal}
                    cancelLabel="ปิด"
                    submitLabel={
                      footballTurfBookingIsFullyPaid(booking) ? "เช็กอิน" : "ชำระ / เช็กอิน"
                    }
                    onSubmit={() => void overviewRequestCheckIn(booking)}
                  />
                );
              }
              return (
                <FormModalFooterActions
                  onCancel={closeOverviewCheckInModal}
                  cancelLabel="ปิด"
                  submitLabel="แก้ไขคิว"
                  onSubmit={() => {
                    closeOverviewCheckInModal();
                    openEditBookingModal(booking);
                  }}
                />
              );
            })()
          ) : undefined
        }
      >
        {overviewCheckInModal?.mode === "pick" ? (
          (() => {
            const rows = listCourtTodayBookedForCheckIn(overviewCheckInModal.courtId);
            if (rows.length === 0) {
              return <AppEmptyState tone="violet">ไม่มีคิวจองวันนี้สำหรับสนามนี้</AppEmptyState>;
            }
            return (
              <ul className="space-y-2">
                {rows.map((item) => {
                  const remain = footballTurfBookingRemainingBaht(item);
                  const label = item.teamName || item.customerName;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setOverviewCheckInModal({ mode: "booking", bookingId: item.id })
                        }
                        className="flex w-full items-start justify-between gap-3 rounded-[1.25rem] border border-white/60 bg-white/80 px-3.5 py-3 text-left shadow-sm ring-1 ring-[#5b61ff]/10 transition hover:bg-violet-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#1e1b4b]">{label}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">
                            {item.startTime}–{item.endTime}
                            {item.customerPhone ? ` · ${item.customerPhone}` : ""}
                          </p>
                          <span
                            className={cn(
                              "mt-1.5 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black ring-1",
                              bookingPaymentStatusClass(item.paymentStatus),
                            )}
                          >
                            {bookingPaymentStatusLabel(item.paymentStatus)}
                            {remain > 0 ? ` · ค้าง ${formatMoney(remain)}` : ""}
                          </span>
                        </div>
                        <span className="shrink-0 self-center text-[11px] font-black text-[#4d47b6]">
                          เลือก
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            );
          })()
        ) : overviewCheckInModal?.mode === "booking" ? (
          (() => {
            const booking =
              bookings.find((row) => row.id === overviewCheckInModal.bookingId) ?? null;
            if (!booking) {
              return <AppEmptyState tone="violet">ไม่พบรายการจอง</AppEmptyState>;
            }
            const paid = footballTurfBookingAmountPaidBaht(booking);
            const remain = footballTurfBookingRemainingBaht(booking);
            const sessionRows = listFootballTurfSessionBookings(
              booking,
              bookings.filter(
                (row) =>
                  row.courtId === booking.courtId &&
                  row.bookingDate === booking.bookingDate &&
                  row.status !== "CANCELLED",
              ),
            );
            const sessionLabel =
              sessionRows.length > 1
                ? `${sessionRows[0]!.startTime}–${sessionRows[sessionRows.length - 1]!.endTime} · ${sessionRows.length} รอบ`
                : `${booking.startTime}–${booking.endTime}`;
            const guest = booking.teamName || booking.customerName;
            return (
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b87b8]">
                    ผู้จอง
                  </p>
                  <p className="mt-1 text-lg font-black tracking-tight text-[#1e1b4b]">{guest}</p>
                  <p className="mt-1 text-xs font-semibold text-[#66638c]">
                    {booking.customerName && booking.teamName
                      ? `${booking.customerName} · ${booking.customerPhone}`
                      : booking.customerPhone || "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black ring-1",
                        bookingStatusClass(booking.status),
                      )}
                    >
                      {bookingStatusLabel(booking.status)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black ring-1",
                        bookingPaymentStatusClass(booking.paymentStatus),
                      )}
                    >
                      {bookingPaymentStatusLabel(booking.paymentStatus)}
                    </span>
                    <span className="inline-flex rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-black text-[#4d47b6] ring-1 ring-[#5b61ff]/20">
                      {booking.source === "WALK_IN"
                        ? "Walk-in"
                        : booking.source === "ONLINE"
                          ? "จองออนไลน์"
                          : "พนักงาน"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      รอบเวลา
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">{sessionLabel}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {booking.courtName} · {booking.bookingDate}
                    </p>
                    {booking.playerCount > 0 ? (
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        ผู้เล่น {booking.playerCount} คน
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700/80">
                      การชำระ
                    </p>
                    <p className="mt-1 text-sm font-black text-amber-950">
                      รวม {formatMoney(booking.finalPrice)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-amber-900/80">
                      ชำระแล้ว {formatMoney(paid)}
                      {remain > 0 ? ` · ค้าง ${formatMoney(remain)}` : ""}
                    </p>
                  </div>
                </div>

                {booking.note?.trim() ? (
                  <div className="rounded-[1.25rem] border border-slate-100 bg-white/80 px-3.5 py-2.5 text-[11px] font-semibold text-[#66638c]">
                    หมายเหตุ: {booking.note.trim()}
                  </div>
                ) : null}

                {booking.paymentSlipDataUrl ? (
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      สลิป
                    </p>
                    <AppImageThumb
                      src={booking.paymentSlipDataUrl}
                      alt="สลิปการจอง"
                      onOpen={() => saleSlipLightbox.open(booking.paymentSlipDataUrl!)}
                      className="h-20 w-20"
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {remain > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        overviewOpenBalancePay(booking, {
                          checkInAfter: booking.status === "BOOKED",
                        })
                      }
                      className={cn(
                        footballTurfChipActionButtonClass,
                        "border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900",
                      )}
                    >
                      จ่ายเพิ่ม {formatMoney(remain)}
                    </button>
                  ) : null}
                  {booking.paymentStatus === "PENDING_REVIEW" ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeOverviewCheckInModal();
                        void confirmBookingPayment(booking.id);
                      }}
                      className={cn(
                        footballTurfChipActionButtonClass,
                        "border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800",
                      )}
                    >
                      ยืนยันชำระ
                    </button>
                  ) : null}
                  {footballTurfBookingIsFullyPaid(booking) ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeOverviewCheckInModal();
                        setPrintBooking(booking);
                      }}
                      className={cn(
                        footballTurfChipActionButtonClass,
                        "gap-1 border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900",
                      )}
                    >
                      <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                      พิมพ์
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      closeOverviewCheckInModal();
                      openEditBookingModal(booking);
                    }}
                    className={cn(
                      footballTurfChipActionButtonClass,
                      "border border-[#5b61ff]/35 bg-white/80 px-3 py-2 text-xs font-black text-[#4d47b6]",
                    )}
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            );
          })()
        ) : null}
      </FormModal>

      <FormModal
        open={balancePayOpen}
        onClose={closeBalancePayModal}
        title={balancePayCheckInAfter ? "ชำระส่วนที่เหลือก่อนเช็กอิน" : "รับชำระส่วนที่เหลือ"}
        description={
          balancePayBookingId != null
            ? (() => {
                const b = bookings.find((row) => row.id === balancePayBookingId);
                if (!b) return undefined;
                return `${b.teamName || b.customerName} · ${b.courtName} · ${b.startTime}–${b.endTime}`;
              })()
            : undefined
        }
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={closeBalancePayModal}
            submitLabel={
              balancePayCheckInAfter && balancePayMethod === "ONSITE"
                ? "ชำระและเช็กอิน"
                : balancePayMethod === "TRANSFER"
                  ? "บันทึกสลิป"
                  : "รับชำระครบ"
            }
            submitDisabled={
              balancePayBusy ||
              (balancePayMethod === "TRANSFER" && !balancePaySlipDataUrl) ||
              (balancePayBookingId != null &&
                footballTurfBookingRemainingBaht(
                  bookings.find((row) => row.id === balancePayBookingId) ?? {
                    finalPrice: 0,
                    amountPaidBaht: 0,
                  },
                ) <= 0 &&
                !balancePayCheckInAfter)
            }
            onSubmit={() => void submitBalancePayment()}
          />
        }
      >
        {(() => {
          const booking =
            balancePayBookingId == null
              ? null
              : bookings.find((row) => row.id === balancePayBookingId) ?? null;
          if (!booking) {
            return <AppEmptyState tone="violet">ไม่พบรายการจอง</AppEmptyState>;
          }
          const remain = footballTurfBookingRemainingBaht(booking);
          const paid = footballTurfBookingAmountPaidBaht(booking);
          return (
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700/80">ยอดค้างชำระ</p>
                <p className="mt-1 text-2xl font-black text-amber-950">{formatMoney(remain)}</p>
                <p className="mt-1 text-xs font-semibold text-amber-900/80">
                  ยอดรวม {formatMoney(booking.finalPrice)} · ชำระแล้ว {formatMoney(paid)}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">วิธีชำระส่วนที่เหลือ</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBalancePayMethod("ONSITE");
                      setBalancePaySlipDataUrl("");
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-black transition",
                      balancePayMethod === "ONSITE"
                        ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                        : "bg-white text-slate-500 ring-1 ring-slate-200",
                    )}
                  >
                    เงินสด / หน้าสนาม
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalancePayMethod("TRANSFER")}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-black transition",
                      balancePayMethod === "TRANSFER"
                        ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                        : "bg-white text-slate-500 ring-1 ring-slate-200",
                    )}
                  >
                    โอนเงิน / พร้อมเพย์
                  </button>
                </div>

                {balancePayMethod === "TRANSFER" ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-[11px] font-semibold text-[#66638c]">
                      ต้องแนบหรือถ่ายสลิปเป็นหลักฐานการชำระส่วนที่เหลือ
                    </p>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                      placeholder="เลขอ้างอิง / หมายเหตุการโอน"
                      value={balancePayReference}
                      onChange={(e) => setBalancePayReference(e.target.value)}
                    />
                    <AppGalleryCameraFileInputs
                      galleryInputRef={balancePayGalleryRef}
                      cameraInputRef={balancePayCameraInputRef}
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        void onBalancePaySlipSelected(f);
                      }}
                    />
                    <AppImagePickCameraButtons
                      onPickGallery={() => balancePayGalleryRef.current?.click()}
                      onPickCamera={() =>
                        openBalancePayCamera((file) => {
                          void onBalancePaySlipSelected(file);
                        })
                      }
                      busy={balancePayBusy}
                      labels={{ gallery: "แนบสลิป", camera: "ถ่ายสลิป" }}
                    />
                    {balancePaySlipDataUrl ? (
                      <div>
                        <AppImageThumb
                          src={balancePaySlipDataUrl}
                          alt="สลิปค้างชำระ"
                          onOpen={() => saleSlipLightbox.open(balancePaySlipDataUrl)}
                          className="h-24 w-24"
                        />
                        <p className="mt-2 text-xs font-bold text-emerald-700">แนบสลิปแล้ว</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-amber-700">ยังไม่ได้แนบหรือถ่ายสลิป</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    {balancePayCheckInAfter
                      ? "รับเงินสดครบแล้ว ระบบจะเช็กอินทันที"
                      : "บันทึกเป็นชำระครบด้วยเงินสด / หน้าสนาม"}
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </FormModal>

      <FootballTurfBookingPrintModal
        open={printBooking != null || printPromotionSale != null}
        booking={printBooking}
        promotionSale={printPromotionSale}
        settings={settings}
        customers={customers}
        preferTaxInvoice={printPreferTaxInvoice}
        onClose={() => {
          setPrintBooking(null);
          setPrintPromotionSale(null);
          setPrintPreferTaxInvoice(false);
        }}
      />

      <FootballTurfCustomerStatsModal
        open={customerStatsPhone != null}
        phone={customerStatsPhone}
        onClose={() => setCustomerStatsPhone(null)}
      />

      {notice.popup}
      <AppImageLightbox src={saleSlipLightbox.src} onClose={saleSlipLightbox.close} alt="สลิป" />
      <AppImageLightbox src={courtImageLightbox.src} onClose={courtImageLightbox.close} alt="รูปสนาม" />
      <AppImageLightbox src={customerPhotoLightbox.src} onClose={customerPhotoLightbox.close} alt="รูปลูกค้า" />
      {bookingSlipCameraModal}
      {saleSlipCameraModal}
      {balancePayCameraModal}
      {courtCameraModal}
      {customerPhotoCameraModal}
      {costCamera.cameraModal}
      {incomeCamera.cameraModal}
      {saleEditSlipCameraModal}
    </div>
  );
}
