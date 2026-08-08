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
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TicketPercent,
  Upload,
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
  AppSlipPaperSizeSettingsField,
  AppSparkChartPanel,
  appTemplateOutlineButtonClass,
  prepareImageFileAsDataUrl,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
  type AppRevenueCostBucket,
} from "@/components/app-templates";
import { appDashboardBrandGradientBarClass, appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  footballTurfPublicBookUrl,
  footballTurfPublicCheckInUrl,
} from "@/lib/football-turf/public-url";
import {
  footballTurfCardAccentBarClass,
  footballTurfContentCardClass,
  footballTurfCourtStatusBadgeClass,
  footballTurfCourtTabPillClass,
  footballTurfCourtTabShellClass,
  footballTurfMetaChipClass,
} from "@/systems/football-turf/lib/ui-tokens";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  type FootballTurfBooking,
  type FootballTurfBookingPaymentStatus,
  type FootballTurfBookingSource,
  type FootballTurfCostCategory,
  type FootballTurfCourt,
  type FootballTurfCostEntry,
  type FootballTurfCustomer,
  type FootballTurfPromotion,
  type FootballTurfPromotionSale,
  type FootballTurfPromotionSalePaymentMethod,
  type FootballTurfVenueSettings,
  createFootballTurfRepository,
  footballTurfStorageScope,
  setFootballTurfStorageScope,
} from "@/systems/football-turf/football-turf-service";
import {
  FOOTBALL_TURF_TAB_ITEMS,
  footballTurfTabIcon,
  parseFootballTurfTab,
} from "@/systems/football-turf/football-turf-module-nav";

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
    <div className="mt-4 app-surface border border-[#e8e6fc]/80 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className={cn("flex flex-col gap-3", compact ? "sm:flex-row sm:items-center sm:justify-between" : "lg:flex-row lg:items-start lg:justify-between")}>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm", appDashboardBrandGradientBarClass)}>
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
                {description ? <p className="truncate text-xs font-medium text-slate-500">{description}</p> : null}
              </div>
            </div>
            {summary ? <p className="mt-2 text-xs font-medium text-slate-500">{summary}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[#0000BF]/30 bg-[#0000BF]/10 px-3 text-xs font-black text-[#2e2a58] shadow-sm transition hover:bg-[#0000BF]/12"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {mobileOpen ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง"}
              {mobileOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <span className={cn(
              "inline-flex h-9 items-center rounded-full border px-3 text-xs font-black shadow-sm",
              activeCount > 0
                ? "border-[#0000BF]/30 bg-[#0000BF]/10 text-[#2e2a58]"
                : "border-slate-200 bg-white/90 text-slate-500",
            )}>
              {activeCount > 0 ? `เปิดใช้ ${activeCount} ตัวกรอง` : "ค่าเริ่มต้น"}
            </span>
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                disabled={activeCount === 0}
                className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white/90 px-3 text-xs font-black text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {resetLabel}
              </button>
            ) : null}
          </div>
        </div>
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
};

function formatMoney(value: number): string {
  return `฿${value.toLocaleString("th-TH")}`;
}

function normalizeDateKey(value: string): string {
  return value ? value.slice(0, 10) : "";
}

function timeToMinutes(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}

function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  rows: { kind: "BOOKING" | "PROMOTION" | "COST"; amount: number; dateKey: string }[],
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
): boolean {
  if (item.status === "CANCELLED" || item.status === "COMPLETED") return false;
  if (item.bookingDate < opts.todayDateKey) return true;
  if (item.bookingDate > opts.todayDateKey) return false;
  if (item.status === "BOOKED" && timeToMinutes(item.startTime) <= opts.nowMinutes) return true;
  if (
    (item.status === "CHECKED_IN" || item.status === "PLAYING") &&
    timeToMinutes(item.endTime) <= opts.nowMinutes
  ) {
    return true;
  }
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

/** วันที่ท้องถิ่น YYYY-MM-DD (ไม่ใช้ UTC จาก toISOString) */
function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localNowMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

function bookingCoversMinutes(booking: Pick<FootballTurfBooking, "startTime" | "endTime">, minutes: number): boolean {
  const start = timeToMinutes(booking.startTime);
  const end = timeToMinutes(booking.endTime);
  if (end <= start) return minutes >= start || minutes < end;
  return minutes >= start && minutes < end;
}

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
        timeToMinutes(item.endTime) <= opts.nowMinutes,
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

/** คิวถัดไปหลังรอบปัจจุบัน (หรือรอบถัดไปถ้าสนามว่าง) — เหมือน「เช็คอินต่อ」ของโรงแรม */
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
          timeToMinutes(item.startTime) >= afterMinutes,
      )
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] ?? null
  );
}

function courtLiveAlertKind(
  current: FootballTurfBooking | null,
  nowMinutes: number,
): "NO_SHOW" | "OVERTIME" | null {
  if (!current) return null;
  const start = timeToMinutes(current.startTime);
  const end = timeToMinutes(current.endTime);
  if (
    (current.status === "PLAYING" || current.status === "CHECKED_IN") &&
    end <= nowMinutes
  ) {
    return "OVERTIME";
  }
  if (current.status === "BOOKED" && start <= nowMinutes && end > nowMinutes) {
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

function isSlotTimePassed(
  slot: { startTime: string; endTime: string },
  opts: { scheduleDate: string; todayDateKey: string; nowMinutes: number },
): boolean {
  if (opts.scheduleDate < opts.todayDateKey) return true;
  if (opts.scheduleDate > opts.todayDateKey) return false;
  return timeToMinutes(slot.endTime) <= opts.nowMinutes;
}

function isSlotTimeCurrent(
  slot: { startTime: string; endTime: string },
  opts: { scheduleDate: string; todayDateKey: string; nowMinutes: number },
): boolean {
  if (opts.scheduleDate !== opts.todayDateKey) return false;
  return bookingCoversMinutes(slot, opts.nowMinutes);
}

function bookingPaymentStatusClass(status?: FootballTurfBooking["paymentStatus"]): string {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "PENDING_REVIEW") return "bg-cyan-50 text-cyan-700 ring-cyan-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function bookingPaymentStatusLabel(status?: FootballTurfBooking["paymentStatus"]): string {
  if (status === "PAID") return "ชำระแล้ว";
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
}: {
  ownerUserId: string;
  trialSessionId: string;
  storageOnly?: boolean;
}) {
  const searchParams = useSearchParams();
  const activeTab = parseFootballTurfTab(searchParams.get("tab"));
  const repo = useMemo(
    () => createFootballTurfRepository({ mode: storageOnly ? "storage" : "api" }),
    [storageOnly],
  );
  const [courts, setCourts] = useState<FootballTurfCourt[]>([]);
  const [bookings, setBookings] = useState<FootballTurfBooking[]>([]);
  const [promotions, setPromotions] = useState<FootballTurfPromotion[]>([]);
  const [promotionSales, setPromotionSales] = useState<FootballTurfPromotionSale[]>([]);
  const [costEntries, setCostEntries] = useState<FootballTurfCostEntry[]>([]);
  const [costCategories, setCostCategories] = useState<FootballTurfCostCategory[]>([]);
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
  const [courtOpen, setCourtOpen] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<number | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => localDateKey());
  const [overviewCourtId, setOverviewCourtId] = useState("ALL");
  const [scheduleCourtId, setScheduleCourtId] = useState<string>("");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState("ALL");
  const [queueCourtId, setQueueCourtId] = useState("ALL");
  const [queueFilterOpen, setQueueFilterOpen] = useState(true);
  const [queueDatePreset, setQueueDatePreset] = useState<QueueDatePreset>("MONTH");
  const [queueDateFrom, setQueueDateFrom] = useState("");
  const [queueDateTo, setQueueDateTo] = useState("");
  const [queueNeedsCloseOnly, setQueueNeedsCloseOnly] = useState(false);
  const [financeSearch, setFinanceSearch] = useState("");
  const [financeType, setFinanceType] = useState<"ALL" | "BOOKING" | "PROMOTION" | "COST">("ALL");
  const [financeStartDate, setFinanceStartDate] = useState(() => localDateKey());
  const [financeEndDate, setFinanceEndDate] = useState(() => localDateKey());
  const [financeRange, setFinanceRange] = useState<"TODAY" | "MONTH" | "YEAR" | "CUSTOM">("TODAY");
  const [financeChartOpen, setFinanceChartOpen] = useState(false);
  const [offersSearch, setOffersSearch] = useState("");
  const [offersSaleStatus, setOffersSaleStatus] = useState<"ALL" | "ACTIVE" | "USED_UP">("ALL");
  const [qrView, setQrView] = useState<"ALL" | "CUSTOMER" | "STAFF">("ALL");
  const [bookingSource, setBookingSource] = useState<FootballTurfBookingSource>("WALK_IN");
  const [bookingForm, setBookingForm] = useState({
    courtId: "1",
    bookingDate: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "19:00",
    customerName: "",
    customerPhone: "",
    teamName: "",
    playerCount: "10",
    note: "",
    paymentStatus: "UNPAID" as FootballTurfBookingPaymentStatus,
  });
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
  });
  const [salePromptPayQr, setSalePromptPayQr] = useState<{ dataUrl: string | null; loading: boolean; configured: boolean }>({
    dataUrl: null,
    loading: false,
    configured: true,
  });
  const [saleSlipBusy, setSaleSlipBusy] = useState(false);
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
  });
  const [costForm, setCostForm] = useState({ categoryId: "1", itemLabel: "", amount: "", note: "" });
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    teamName: "",
    note: "",
    isActive: true,
  });
  const [settingsForm, setSettingsForm] = useState<FootballTurfVenueSettings>(EMPTY_SETTINGS);
  const [qrState, setQrState] = useState<{ title: string; url: string; dataUrl: string; loading: boolean }>({
    title: "",
    url: "",
    dataUrl: "",
    loading: false,
  });

  const refresh = useCallback(async () => {
    const [courtRows, bookingRows, promotionRows, saleRows, costRows, categoryRows, customerRows, settingsRow] =
      await Promise.all([
        repo.listCourts(),
        repo.listBookings(),
        repo.listPromotions(),
        repo.listPromotionSales(),
        repo.listCostEntries(),
        repo.listCostCategories(),
        repo.listCustomers(),
        repo.getSettings(),
      ]);
    setCourts(courtRows);
    setBookings(bookingRows);
    setPromotions(promotionRows);
    setPromotionSales(saleRows);
    setCostEntries(costRows);
    setCostCategories(categoryRows);
    setCustomers(customerRows);
    setSettings(settingsRow);
    setSettingsForm(settingsRow);
  }, [repo]);

  useEffect(() => {
    if (storageOnly) {
      setFootballTurfStorageScope(footballTurfStorageScope(ownerUserId, trialSessionId));
    }
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [ownerUserId, trialSessionId, refresh, storageOnly]);

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
  const publicCheckInUrl = footballTurfPublicCheckInUrl(origin, ownerUserId, publicLinkTrial);
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
  const selectedBookingSlot = useMemo(
    () =>
      editingBookingId != null
        ? { startTime: bookingForm.startTime, endTime: bookingForm.endTime, booking: null }
        : bookingTimeline.find(
            (slot) => !slot.booking && slot.startTime === bookingForm.startTime && slot.endTime === bookingForm.endTime,
          ) ?? null,
    [bookingTimeline, bookingForm.startTime, bookingForm.endTime, editingBookingId],
  );
  const canSubmitBooking = Boolean(
    bookingCourt &&
      (editingBookingId != null || selectedBookingSlot) &&
      bookingForm.customerName.trim() &&
      bookingForm.customerPhone.trim() &&
      bookingForm.startTime &&
      bookingForm.endTime,
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
        const overdue = footballBookingNeedsClose(item, { todayDateKey, nowMinutes });
        if (queueNeedsCloseOnly && !overdue) return false;
        return matchesKeyword && matchesStatus && matchesCourt && matchesDate;
      })
      .sort((a, b) => {
        const aOver = footballBookingNeedsClose(a, { todayDateKey, nowMinutes }) ? 1 : 0;
        const bOver = footballBookingNeedsClose(b, { todayDateKey, nowMinutes }) ? 1 : 0;
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
    return bookings.filter((item) => footballBookingNeedsClose(item, { todayDateKey, nowMinutes })).length;
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
            tone: "border-emerald-100 bg-emerald-50/70 text-emerald-900",
          })),
        ...promotionSales.map((item) => ({
          id: `promotion-${item.id}`,
          kind: "PROMOTION" as const,
          amount: item.price,
          dateKey: normalizeDateKey(item.createdAt),
          dateLabel: new Date(item.createdAt).toLocaleString("th-TH"),
          title: item.teamName || item.customerName,
          subtitle: `${item.promotionName} · ${item.customerPhone}`,
          tone: "border-sky-100 bg-sky-50/70 text-sky-900",
        })),
        ...costEntries.map((item) => ({
          id: `cost-${item.id}`,
          kind: "COST" as const,
          amount: item.amount,
          dateKey: normalizeDateKey(item.spentAt),
          dateLabel: new Date(item.spentAt).toLocaleString("th-TH"),
          title: item.itemLabel,
          subtitle: `${item.categoryName}${item.note ? ` · ${item.note}` : ""}`,
          tone: "border-rose-100 bg-rose-50/70 text-rose-900",
        })),
      ].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    [bookings, promotionSales, costEntries],
  );
  const financeFilteredRows = useMemo(() => {
    const keyword = financeSearch.trim().toLowerCase();
    return financeRows.filter((item) => {
      const matchesKeyword = !keyword || `${item.title} ${item.subtitle}`.toLowerCase().includes(keyword);
      const matchesType = financeType === "ALL" || item.kind === financeType;
      const matchesDate = dateKeyInRange(item.dateKey, financeRange, todayDateKey, financeStartDate, financeEndDate);
      return matchesKeyword && matchesType && matchesDate;
    });
  }, [financeEndDate, financeRange, financeRows, financeSearch, financeStartDate, financeType, todayDateKey]);
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
  const customersFiltered = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();
    return customers.filter((item) => {
      if (!keyword) return true;
      return `${item.name} ${item.phone} ${item.teamName} ${item.note}`.toLowerCase().includes(keyword);
    });
  }, [customerSearch, customers]);
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
    void fetch("/api/football-turf/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
  const financeTypeLabel =
    financeType === "BOOKING"
      ? "รายรับการจอง"
      : financeType === "PROMOTION"
        ? "รายรับโปรโมชั่น"
        : financeType === "COST"
          ? "รายจ่าย"
          : "";
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
  const financeActiveFilterCount =
    Number(Boolean(financeSearch.trim())) +
    Number(financeType !== "ALL") +
    Number(financeRange !== "TODAY");
  const financeFilterSummary = buildFilterSummary(
    [
      financeSearch.trim() && `ค้นหา "${financeSearch.trim()}"`,
      financeTypeLabel && `ประเภท ${financeTypeLabel}`,
      financeRangeLabel && `ช่วงเวลา ${financeRangeLabel}`,
    ],
    "แสดงข้อมูลการเงินของวันนี้",
  );
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
  const qrViewLabel =
    qrView === "CUSTOMER" ? "เฉพาะลิงก์ลูกค้า" : qrView === "STAFF" ? "เฉพาะคู่มือพนักงาน" : "";
  const qrActiveFilterCount = Number(qrView !== "ALL");
  const qrFilterSummary = buildFilterSummary(
    [qrViewLabel && `มุมมอง ${qrViewLabel}`],
    "แสดงลิงก์สำหรับลูกค้าและพนักงานทั้งหมด",
  );

  function resolveBookingSlot(nextCourtId: string, nextBookingDate: string, preferredStart?: string, preferredEnd?: string) {
    const court = courts.find((item) => item.id === Number(nextCourtId)) ?? courts[0] ?? null;
    if (!court) {
      return { startTime: "", endTime: "" };
    }
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
    const preferredSlot =
      timeline.find(
        (slot) => !slot.booking && slot.startTime === preferredStart && slot.endTime === preferredEnd,
      ) ?? null;
    const availableSlot = preferredSlot ?? timeline.find((slot) => !slot.booking) ?? null;
    return availableSlot
      ? { startTime: availableSlot.startTime, endTime: availableSlot.endTime }
      : { startTime: "", endTime: "" };
  }

  function closeBookingModal() {
    setBookingOpen(false);
    setEditingBookingId(null);
    setBookingForm((state) => ({
      ...state,
      customerName: "",
      customerPhone: "",
      teamName: "",
      note: "",
      paymentStatus: "UNPAID",
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
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      teamName: booking.teamName,
      playerCount: String(booking.playerCount),
      note: booking.note,
      paymentStatus: booking.paymentStatus ?? "UNPAID",
    });
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
    });
    setSaleEditOpen(true);
  }

  function closePromotionSaleEditModal() {
    setSaleEditOpen(false);
    setEditingPromotionSaleId(null);
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
    });
  }

  function closeSaleModal() {
    setSaleOpen(false);
    setSaleForm({
      promotionId: String(promotions[0]?.id ?? 1),
      customerName: "",
      customerPhone: "",
      teamName: "",
      paymentMethod: "ONSITE",
      paymentReference: "",
      paymentSlipDataUrl: "",
    });
    setSalePromptPayQr({ dataUrl: null, loading: false, configured: true });
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

  function openCustomerModal(customer?: FootballTurfCustomer) {
    if (customer) {
      setEditingCustomerId(customer.id);
      setCustomerForm({
        name: customer.name,
        phone: customer.phone,
        teamName: customer.teamName,
        note: customer.note,
        isActive: customer.isActive,
      });
    } else {
      setEditingCustomerId(null);
      setCustomerForm({ name: "", phone: "", teamName: "", note: "", isActive: true });
    }
    setCustomerOpen(true);
  }

  function closeCustomerModal() {
    setCustomerOpen(false);
    setEditingCustomerId(null);
    setCustomerForm({ name: "", phone: "", teamName: "", note: "", isActive: true });
  }

  function openBookingModal(source: FootballTurfBookingSource) {
    setEditingBookingId(null);
    const nextCourtId = bookingForm.courtId || String(courts[0]?.id ?? 1);
    const nextBookingDate = bookingForm.bookingDate || localDateKey();
    const nextSlot = resolveBookingSlot(
      nextCourtId,
      nextBookingDate,
      bookingForm.startTime,
      bookingForm.endTime,
    );
    setBookingSource(source);
    setBookingForm((state) => ({
      ...state,
      courtId: nextCourtId,
      bookingDate: nextBookingDate,
      startTime: nextSlot.startTime,
      endTime: nextSlot.endTime,
    }));
    setBookingOpen(true);
  }

  /** เปิดฟอร์มจอง/walk-in จากการ์ดสนาม (วันนี้ + สล็อตว่างถัดไปของสนามนั้น) */
  function openCourtLiveBooking(court: FootballTurfCourt, source: FootballTurfBookingSource) {
    const today = localDateKey(new Date(liveClockMs));
    const nextSlot = resolveBookingSlot(String(court.id), today);
    setEditingBookingId(null);
    setBookingSource(source);
    setBookingForm((state) => ({
      ...state,
      courtId: String(court.id),
      bookingDate: today,
      startTime: nextSlot.startTime,
      endTime: nextSlot.endTime,
      customerName: "",
      customerPhone: "",
      teamName: "",
      playerCount: "",
      note: "",
      paymentStatus: "UNPAID",
    }));
    setBookingOpen(true);
  }

  /** จองช่วงเวลาว่างจากตาราง */
  function openScheduleSlotBooking(court: FootballTurfCourt, startTime: string, endTime: string) {
    setEditingBookingId(null);
    setBookingSource("ONLINE");
    setBookingForm((state) => ({
      ...state,
      courtId: String(court.id),
      bookingDate: scheduleDate,
      startTime,
      endTime,
      customerName: "",
      customerPhone: "",
      teamName: "",
      playerCount: "",
      note: "",
      paymentStatus: "UNPAID",
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
      await repo.updateBooking(id, { status: "CANCELLED" });
      await refresh();
    });
  }

  function updateBookingCourt(nextCourtId: string) {
    const nextSlot = resolveBookingSlot(
      nextCourtId,
      bookingForm.bookingDate,
      bookingForm.startTime,
      bookingForm.endTime,
    );
    setBookingForm((state) => ({
      ...state,
      courtId: nextCourtId,
      startTime: nextSlot.startTime,
      endTime: nextSlot.endTime,
    }));
  }

  function updateBookingDate(nextBookingDate: string) {
    const nextSlot = resolveBookingSlot(
      bookingForm.courtId,
      nextBookingDate,
      bookingForm.startTime,
      bookingForm.endTime,
    );
    setBookingForm((state) => ({
      ...state,
      bookingDate: nextBookingDate,
      startTime: nextSlot.startTime,
      endTime: nextSlot.endTime,
    }));
  }

  async function onCreateBooking() {
    const court = courts.find((item) => item.id === Number(bookingForm.courtId)) ?? courts[0];
    if (!court || !canSubmitBooking) return;
    await runSave(async () => {
      if (editingBookingId != null) {
        await repo.updateBooking(editingBookingId, {
          courtId: court.id,
          courtName: court.name,
          bookingDate: bookingForm.bookingDate,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          customerName: bookingForm.customerName.trim(),
          customerPhone: bookingForm.customerPhone.trim(),
          teamName: bookingForm.teamName.trim(),
          playerCount: Number(bookingForm.playerCount) || 10,
          note: bookingForm.note.trim(),
          paymentStatus: bookingForm.paymentStatus,
        });
      } else {
        if (!selectedBookingSlot) return;
        const isWeekend = [0, 6].includes(new Date(bookingForm.bookingDate).getDay());
        const listedPrice = isWeekend ? court.weekendPrice : court.weekdayPrice;
        await repo.createBooking({
          courtId: court.id,
          courtName: court.name,
          bookingDate: bookingForm.bookingDate,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          customerName: bookingForm.customerName.trim(),
          customerPhone: bookingForm.customerPhone.trim(),
          teamName: bookingForm.teamName.trim(),
          playerCount: Number(bookingForm.playerCount) || 10,
          source: bookingSource,
          status: bookingSource === "WALK_IN" ? "CHECKED_IN" : "BOOKED",
          listedPrice,
          finalPrice: listedPrice,
          promotionSaleId: null,
          note: bookingForm.note.trim(),
          paymentMethod: bookingSource === "WALK_IN" ? "ONSITE" : "UNPAID",
          paymentStatus: bookingSource === "WALK_IN" ? "PAID" : "UNPAID",
          paymentSlipDataUrl: "",
          paymentReference: "",
        });
      }
      closeBookingModal();
      await refresh();
    });
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
        paymentSlipDataUrl: saleEditForm.paymentSlipDataUrl,
      });
      closePromotionSaleEditModal();
      await refresh();
    });
  }

  async function confirmPromotionSalePayment(id: number) {
    await runSave(async () => {
      await repo.updatePromotionSale(id, { paymentStatus: "PAID" });
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
    };
    if (!payload.name || !payload.phone) return;
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
      await repo.updateBooking(id, { status: "CANCELLED" });
      await refresh();
    });
  }

  async function onDeleteBooking(id: number) {
    const ok = await notice.confirm("ลบรายการจองนี้ออกจากระบบถาวรใช่หรือไม่?");
    if (!ok) return;
    await runSave(async () => {
      await repo.deleteBooking(id);
      await refresh();
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
      await repo.updateBooking(id, { paymentStatus: "PAID" });
      await refresh();
    });
  }

  async function onSellPromotion() {
    const promotion = promotions.find((item) => item.id === Number(saleForm.promotionId));
    if (!promotion) return;
    if (!saleForm.customerName.trim() || !saleForm.customerPhone.trim()) return;
    if (saleForm.paymentMethod === "TRANSFER" && !saleForm.paymentSlipDataUrl) return;
    const paymentStatus =
      saleForm.paymentMethod === "TRANSFER"
        ? saleForm.paymentSlipDataUrl
          ? "PENDING_REVIEW"
          : "UNPAID"
        : "PAID";
    await runSave(async () => {
      await repo.createPromotionSale({
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
      closeSaleModal();
      await refresh();
    });
  }

  async function onCreateCost() {
    await runSave(async () => {
      await repo.createCostEntry({
        categoryId: Number(costForm.categoryId) || costCategories[0]?.id || 1,
        spentAt: new Date().toISOString(),
        amount: Number(costForm.amount) || 0,
        itemLabel: costForm.itemLabel.trim(),
        note: costForm.note.trim(),
      });
      setCostOpen(false);
      setCostForm({
        categoryId: String(costCategories[0]?.id ?? 1),
        itemLabel: "",
        amount: "",
        note: "",
      });
      await refresh();
    });
  }

  async function onSaveSettings() {
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
      });
      setSettings(next);
      setSettingsForm(next);
    });
  }

  async function setBookingStatus(id: number, status: FootballTurfBooking["status"]) {
    await runSave(async () => {
      await repo.updateBooking(id, { status });
      await refresh();
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

  function resetFinanceFilters() {
    setFinanceSearch("");
    setFinanceType("ALL");
    setFinanceStartDate(todayDateKey);
    setFinanceEndDate(todayDateKey);
    setFinanceRange("TODAY");
  }

  function resetOffersFilters() {
    setOffersSearch("");
    setOffersSaleStatus("ALL");
  }

  function resetQrFilters() {
    setQrView("ALL");
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
              <p className="mt-1 text-[11px] font-semibold text-[#8b87b8]">
                สถานะตามเวลาปัจจุบัน · ไม่ผูกกับตัวกรองวันที่ด้านบน
              </p>
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
                  const alertKind = courtLiveAlertKind(current, nowMinutes);
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
                            <span>เลยเวลาสิ้นสุดรอบ · ควรปิดรอบก่อนคิวถัดไป</span>
                          </div>
                        ) : null}

                        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-[#2e2a58]">
                          {guestLabel ? (
                            <>
                              <span className="font-semibold text-[#66638c]">
                                {isOvertimeAlert
                                  ? "ผู้ใช้ก่อนหน้า: "
                                  : current!.status === "BOOKED"
                                    ? "จอง: "
                                    : "เช็กอิน: "}
                              </span>
                              {guestLabel}
                              <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">
                                {current!.startTime}–{current!.endTime} · {current!.customerPhone}
                              </span>
                            </>
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
                          <div
                            className={cn(
                              "rounded-xl border px-2 py-1.5 text-[11px] font-bold",
                              nextIsContinuous
                                ? "border-violet-300/90 bg-violet-50/95 text-violet-950"
                                : "border-sky-200/90 bg-sky-50/95 text-sky-950",
                            )}
                            role="status"
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
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-auto flex shrink-0 flex-wrap items-center gap-1.5 pt-3">
                        {idle || (showAsClosed && hoursPhase === "BEFORE_OPEN") ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openCourtLiveBooking(court, "ONLINE")}
                              className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6] shadow-sm"
                              aria-label={`จอง ${court.name}`}
                            >
                              จอง
                            </button>
                            {idle ? (
                              <button
                                type="button"
                                onClick={() => openCourtLiveBooking(court, "WALK_IN")}
                                className="inline-flex min-h-[32px] items-center justify-center rounded-xl bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white shadow-sm"
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
                            className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900 shadow-sm"
                            aria-label={`ไม่มา เปิดคิว ${court.name}`}
                          >
                            ไม่มา · เปิดคิว
                          </button>
                        ) : null}

                        {current?.status === "BOOKED" ? (
                          <button
                            type="button"
                            onClick={() => void setBookingStatus(current.id, "CHECKED_IN")}
                            className="inline-flex min-h-[32px] items-center justify-center rounded-xl bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white shadow-sm"
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
                              "inline-flex min-h-[32px] items-center justify-center rounded-xl px-3 py-1.5 text-[11px] font-black shadow-sm",
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
                            className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-800 shadow-sm"
                            aria-label={`ยืนยันชำระ ${court.name}`}
                          >
                            ยืนยันชำระ
                          </button>
                        ) : null}

                        {current ? (
                          <button
                            type="button"
                            onClick={() => openEditBookingModal(current)}
                            className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6] shadow-sm"
                            aria-label={`แก้ไขการจอง ${court.name}`}
                          >
                            แก้ไข
                          </button>
                        ) : null}

                        {!idle && !showAsClosed && next?.status === "BOOKED" ? (
                          <button
                            type="button"
                            onClick={() => void setBookingStatus(next.id, "CHECKED_IN")}
                            className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-violet-300/80 bg-violet-50 px-3 py-1.5 text-[11px] font-black text-violet-900 shadow-sm"
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
              className="flex flex-row items-start justify-between gap-3 sm:items-center"
              actionWrapClassName="min-w-0 shrink-0 self-start pt-0.5 sm:pt-0"
              action={
                <div className="flex max-w-full flex-nowrap items-center justify-end gap-2 overflow-x-auto">
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
            <div className="mt-4">
              {!selectedScheduleBoard ? (
                <AppEmptyState tone="violet">ยังไม่มีสนามให้แสดงตาราง</AppEmptyState>
              ) : (
                <div
                  key={`${selectedScheduleBoard.court.id}-${scheduleDate}`}
                  className="rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-white/85 via-white/70 to-cyan-50/45 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/70 pb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">สนาม</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                        {selectedScheduleBoard.court.name}
                      </h3>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-2 text-right shadow-sm ring-1 ring-white/80">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">เวลาเปิดใช้งาน</p>
                      <p className="mt-1 text-sm font-black text-slate-700">
                        {selectedScheduleBoard.court.openTime} - {selectedScheduleBoard.court.closeTime}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {selectedScheduleBoard.timeline.length === 0 ? (
                      <AppEmptyState tone="violet">ยังไม่มีช่วงเวลาให้แสดง</AppEmptyState>
                    ) : (
                      selectedScheduleBoard.timeline.map((slot) => {
                        const court = selectedScheduleBoard.court;
                        const liveNow = new Date(liveClockMs);
                        const timeOpts = {
                          scheduleDate,
                          todayDateKey,
                          nowMinutes: localNowMinutes(liveNow),
                        };
                        const timePassed = isSlotTimePassed(slot, timeOpts);
                        const timeCurrent = isSlotTimeCurrent(slot, timeOpts);
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
                                      : "ว่าง พร้อมรับจอง"}
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
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                                  {formatMoney(booking.finalPrice)}
                                </span>
                              ) : null}
                              {!booking && !timePassed ? (
                                <button
                                  type="button"
                                  onClick={() => openScheduleSlotBooking(court, slot.startTime, slot.endTime)}
                                  className="inline-flex min-h-[32px] items-center justify-center rounded-xl bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white shadow-sm"
                                  aria-label={`จอง ${court.name} ${slot.startTime}`}
                                >
                                  จอง
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
                  className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 text-sm font-black shadow-sm sm:min-w-0 sm:px-4"
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
                    "min-h-[36px] rounded-full border px-3 text-xs font-black transition",
                    queueDatePreset === key
                      ? "border-[#5b61ff]/50 bg-[#ecebff] text-[#3b36a0] ring-2 ring-[#5b61ff]/20"
                      : "border-white/60 bg-white/70 text-[#4d47b6] hover:bg-white/90",
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
                  "min-h-[36px] rounded-full border px-3 text-xs font-black transition",
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
                className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-4 text-xs font-black text-[#4d47b6]")}
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
                const overdue = footballBookingNeedsClose(item, {
                  todayDateKey,
                  nowMinutes: localNowMinutes(new Date(liveClockMs)),
                });
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
                        className={assetRowEditIconButtonClass}
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
                        </div>

                        {overdue ? (
                          <div
                            className="mt-2 flex flex-wrap items-center gap-2 rounded-[1rem] border border-amber-300/80 bg-amber-50/95 px-2.5 py-1.5 text-xs font-bold text-amber-950"
                            role="status"
                          >
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                            <span className="min-w-0 flex-1">{footballBookingOverdueLabel(item.status)}</span>
                            {item.status === "BOOKED" ? (
                              <button
                                type="button"
                                onClick={() => void setBookingStatus(item.id, "CHECKED_IN")}
                                className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-black text-white"
                              >
                                เช็กอิน
                              </button>
                            ) : item.status === "CHECKED_IN" || item.status === "PLAYING" ? (
                              <button
                                type="button"
                                onClick={() => void setBookingStatus(item.id, "COMPLETED")}
                                className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-black text-white"
                              >
                                เช็กเอาท์
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        <p className="mt-2 text-sm font-medium text-[#66638c]">
                          {item.courtName} · {item.bookingDate} · {item.startTime}–{item.endTime}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#8b87b8]">
                          {item.customerPhone}
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
                              className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-700"
                            >
                              ยืนยันชำระ
                            </button>
                          ) : null}
                          {item.status === "BOOKED" ? (
                            <button
                              type="button"
                              onClick={() => void setBookingStatus(item.id, "CHECKED_IN")}
                              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-black text-sky-700"
                            >
                              เช็กอิน
                            </button>
                          ) : null}
                          {item.status === "CHECKED_IN" || item.status === "PLAYING" ? (
                            <button
                              type="button"
                              onClick={() => void setBookingStatus(item.id, "COMPLETED")}
                              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-700"
                            >
                              เช็กเอาท์
                            </button>
                          ) : null}
                          {item.status !== "CANCELLED" && item.status !== "COMPLETED" ? (
                            <button
                              type="button"
                              onClick={() => void onCancelBooking(item.id)}
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700"
                            >
                              ยกเลิก
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
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
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="สรุปการเงิน"
              className="flex flex-row items-start justify-between gap-3 sm:items-center"
              actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
              action={
                <button
                  type="button"
                  onClick={() => setFinanceChartOpen(true)}
                  aria-label="ดูกราฟรายรับรายจ่าย"
                  title="ดูกราฟ"
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 border-[#dcd8f0] bg-white/80 px-0 text-[#4d47b6] shadow-sm hover:bg-white sm:min-w-0 sm:gap-2 sm:px-4",
                  )}
                >
                  <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">ดูกราฟ</span>
                </button>
              }
            />
            <FilterToolbar
              title="กรองข้อมูลการเงิน"
              summary={financeFilterSummary}
              activeCount={financeActiveFilterCount}
              onReset={resetFinanceFilters}
            >
              <div className="grid gap-3">
                <div className="rounded-[1rem] border border-slate-200/85 bg-gradient-to-r from-slate-50 to-white p-3 shadow-[0_18px_30px_-28px_rgba(15,23,42,0.4)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ห้วงเวลา</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <FilterSegmentButton label="วันนี้" active={financeRange === "TODAY"} onClick={() => setFinanceRange("TODAY")} />
                    <FilterSegmentButton label="เดือนนี้" active={financeRange === "MONTH"} onClick={() => setFinanceRange("MONTH")} />
                    <FilterSegmentButton label="ปีนี้" active={financeRange === "YEAR"} onClick={() => setFinanceRange("YEAR")} />
                    <FilterSegmentButton label="กำหนดช่วงเอง" active={financeRange === "CUSTOM"} onClick={() => setFinanceRange("CUSTOM")} />
                  </div>
                </div>
                <FilterField label="ค้นหา" icon={<Search className="h-4 w-4" />}>
                  <input
                    type="search"
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                    className={FILTER_CONTROL_CLASS}
                    placeholder="ค้นหารายการ รายรับ หรือรายจ่าย"
                  />
                </FilterField>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FilterField label="ประเภทรายการ" icon={<Wallet className="h-4 w-4" />}>
                    <select value={financeType} onChange={(e) => setFinanceType(e.target.value as "ALL" | "BOOKING" | "PROMOTION" | "COST")} className={FILTER_CONTROL_CLASS}>
                      <option value="ALL">ทุกประเภท</option>
                      <option value="BOOKING">รายรับการจอง</option>
                      <option value="PROMOTION">รายรับโปรโมชั่น</option>
                      <option value="COST">รายจ่าย</option>
                    </select>
                  </FilterField>
                  <FilterField label="วันเริ่มต้น" icon={<CalendarDays className="h-4 w-4" />}>
                    <input
                      type="date"
                      value={financeStartDate}
                      onChange={(e) => {
                        setFinanceStartDate(e.target.value || todayDateKey);
                        setFinanceRange("CUSTOM");
                      }}
                      className={FILTER_CONTROL_CLASS}
                    />
                  </FilterField>
                  <FilterField label="วันสิ้นสุด" icon={<CalendarDays className="h-4 w-4" />}>
                    <input
                      type="date"
                      value={financeEndDate}
                      onChange={(e) => {
                        setFinanceEndDate(e.target.value || todayDateKey);
                        setFinanceRange("CUSTOM");
                      }}
                      className={FILTER_CONTROL_CLASS}
                    />
                  </FilterField>
                </div>
              </div>
            </FilterToolbar>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard title="รายรับรวม" value={formatMoney(financeRevenueTotal)} icon={<ReceiptText className="h-5 w-5" />} tone="border-white/60 bg-gradient-to-br from-white/80 via-cyan-50/55 to-sky-100/45" />
              <StatCard title="รายจ่ายรวม" value={formatMoney(financeCostTotal)} icon={<Wallet className="h-5 w-5" />} tone="border-white/60 bg-gradient-to-br from-white/80 via-rose-50/55 to-orange-100/45" />
            </div>
            <button type="button" onClick={() => { setCostForm((s) => ({ ...s, categoryId: String(costCategories[0]?.id ?? 1) })); setCostOpen(true); }} className="app-btn-primary mt-4 w-full rounded-xl px-5 py-3 text-sm font-black shadow-lg transition active:scale-[0.99]">
              เพิ่มรายจ่าย
            </button>
          </AppDashboardSection>

          <AppDashboardSection tone="violet">
            <AppSectionHeader tone="violet" title="ประวัติรายรับและรายจ่าย" />
            <div className="mt-4 space-y-3">
              {financeFilteredRows.length === 0 ? <AppEmptyState tone="violet">ไม่พบรายการทางการเงินตามตัวกรอง</AppEmptyState> : financeFilteredRows.map((item) => (
                <div key={item.id} className={cn("rounded-xl border p-4", item.tone)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="text-xs font-medium opacity-80">{item.subtitle} · {item.dateLabel}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p
                        className={cn(
                          "text-base font-black tabular-nums",
                          item.kind === "COST" ? "text-rose-700" : "text-emerald-700",
                        )}
                      >
                        {formatMoney(item.amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        {item.kind === "BOOKING" ? (
                          <>
                            <button
                              type="button"
                              className={assetRowEditIconButtonClass}
                              aria-label={`แก้ไขรายรับ ${item.title}`}
                              title="แก้ไข"
                              onClick={() => {
                                const booking = bookings.find((b) => `booking-${b.id}` === item.id);
                                if (booking) openEditBookingModal(booking);
                              }}
                            >
                              <IconRowEdit className="h-4 w-4" />
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
                              <IconRowRemove className="h-4 w-4" />
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
                                const sale = promotionSales.find((s) => `promotion-${s.id}` === item.id);
                                if (sale) openPromotionSaleEditModal(sale);
                              }}
                            >
                              <IconRowEdit className="h-4 w-4" />
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
                              <IconRowRemove className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                        {item.kind === "COST" ? (
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบรายจ่าย ${item.title}`}
                            title="ลบ"
                            onClick={() => void onDeleteCostEntry(Number(item.id.replace("cost-", "")))}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AppDashboardSection>
        </div>
      ) : null}

      {activeTab === "offers" ? (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <AppDashboardSection tone="violet">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AppSectionHeader tone="violet" title="โปรโมชั่นและแพ็กเล่น" />
              <div className="overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2">
                  <button type="button" onClick={() => openPromotionModal()} className="h-11 whitespace-nowrap rounded-xl border border-violet-200 bg-white/80 px-4 text-sm font-black text-violet-700">เพิ่มโปร</button>
                  <button type="button" onClick={() => setSaleOpen(true)} className="app-btn-primary h-11 whitespace-nowrap rounded-xl px-4 text-sm font-black shadow-sm">ขายโปร</button>
                </div>
              </div>
            </div>
            <FilterToolbar
              title="กรองโปรโมชั่น"
              summary={offersFilterSummary}
              activeCount={offersActiveFilterCount}
              onReset={resetOffersFilters}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterField label="ค้นหา" icon={<Search className="h-4 w-4" />}>
                  <input
                    type="search"
                    value={offersSearch}
                    onChange={(e) => setOffersSearch(e.target.value)}
                    className={FILTER_CONTROL_CLASS}
                    placeholder="ค้นหาโปร ชื่อลูกค้า หรือเบอร์โทร"
                  />
                </FilterField>
                <FilterField label="สถานะสิทธิ์" icon={<TicketPercent className="h-4 w-4" />}>
                  <select value={offersSaleStatus} onChange={(e) => setOffersSaleStatus(e.target.value as "ALL" | "ACTIVE" | "USED_UP")} className={FILTER_CONTROL_CLASS}>
                    <option value="ALL">ทุกสถานะสิทธิ์</option>
                    <option value="ACTIVE">ยังใช้ได้</option>
                    <option value="USED_UP">ใช้ครบแล้ว</option>
                  </select>
                </FilterField>
              </div>
            </FilterToolbar>
            <div className="mt-4 grid gap-3">
              {offersFilteredPromotions.length === 0 ? <AppEmptyState tone="violet">ไม่พบโปรโมชั่นตามตัวกรอง</AppEmptyState> : offersFilteredPromotions.map((item) => (
                <div key={item.id} className="rounded-xl border border-violet-100 bg-gradient-to-br from-white/85 via-violet-50/65 to-fuchsia-100/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black tracking-tight text-slate-900">{item.name}</p>
                      <p className="text-xs font-medium text-slate-500">{item.totalUses} รอบ · {item.durationMinutes} นาทีต่อรอบ · {item.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-base font-black text-violet-700">{formatMoney(item.price)}</p>
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไขโปรโมชั่น ${item.name}`}
                        title="แก้ไข"
                        onClick={() => openPromotionModal(item)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบโปรโมชั่น ${item.name}`}
                        title="ลบ"
                        onClick={() => void onDeletePromotion(item.id, item.name)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AppDashboardSection>

          <AppDashboardSection tone="violet">
            <AppSectionHeader tone="violet" title="ลูกค้าที่ถือสิทธิ์" />
            <div className="mt-4 space-y-3">
              {offersFilteredSales.length === 0 ? <AppEmptyState tone="violet">ไม่พบลูกค้าที่ถือสิทธิ์ตามตัวกรอง</AppEmptyState> : offersFilteredSales.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-black text-slate-900">{item.teamName || item.customerName}</p>
                      <p className="text-xs font-medium text-slate-500">{item.promotionName} · {item.customerPhone}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-lg px-2.5 py-1 text-[11px] font-black ring-1", bookingPaymentStatusClass(item.paymentStatus))}>
                          {bookingPaymentStatusLabel(item.paymentStatus)}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                          {item.paymentMethod === "TRANSFER" ? "โอนเงิน" : item.paymentMethod === "CASH" ? "เงินสด" : "ชำระหน้าสนาม"}
                        </span>
                        <span className="text-xs font-black text-violet-700">{formatMoney(item.price)}</span>
                      </div>
                      {item.paymentSlipDataUrl ? (
                        <div className="mt-3">
                          <AppImageThumb
                            src={item.paymentSlipDataUrl}
                            alt={`สลิป ${item.promotionName}`}
                            onOpen={() => item.paymentSlipDataUrl && saleSlipLightbox.open(item.paymentSlipDataUrl)}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200">เหลือ {item.remainingUses}/{item.totalUses}</span>
                      <div className="flex items-center gap-2">
                        {item.paymentStatus === "PENDING_REVIEW" || item.paymentStatus === "UNPAID" ? (
                          <button
                            type="button"
                            onClick={() => void confirmPromotionSalePayment(item.id)}
                            className="whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                          >
                            ยืนยันชำระ
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไขสิทธิ์ ${item.teamName || item.customerName}`}
                          title="แก้ไข"
                          onClick={() => openPromotionSaleEditModal(item)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบสิทธิ์ ${item.teamName || item.customerName}`}
                          title="ลบ"
                          onClick={() => void onDeletePromotionSale(item.id, item.teamName || item.customerName)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AppDashboardSection>
        </div>
      ) : null}

      {activeTab === "customers" ? (
        <AppDashboardSection tone="violet">
          <AppSectionHeader
            tone="violet"
            title="ลูกค้า"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button
                type="button"
                aria-label="เพิ่มลูกค้า"
                onClick={() => openCustomerModal()}
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-4 text-sm font-black shadow-sm sm:min-w-0"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มลูกค้า</span>
              </button>
            }
          />
          <FilterToolbar title="ค้นหาลูกค้า" summary={customerSearch.trim() ? `ค้นหา "${customerSearch.trim()}"` : "แสดงลูกค้าทั้งหมด"} activeCount={Number(Boolean(customerSearch.trim()))} onReset={() => setCustomerSearch("")}>
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
          <div className="mt-4 space-y-3">
            {customersFiltered.length === 0 ? (
              <AppEmptyState tone="violet">ไม่พบลูกค้าตามตัวกรอง</AppEmptyState>
            ) : (
              customersFiltered.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-slate-900">{item.name}</p>
                        <span className={cn("rounded-lg px-2.5 py-1 text-[11px] font-black ring-1", item.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200")}>
                          {item.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600">{item.phone}{item.teamName ? ` · ${item.teamName}` : ""}</p>
                      {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไขลูกค้า ${item.name}`}
                        title="แก้ไข"
                        onClick={() => openCustomerModal(item)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบลูกค้า ${item.name}`}
                        title="ลบ"
                        onClick={() => void onDeleteCustomer(item.id, item.name)}
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

      {activeTab === "qr" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <AppDashboardSection tone="violet">
            <AppSectionHeader tone="violet" title="ลิงก์สำหรับลูกค้า" />
            <FilterToolbar
              title="รูปแบบการแสดงผล"
              summary={qrFilterSummary}
              activeCount={qrActiveFilterCount}
              onReset={resetQrFilters}
              compact
            >
              <FilterField label="มุมมอง" icon={<QrCode className="h-4 w-4" />}>
                <select value={qrView} onChange={(e) => setQrView(e.target.value as "ALL" | "CUSTOMER" | "STAFF")} className={FILTER_CONTROL_CLASS}>
                  <option value="ALL">แสดงทั้งหมด</option>
                  <option value="CUSTOMER">เฉพาะลิงก์ลูกค้า</option>
                  <option value="STAFF">เฉพาะคู่มือพนักงาน</option>
                </select>
              </FilterField>
            </FilterToolbar>
            <div className="mt-4 space-y-3">
              {qrView !== "STAFF" ? <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-cyan-700" />
                  <p className="font-black text-slate-900">ลิงก์จองสนาม</p>
                </div>
                <p className="mt-2 break-all rounded-xl bg-white/80 px-3 py-3 text-sm text-slate-600">{publicBookUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void copyText(publicBookUrl)} className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-xs font-black text-cyan-700">คัดลอกลิงก์</button>
                  <button type="button" onClick={() => void openQrModal("QR-ลิงก์จองสนาม", publicBookUrl)} className="app-btn-primary rounded-xl px-4 py-2 text-xs font-black shadow-sm">Gen QR</button>
                </div>
              </div> : null}
              {qrView !== "STAFF" ? <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <p className="font-black text-slate-900">ลิงก์เช็กอินและใช้สิทธิ์</p>
                </div>
                <p className="mt-2 break-all rounded-xl bg-white/80 px-3 py-3 text-sm text-slate-600">{publicCheckInUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void copyText(publicCheckInUrl)} className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700">คัดลอกลิงก์</button>
                  <button type="button" onClick={() => void openQrModal("QR-ลิงก์เช็กอิน", publicCheckInUrl)} className="app-btn-primary rounded-xl px-4 py-2 text-xs font-black shadow-sm">Gen QR</button>
                </div>
              </div> : null}
              {copyMsg ? <p className="text-xs font-bold text-[#4d47b6]">{copyMsg}</p> : null}
            </div>
          </AppDashboardSection>

          {qrView !== "CUSTOMER" ? <AppDashboardSection tone="violet">
            <AppSectionHeader tone="violet" title="คำแนะนำการใช้งานพนักงาน" />
            <div className="mt-4 space-y-3 rounded-xl border border-white/70 bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-0.5 h-5 w-5 text-slate-500" />
                <p className="text-sm font-medium text-slate-600">เปิดแท็บคิวเพื่อกด “เพิ่ม walk-in” และเปลี่ยนสถานะการใช้งานของสนามแบบทันที</p>
              </div>
              <div className="flex items-start gap-3">
                <TicketPercent className="mt-0.5 h-5 w-5 text-slate-500" />
                <p className="text-sm font-medium text-slate-600">ขายโปรโมชั่นจากแท็บโปร แล้วให้ลูกค้าใช้สิทธิ์ผ่านหน้าลิงก์เช็กอินได้ทันที</p>
              </div>
              <div className="flex items-start gap-3">
                <Copy className="mt-0.5 h-5 w-5 text-slate-500" />
                <p className="text-sm font-medium text-slate-600">ถ้ายังไม่พร้อมทำ QR โปสเตอร์ สามารถเริ่มจากการแชร์ลิงก์ใน LINE หรือ Facebook ได้ก่อน</p>
              </div>
            </div>
          </AppDashboardSection> : null}
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
          <p className="mt-1 text-[11px] font-semibold text-[#8b87b8]">
            เพิ่ม · แก้ไข · ลบ · แนบรูปปกสนาม
          </p>
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
                        {court.openTime}–{court.closeTime} · รอบละ {court.slotMinutes} นาที
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
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <AppDashboardSection tone="violet">
            <AppSectionHeader tone="violet" title="ตั้งค่าสนาม" />
            <div className="mt-4 grid gap-4">
              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ชื่อและภาพรวม</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    ชื่อสนาม
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.venueName} onChange={(e) => setSettingsForm((state) => ({ ...state, venueName: e.target.value }))} placeholder="เช่น สนามฟุตบอล MAWELL" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    ชื่อบรรทัดรอง
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.venueSubtitle} onChange={(e) => setSettingsForm((state) => ({ ...state, venueSubtitle: e.target.value }))} placeholder="เช่น สนามหญ้าเทียม" />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ข้อมูลรับโอน</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    หมายเลขพร้อมเพย์
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.promptpayNumber} onChange={(e) => setSettingsForm((state) => ({ ...state, promptpayNumber: e.target.value }))} placeholder="เบอร์พร้อมเพย์" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    ธนาคาร
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.bankName} onChange={(e) => setSettingsForm((state) => ({ ...state, bankName: e.target.value }))} placeholder="ชื่อธนาคาร" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    ชื่อบัญชี
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.accountName} onChange={(e) => setSettingsForm((state) => ({ ...state, accountName: e.target.value }))} placeholder="ชื่อเจ้าของบัญชี" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    หมายเลขบัญชี
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.accountNumber} onChange={(e) => setSettingsForm((state) => ({ ...state, accountNumber: e.target.value }))} placeholder="เลขบัญชีธนาคาร" />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ข้อมูลติดต่อและเอกสาร</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    เบอร์ติดต่อ
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.contactPhone} onChange={(e) => setSettingsForm((state) => ({ ...state, contactPhone: e.target.value }))} placeholder="เบอร์ติดต่อสนาม" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    LINE / ช่องทางอื่น
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.contactLine} onChange={(e) => setSettingsForm((state) => ({ ...state, contactLine: e.target.value }))} placeholder="LINE OA / Facebook" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    ที่อยู่สนาม
                    <textarea className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.venueAddress} onChange={(e) => setSettingsForm((state) => ({ ...state, venueAddress: e.target.value }))} placeholder="ที่อยู่สำหรับลูกค้าและเอกสาร" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    หมายเลขกำกับภาษี
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.taxId} onChange={(e) => setSettingsForm((state) => ({ ...state, taxId: e.target.value }))} placeholder="เลขผู้เสียภาษี" />
                  </label>
                  <label className="space-y-1.5 text-sm font-bold text-slate-700">
                    หมายเหตุอื่นๆ
                    <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={settingsForm.note} onChange={(e) => setSettingsForm((state) => ({ ...state, note: e.target.value }))} placeholder="ข้อมูลอื่นที่ต้องการแสดง" />
                  </label>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ชำระตอนจองจากลิงก์ลูกค้า</p>
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
                        "min-h-[44px] rounded-xl border px-3 text-sm font-bold transition",
                        settingsForm.portalBookingPaymentMode === opt.value
                          ? "border-[#5b61ff]/50 bg-[#5b61ff]/15 text-[#4d47b6]"
                          : "border-slate-200 bg-white text-slate-500",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {settingsForm.portalBookingPaymentMode === "DEPOSIT" ? (
                  <label className="mt-3 block space-y-1.5 text-sm font-bold text-slate-700">
                    จำนวนมัดจำ (บาท)
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
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

              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">สลิปใบเสร็จ</p>
                <div className="mt-3">
                  <AppSlipPaperSizeSettingsField
                    fieldClassName="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                    hint="ใช้ตอนพิมพ์ใบเสร็จ · เฉพาะโมดูลสนามฟุตบอล"
                    value={settingsForm.slipPaperSize ?? "SLIP_58"}
                    onChange={(slipPaperSize) =>
                      setSettingsForm((state) => ({ ...state, slipPaperSize }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => void onSaveSettings()} className="app-btn-primary rounded-2xl px-5 py-3 text-sm font-black shadow-lg transition active:scale-[0.99]">
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          </AppDashboardSection>

          <AppDashboardSection tone="violet">
            <AppSectionHeader tone="violet" title="ตัวอย่างข้อมูลที่จะแสดง" />
            <div className="mt-4 grid gap-3">
              <div className="app-surface border border-[#e8e6fc]/80 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900" style={MODULE_TITLE_FONT}>{FOOTBALL_TURF_MODULE_NAME}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{settingsForm.venueName.trim() || settingsForm.venueSubtitle.trim() || "ยังไม่ได้ตั้งชื่อสนาม"}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">รับโอนเงินค่าจอง</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{settingsForm.promptpayNumber.trim() || settingsForm.accountNumber.trim() || "-"}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{settingsForm.accountName.trim() || settingsForm.bankName.trim() || "ยังไม่ได้ตั้งค่าบัญชี"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ที่อยู่สนาม</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{settingsForm.venueAddress.trim() || "-"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ติดต่อ</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{settingsForm.contactPhone.trim() || "-"}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{settingsForm.contactLine.trim() || settingsForm.taxId.trim() || "-"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white/88 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">หมายเหตุ</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{settingsForm.note.trim() || "ไม่มีข้อมูลเพิ่มเติม"}</p>
                  </div>
                </div>
              </div>
            </div>
          </AppDashboardSection>
        </div>
      ) : null}

      <FormModal
        open={bookingOpen}
        onClose={closeBookingModal}
        title={editingBookingId != null ? "แก้ไขการจอง" : bookingSource === "WALK_IN" ? "เพิ่มคิว walk-in" : "เพิ่มการจองสนาม"}
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={closeBookingModal}
            submitLabel={editingBookingId != null ? "บันทึกการแก้ไข" : "บันทึกคิว"}
            submitDisabled={!canSubmitBooking}
            onSubmit={() => void onCreateBooking()}
          />
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-600">สนาม<select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={bookingForm.courtId} onChange={(e) => updateBookingCourt(e.target.value)}>{courts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="space-y-1.5 text-sm font-medium text-slate-600">วันที่<input type="date" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={bookingForm.bookingDate} onChange={(e) => updateBookingDate(e.target.value)} /></label>
          </div>
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {editingBookingId != null ? "ช่วงเวลา" : "ช่วงเวลาของวันจอง"}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ช่วงเวลาที่เลือก</p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {bookingForm.startTime && bookingForm.endTime
                    ? `${bookingForm.startTime} - ${bookingForm.endTime}`
                    : "ไม่มีช่วงว่าง"}
                </p>
              </div>
            </div>
            {editingBookingId != null ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-slate-600">
                  เวลาเริ่ม
                  <input
                    type="time"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm((state) => ({ ...state, startTime: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-slate-600">
                  เวลาสิ้นสุด
                  <input
                    type="time"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm((state) => ({ ...state, endTime: e.target.value }))}
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
                  const isSelected =
                    !isBooked &&
                    bookingForm.startTime === slot.startTime &&
                    bookingForm.endTime === slot.endTime;
                  return (
                    <button
                      key={`booking-slot-${slot.startTime}-${slot.endTime}`}
                      type="button"
                      disabled={isBooked}
                      onClick={() =>
                        setBookingForm((state) => ({
                          ...state,
                          startTime: slot.startTime,
                          endTime: slot.endTime,
                        }))
                      }
                      className={cn(
                        "rounded-[1.35rem] border px-4 py-3 text-left transition-all",
                        isBooked
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
                              : "ว่าง พร้อมรับจอง"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                            isBooked
                              ? bookingStatusClass(slot.booking!.status)
                              : isSelected
                                ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                : "bg-slate-50 text-slate-500 ring-slate-200",
                          )}
                        >
                          {isBooked ? bookingStatusLabel(slot.booking!.status) : isSelected ? "เลือกแล้ว" : "ว่าง"}
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
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อลูกค้า" value={bookingForm.customerName} onChange={(e) => setBookingForm((s) => ({ ...s, customerName: e.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="เบอร์โทร" value={bookingForm.customerPhone} onChange={(e) => setBookingForm((s) => ({ ...s, customerPhone: e.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 sm:col-span-2" placeholder="ชื่อทีม" value={bookingForm.teamName} onChange={(e) => setBookingForm((s) => ({ ...s, teamName: e.target.value }))} />
              <textarea className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 sm:col-span-2" placeholder="หมายเหตุ" value={bookingForm.note} onChange={(e) => setBookingForm((s) => ({ ...s, note: e.target.value }))} />
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
                    <option value="PAID">ชำระแล้ว</option>
                  </select>
                </label>
              ) : null}
            </div>
          </div>
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
              เวลาเปิด
              <input
                type="time"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                value={courtForm.openTime}
                onChange={(e) => setCourtForm((state) => ({ ...state, openTime: e.target.value }))}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-600">
              เวลาปิด
              <input
                type="time"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800"
                value={courtForm.closeTime}
                onChange={(e) => setCourtForm((state) => ({ ...state, closeTime: e.target.value }))}
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
              (saleForm.paymentMethod === "TRANSFER" && !saleForm.paymentSlipDataUrl)
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
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="เบอร์โทร" value={saleForm.customerPhone} onChange={(e) => setSaleForm((s) => ({ ...s, customerPhone: e.target.value }))} />
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
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-black text-slate-600 transition hover:bg-slate-100">
                    <Upload className="h-4 w-4" />
                    {saleSlipBusy ? "กำลังแนบสลิป..." : "เลือกไฟล์สลิป"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={saleSlipBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        void onSaleSlipSelected(file);
                      }}
                    />
                  </label>
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
                    <p className="mt-3 text-xs font-bold text-amber-700">ต้องแนบสลิปก่อนบันทึกเมื่อเลือกโอนเงิน</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs font-medium text-slate-500">บันทึกเป็นชำระแล้วทันที (เงินสด / หน้าสนาม)</p>
            )}
          </div>
        </div>
      </FormModal>

      <FormModal open={saleEditOpen} onClose={closePromotionSaleEditModal} title="แก้ไขสิทธิ์โปรโมชั่น" size="lg" footer={<FormModalFooterActions onCancel={closePromotionSaleEditModal} submitLabel="บันทึกสิทธิ์" onSubmit={() => void onSavePromotionSale()} />}>
        <div className="grid gap-4">
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อลูกค้า" value={saleEditForm.customerName} onChange={(e) => setSaleEditForm((s) => ({ ...s, customerName: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="เบอร์โทร" value={saleEditForm.customerPhone} onChange={(e) => setSaleEditForm((s) => ({ ...s, customerPhone: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อทีม" value={saleEditForm.teamName} onChange={(e) => setSaleEditForm((s) => ({ ...s, teamName: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="สิทธิ์คงเหลือ" value={saleEditForm.remainingUses} onChange={(e) => setSaleEditForm((s) => ({ ...s, remainingUses: e.target.value.replace(/\D/g, "") }))} />
          <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={saleEditForm.status} onChange={(e) => setSaleEditForm((s) => ({ ...s, status: e.target.value as FootballTurfPromotionSale["status"] }))}>
            <option value="ACTIVE">ใช้งานได้</option>
            <option value="USED_UP">ใช้ครบแล้ว</option>
            <option value="DISABLED">ปิดใช้งาน</option>
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={saleEditForm.paymentMethod} onChange={(e) => setSaleEditForm((s) => ({ ...s, paymentMethod: e.target.value as FootballTurfPromotionSalePaymentMethod }))}>
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
          {saleEditForm.paymentSlipDataUrl ? (
            <AppImageThumb
              src={saleEditForm.paymentSlipDataUrl}
              alt="สลิปขายโปร"
              onOpen={() => saleEditForm.paymentSlipDataUrl && saleSlipLightbox.open(saleEditForm.paymentSlipDataUrl)}
            />
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
            submitDisabled={!customerForm.name.trim() || !customerForm.phone.trim()}
            onSubmit={() => void onSaveCustomer()}
          />
        }
      >
        <div className="grid gap-4">
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อลูกค้า" value={customerForm.name} onChange={(e) => setCustomerForm((s) => ({ ...s, name: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="เบอร์โทร" value={customerForm.phone} onChange={(e) => setCustomerForm((s) => ({ ...s, phone: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="ชื่อทีม" value={customerForm.teamName} onChange={(e) => setCustomerForm((s) => ({ ...s, teamName: e.target.value }))} />
          <textarea className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700" rows={3} placeholder="หมายเหตุ" value={customerForm.note} onChange={(e) => setCustomerForm((s) => ({ ...s, note: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={customerForm.isActive} onChange={(e) => setCustomerForm((s) => ({ ...s, isActive: e.target.checked }))} />
            เปิดใช้งานลูกค้า
          </label>
        </div>
      </FormModal>

      <FormModal
        open={financeChartOpen}
        onClose={() => setFinanceChartOpen(false)}
        title="กราฟรายรับ–รายจ่าย"
        description={financeRangeLabel}
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setFinanceChartOpen(false)}
            className={cn(appTemplateOutlineButtonClass, "min-h-[44px] w-full sm:w-auto sm:min-w-[7rem]")}
          >
            ปิด
          </button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/80">รายรับ</p>
              <p className="mt-1 text-lg font-black tabular-nums text-emerald-900">{formatMoney(financeRevenueTotal)}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-800/80">รายจ่าย</p>
              <p className="mt-1 text-lg font-black tabular-nums text-rose-900">{formatMoney(financeCostTotal)}</p>
            </div>
          </div>
          <AppSparkChartPanel className="w-full min-w-0">
            <AppRevenueCostColumnChart
              className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
              compact
              title=""
              subtitle=""
              emptyText="ยังไม่มีข้อมูลในช่วงนี้ — ลองเปลี่ยนตัวกรอง"
              buckets={financeChartBuckets}
              formatTitle={(b) =>
                `${b.key}: รายรับ ${formatMoney(b.revenue)} · รายจ่าย ${formatMoney(b.cost)}`
              }
            />
          </AppSparkChartPanel>
        </div>
      </FormModal>

      <FormModal open={costOpen} onClose={() => setCostOpen(false)} title="เพิ่มรายจ่าย" footer={<FormModalFooterActions onCancel={() => setCostOpen(false)} submitLabel="บันทึกรายจ่าย" onSubmit={() => void onCreateCost()} />}>
        <div className="grid gap-4">
          <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" value={costForm.categoryId} onChange={(e) => setCostForm((s) => ({ ...s, categoryId: e.target.value }))}>
            {costCategories.length === 0 ? <option value="1">ทั่วไป</option> : costCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="รายการรายจ่าย" value={costForm.itemLabel} onChange={(e) => setCostForm((s) => ({ ...s, itemLabel: e.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800" placeholder="จำนวนเงิน" value={costForm.amount} onChange={(e) => setCostForm((s) => ({ ...s, amount: e.target.value }))} />
          <textarea className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700" rows={3} placeholder="หมายเหตุ" value={costForm.note} onChange={(e) => setCostForm((s) => ({ ...s, note: e.target.value }))} />
        </div>
      </FormModal>

      {notice.popup}
      <AppImageLightbox src={saleSlipLightbox.src} onClose={saleSlipLightbox.close} alt="สลิป" />
      <AppImageLightbox src={courtImageLightbox.src} onClose={courtImageLightbox.close} alt="รูปสนาม" />
      {courtCameraModal}
    </div>
  );
}
