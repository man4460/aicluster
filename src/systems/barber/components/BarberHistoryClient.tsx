"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppColumnBarBucket, AppDualColumnBarBucket, AppRevenueCostBucket } from "@/components/app-templates";
import {
  AppDashboardSection,
  AppIconPencil,
  AppIconToolbarButton,
  AppIconTrash,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { daysInBangkokMonth } from "@/lib/barber/bangkok-day";
import { normalizeBarberSlipUrlForDashboard } from "@/lib/barber/receipt-display-url";
import type { BarberCostToolbarApi } from "@/systems/barber/components/BarberCostPanel";
import { BarberCostToolbarInline } from "@/systems/barber/components/BarberCostsClient";
import { BarberDashboardCharts } from "@/systems/barber/components/BarberDashboardCharts";
import {
  barberCardSurfaceRadiusClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelMdClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberOffersEmptyStateClass,
  barberOffersFilterBarClass,
  barberOffersListRowCardClass,
  barberOffersTabSegmentShellClass,
  barberPageStackClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";

/** เดือนเดี่ยว 1–12 หรือทุกเดือนในปีที่เลือก */
type MonthFilter = number | "all";

/** ทุกวันในเดือนที่เลือก หรือวันเดียว 1–31 (เวลาไทย) */
type DayFilter = number | "all";

type LogRow = {
  id: number;
  visitType: string;
  note: string | null;
  amountBaht: string | null;
  receiptImageUrl: string | null;
  createdAt: string;
  subscriptionId: number | null;
  stylistName: string | null;
  customer: { id: number; phone: string; name: string | null };
};

/** 12 เดือน — index 0 = ม.ค. */
const MONTH_LABELS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

const MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const barberFinanceFilterSelectClass =
  `w-full ${barberCardSurfaceRadiusClass} border border-[#e8e6f4]/90 bg-gradient-to-br from-white/95 to-[#f8f7ff]/60 px-3 py-2 text-sm font-semibold text-[#1e1b4b] shadow-sm outline-none transition focus:ring-2 focus:ring-violet-500/35`;
const barberFinanceFilterInputClass =
  `w-full ${barberCardSurfaceRadiusClass} border border-[#e8e6f4]/90 bg-gradient-to-br from-white/95 to-[#f8f7ff]/60 px-3 py-2 text-sm font-semibold text-[#1e1b4b] placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-violet-500/35`;

function financeListTabBtnClass(active: boolean, variant: "sales" | "costs") {
  return cn(
    `inline-flex items-center justify-center ${barberCardSurfaceRadiusClass} px-3 py-1.5 text-xs font-bold transition-all duration-200`,
    active &&
      variant === "sales" &&
      "bg-gradient-to-br from-white via-indigo-50/95 to-violet-50/55 text-[#4338ca] shadow-sm ring-1 ring-indigo-200/55",
    active &&
      variant === "costs" &&
      "bg-gradient-to-br from-white via-rose-50/90 to-orange-50/45 text-rose-800 shadow-sm ring-1 ring-rose-200/55",
    !active && "text-slate-600 hover:bg-white/75 hover:text-slate-900",
  );
}

function bangkokCalendarParts(): { year: number; month: number; day: number } {
  const key = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [y, m, d] = key.split("-").map((p) => Number(p));
  return { year: y, month: m, day: d };
}

function visitLabel(v: string) {
  if (v === "PACKAGE_USE") return "หักแพ็กเกจ";
  if (v === "CASH_WALK_IN") return "เงินสด";
  return v;
}

function formatBaht(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatBangkokShort(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ค่า `<input type="datetime-local" />` ตามเวลาไทย (ไม่มี DST) */
function isoToBangkokDatetimeLocal(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** แปลงค่าจาก datetime-local ที่แสดงเป็นเวลาไทย → ISO สำหรับ API */
function bangkokDatetimeLocalToIso(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return new Date(local).toISOString();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  return new Date(Date.UTC(y, mo - 1, da, hh - 7, mm, 0, 0)).toISOString();
}

function barberHistoryReceiptImgUrl(src: string | null | undefined): string | null {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return normalizeBarberSlipUrlForDashboard(src, origin);
}

export function BarberHistoryClient({
  embedded = false,
  onRequestCostsTab,
  financeListTab = "sales",
  onFinanceListTabChange,
  costsPanel,
  costToolbar = null,
  costToolbarBusy = false,
  financeFilterBeforeTitle,
  financeFilterTitle,
}: {
  embedded?: boolean;
  /** เมื่อไม่ได้ฝังรายจ่ายในหน้าเดียว — สลับไปแท็บต้นทุน/รายจ่าย */
  onRequestCostsTab?: () => void;
  /** โหมดการเงินรวม: แท็บรายการ (ซิงก์กับ ?tab=costs) */
  financeListTab?: "sales" | "costs";
  onFinanceListTabChange?: (tab: "sales" | "costs") => void;
  /** แผงรายจ่าย (BarberCostsClient แบบ hideEmbeddedToolbar) */
  costsPanel?: ReactNode;
  costToolbar?: BarberCostToolbarApi | null;
  costToolbarBusy?: boolean;
  /** โหมดฝังหน้าการเงิน: แถวเหนือหัวข้อ (เช่น ปุ่มย้อนกลับ) */
  financeFilterBeforeTitle?: ReactNode;
  /** โหมดฝังหน้าการเงิน: หัวข้อซ้ายของแถวไอคอนกรอง (มือถือ) และคอลัมน์ซ้ายของแถบกรอง (เดสก์ท็อป) */
  financeFilterTitle?: ReactNode;
}) {
  const pathname = usePathname();
  const financeUnified = Boolean(costsPanel && onFinanceListTabChange);
  const activeListTab = financeUnified ? financeListTab : "sales";
  const receiptLightbox = useAppImageLightbox();
  const [year, setYear] = useState(() => bangkokCalendarParts().year);
  const [month, setMonth] = useState<MonthFilter>(() => bangkokCalendarParts().month);
  const [day, setDay] = useState<DayFilter>("all");
  const [availableYears, setAvailableYears] = useState<number[]>(() => {
    const { year: y } = bangkokCalendarParts();
    return [y];
  });
  const [draftQ, setDraftQ] = useState("");
  const [activeQ, setActiveQ] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sparkRevenueCost, setSparkRevenueCost] = useState<AppRevenueCostBucket[]>([]);
  const [sparkVisitDual, setSparkVisitDual] = useState<AppDualColumnBarBucket[]>([]);
  const [sparkPackageSales, setSparkPackageSales] = useState<AppColumnBarBucket[]>([]);
  const [sparkLoading, setSparkLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<LogRow | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCreatedLocal, setEditCreatedLocal] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editName, setEditName] = useState("");
  const [editReceiptRemoved, setEditReceiptRemoved] = useState(false);
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [receiptPickUrl, setReceiptPickUrl] = useState<string | null>(null);
  const editReceiptInputRef = useRef<HTMLInputElement>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  /** เข้าหน้า — ค่าเริ่มต้น: ปีปัจจุบัน · เดือนปัจจุบัน · ทุกวันในเดือน (เวลาไทย) */
  useEffect(() => {
    const onFinanceSales =
      embedded && pathname === "/dashboard/barber/finance";
    const onLegacyHistory = !embedded && pathname === "/dashboard/barber/history";
    if (!onFinanceSales && !onLegacyHistory) return;
    const { year: y, month: m } = bangkokCalendarParts();
    setYear(y);
    setMonth(m);
    setDay("all");
    setDraftQ("");
    setActiveQ("");
    setAvailableYears([y]);
  }, [embedded, pathname]);

  useEffect(() => {
    const id = window.setTimeout(() => setActiveQ(draftQ.trim()), 350);
    return () => window.clearTimeout(id);
  }, [draftQ]);

  useEffect(() => {
    if (month === "all" || day === "all") return;
    const dim = daysInBangkokMonth(year, month);
    if (day > dim) setDay("all");
  }, [year, month, day]);

  useEffect(() => {
    if (availableYears.length === 0) return;
    const ys = availableYears.map((y) => Number(y));
    if (!ys.includes(year)) {
      setYear(ys[ys.length - 1]!);
    }
  }, [availableYears, year]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: month === "all" ? "all" : String(month),
      });
      if (month !== "all" && day !== "all") params.set("day", String(day));
      if (activeQ.length > 0) params.set("q", activeQ);
      const res = await fetch(`/api/barber/history?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        logs?: LogRow[];
        meta?: {
          availableYears?: unknown[];
          year?: number;
          month?: number | "all";
          day?: number | "all";
        };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "โหลดไม่สำเร็จ");
        setLogs([]);
        return;
      }
      setLogs(
        Array.isArray(data.logs)
          ? data.logs.map((l) => ({
              ...l,
              receiptImageUrl: l.receiptImageUrl ?? null,
            }))
          : [],
      );
      if (data.meta?.availableYears && data.meta.availableYears.length > 0) {
        const next = data.meta.availableYears
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x) && x >= 2000 && x <= 2100);
        setAvailableYears((prev) =>
          prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
        );
      }
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, day, activeQ]);

  const fetchSpark = useCallback(async () => {
    setSparkLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: month === "all" ? "all" : String(month),
      });
      if (month !== "all" && day !== "all") params.set("day", String(day));
      const res = await fetch(`/api/barber/history/spark?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        revenueCost?: AppRevenueCostBucket[];
        visitDual?: {
          key: string;
          label: string;
          packageUses: number;
          cashWalkIns: number;
          packageUsesPct: number;
          cashWalkInsPct: number;
        }[];
        packageSales?: AppColumnBarBucket[];
        error?: string;
      };
      if (!res.ok) {
        setSparkRevenueCost([]);
        setSparkVisitDual([]);
        setSparkPackageSales([]);
        return;
      }
      setSparkRevenueCost(Array.isArray(data.revenueCost) ? data.revenueCost : []);
      const vd = Array.isArray(data.visitDual) ? data.visitDual : [];
      setSparkVisitDual(
        vd.map((b) => ({
          key: b.key,
          label: b.label,
          seriesA: { amount: b.packageUses, pct: b.packageUsesPct },
          seriesB: { amount: b.cashWalkIns, pct: b.cashWalkInsPct },
        })),
      );
      setSparkPackageSales(Array.isArray(data.packageSales) ? data.packageSales : []);
    } catch {
      setSparkRevenueCost([]);
      setSparkVisitDual([]);
      setSparkPackageSales([]);
    } finally {
      setSparkLoading(false);
    }
  }, [year, month, day]);

  useEffect(() => {
    void fetchSpark();
  }, [fetchSpark]);

  function openEditModal(l: LogRow) {
    setEditErr(null);
    setEditTarget(l);
    setEditNote(l.note ?? "");
    setEditAmount(l.amountBaht != null ? String(l.amountBaht) : "");
    setEditCreatedLocal(isoToBangkokDatetimeLocal(l.createdAt));
    setEditPhone(l.customer.phone);
    setEditName(l.customer.name ?? "");
    setEditReceiptRemoved(false);
    setEditReceiptFile(null);
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditErr(null);
    setEditSaving(false);
    setEditReceiptRemoved(false);
    setEditReceiptFile(null);
  }

  useEffect(() => {
    if (!editReceiptFile) {
      setReceiptPickUrl(null);
      return;
    }
    const u = URL.createObjectURL(editReceiptFile);
    setReceiptPickUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [editReceiptFile]);

  useEffect(() => {
    if (!editTarget || receiptLightbox.src) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [editTarget, receiptLightbox.src]);

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditErr(null);
    const digits = editPhone.replace(/\D/g, "").slice(0, 20);
    if (digits.length < 9) {
      setEditErr("เบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }

    const body: Record<string, unknown> = {
      note: editNote.trim() || null,
      createdAt: bangkokDatetimeLocalToIso(editCreatedLocal),
      customerPhone: digits,
      customerName: editName.trim() || null,
    };

    if (editTarget.visitType === "CASH_WALK_IN") {
      const t = editAmount.trim();
      if (t.length === 0) body.amountBaht = null;
      else {
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) {
          setEditErr("ยอดเงินไม่ถูกต้อง");
          return;
        }
        body.amountBaht = n;
      }
      if (editReceiptFile) {
        const fd = new FormData();
        fd.append("file", editReceiptFile);
        const up = await fetch("/api/barber/cash-receipt/upload", { method: "POST", body: fd });
        const upData = (await up.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!up.ok) {
          setEditErr(upData.error ?? "อัปโหลดสลิปไม่สำเร็จ");
          return;
        }
        if (!upData.imageUrl) {
          setEditErr("อัปโหลดสลิปไม่สำเร็จ");
          return;
        }
        body.receiptImageUrl = upData.imageUrl;
      } else if (editReceiptRemoved) {
        body.receiptImageUrl = null;
      }
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/barber/history/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setEditErr(data.error ?? "แก้ไขไม่สำเร็จ");
        return;
      }
      closeEditModal();
      await fetchHistory();
      void fetchSpark();
    } finally {
      setEditSaving(false);
    }
  }

  async function removeLog(l: LogRow) {
    if (!confirm(`ลบประวัติรายการ #${l.id} ?`)) return;
    const res = await fetch(`/api/barber/history/${l.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await fetchHistory();
    void fetchSpark();
  }

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!mobileFilterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFilterOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileFilterOpen]);

  const { year: cy, month: cm, day: cd } = bangkokCalendarParts();
  const dayOptionsLen = month === "all" ? 0 : daysInBangkokMonth(year, month);

  const { periodTotalRevenue, periodTotalCost } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    for (const b of sparkRevenueCost) {
      rev += b.revenue;
      cost += b.cost;
    }
    return { periodTotalRevenue: rev, periodTotalCost: cost };
  }, [sparkRevenueCost]);

  function applyPresetToday() {
    setYear(cy);
    setMonth(cm);
    setDay(cd);
  }

  function applyPresetThisMonthAllDays() {
    setYear(cy);
    setMonth(cm);
    setDay("all");
  }

  function applyPresetThisYearAllMonths() {
    setYear(cy);
    setMonth("all");
    setDay("all");
  }

  const resolvedEditReceipt =
    editTarget && !editReceiptRemoved ? barberHistoryReceiptImgUrl(editTarget.receiptImageUrl) : null;

  const presetBtnClass =
    "rounded-full border border-indigo-100/90 bg-gradient-to-br from-white to-[#eef2ff]/85 px-3 py-1.5 text-xs font-bold text-[#4d47b6] shadow-sm backdrop-blur-sm transition hover:from-[#f8f7ff] hover:to-white hover:shadow";

  const financeQuickPresetButtons = (
    <>
      <button type="button" className={presetBtnClass} onClick={applyPresetToday}>
        วันนี้
      </button>
      <button type="button" className={presetBtnClass} onClick={applyPresetThisMonthAllDays}>
        เดือนนี้ (ทุกวัน)
      </button>
      <button type="button" className={presetBtnClass} onClick={applyPresetThisYearAllMonths}>
        ปีนี้ (ทุกเดือน)
      </button>
    </>
  );

  const financeEmbeddedHeaderPresets =
    embedded && (financeFilterTitle != null || financeFilterBeforeTitle != null);

  return (
    <div className={embedded ? "min-w-0 space-y-4" : barberPageStackClass}>
      <AppDashboardSection tone="violet">
        {embedded ?
          financeFilterTitle != null || financeFilterBeforeTitle != null ?
            <div className="flex flex-col gap-3 rounded-2xl border border-white/55 bg-gradient-to-br from-white/45 via-[#faf9ff]/40 to-[#ecfdf5]/25 p-3 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl md:hidden sm:p-4">
              {financeFilterBeforeTitle ?
                <div className="print:hidden">{financeFilterBeforeTitle}</div>
              : null}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">{financeFilterTitle}</div>
                <button
                  type="button"
                  suppressHydrationWarning
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center ${barberCardSurfaceRadiusClass} border border-indigo-100/90 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-violet-600 shadow-sm ring-1 ring-white/60 backdrop-blur-md transition-all active:scale-95`}
                  onClick={() => setMobileFilterOpen(true)}
                  aria-label="เปิดตัวกรองข้อมูลการเงิน"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </button>
              </div>
            </div>
          : <div className="flex justify-end rounded-2xl border border-white/55 bg-gradient-to-br from-white/45 via-[#faf9ff]/40 to-[#ecfdf5]/25 p-3 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl md:hidden sm:p-4">
              <button
                type="button"
                suppressHydrationWarning
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center ${barberCardSurfaceRadiusClass} border border-indigo-100/90 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-violet-600 shadow-sm ring-1 ring-white/60 backdrop-blur-md transition-all active:scale-95`}
                onClick={() => setMobileFilterOpen(true)}
                aria-label="เปิดตัวกรองข้อมูลการเงิน"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
            </div>
        : <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/55 bg-gradient-to-br from-white/45 via-[#faf9ff]/40 to-[#ecfdf5]/25 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl md:rounded-[2rem] sm:p-5">
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-[#4338ca] via-[#6366f1] to-[#0d9488] bg-clip-text text-transparent">
                  ภาพรวมการเงิน
                </span>
              </h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-[#5f5a8a]">
                <span className="text-[#6366f1]">กราฟรายได้</span>
                <span className="mx-1.5 text-[#d4d0ec]" aria-hidden>
                  ·
                </span>
                <span className="text-rose-600/85">ต้นทุน / รายจ่าย</span>
              </p>
            </div>
            <button
              type="button"
              suppressHydrationWarning
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center ${barberCardSurfaceRadiusClass} border border-indigo-100/90 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-violet-600 shadow-sm ring-1 ring-white/60 backdrop-blur-md transition-all active:scale-95 md:hidden`}
              onClick={() => setMobileFilterOpen(true)}
              aria-label="เปิดตัวกรองข้อมูลการเงิน"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
          </div>
        }

        {financeEmbeddedHeaderPresets ?
          <div className="hidden min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 md:flex print:hidden">
            <div className="flex min-w-0 flex-col gap-2">
              {financeFilterBeforeTitle}
              {financeFilterTitle}
            </div>
            <div
              className="flex shrink-0 flex-wrap items-center justify-end gap-2"
              role="group"
              aria-label="เลือกช่วงเวลาด่วน"
            >
              {financeQuickPresetButtons}
            </div>
          </div>
        : null}

        <div
          className={cn(
            barberOffersFilterBarClass,
            financeFilterTitle != null || financeFilterBeforeTitle != null ? "mt-3" : "mt-5",
            "hidden flex-wrap items-end gap-x-4 gap-y-3 backdrop-blur-sm md:flex md:py-3",
          )}
        >
          <div className="grid min-w-0 w-full grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="bb-fin-y">
                ปี
              </label>
              <select
                id="bb-fin-y"
                className={barberFinanceFilterSelectClass}
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="bb-fin-m">
                เดือน
              </label>
              <select
                id="bb-fin-m"
                className={barberFinanceFilterSelectClass}
                value={month === "all" ? "all" : String(month)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMonth(v === "all" ? "all" : Number(v));
                  if (v === "all") setDay("all");
                }}
                aria-label="กรองตามเดือน หรือทุกเดือนในปี"
              >
                <option value="all">ทุกเดือนในปีนี้</option>
                {MONTH_NUMBERS.map((m) => (
                  <option key={m} value={String(m)}>
                    {m} — {MONTH_LABELS_TH[m - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="bb-fin-d">
                วัน
              </label>
              <select
                id="bb-fin-d"
                className={cn(barberFinanceFilterSelectClass, month === "all" && "cursor-not-allowed opacity-60")}
                disabled={month === "all"}
                value={month === "all" ? "all" : day === "all" ? "all" : String(day)}
                onChange={(e) => {
                  const v = e.target.value;
                  setDay(v === "all" ? "all" : Number(v));
                }}
                aria-label="กรองวันในปฏิทินไทย หรือทุกวันในเดือน"
              >
                <option value="all">ทุกวันในเดือน</option>
                {month !== "all"
                  ? Array.from({ length: dayOptionsLen }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        {d}
                      </option>
                    ))
                  : null}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400" htmlFor="bb-fin-q">
                ค้นหา
              </label>
              <input
                id="bb-fin-q"
                className={barberFinanceFilterInputClass}
                placeholder="เบอร์หรือชื่อ"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-3 hidden flex-wrap gap-2 md:flex",
            financeEmbeddedHeaderPresets && "md:hidden",
          )}
        >
          {financeQuickPresetButtons}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 via-violet-50/35 to-indigo-100/30 p-3 shadow-[0_16px_34px_-24px_rgba(91,97,255,0.4)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[8px] font-bold uppercase tracking-wider text-violet-500 sm:text-[10px]">
                รายได้รวม
              </span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-[10px] text-violet-600 sm:h-8 sm:w-8 sm:text-base">
                ฿
              </span>
            </div>
            <p className="mt-2 text-sm font-black text-[#1e1b4b] sm:mt-3 sm:text-2xl">
              ฿{periodTotalRevenue.toLocaleString()}
            </p>
            <div className="mt-1 hidden items-center gap-1.5 sm:flex">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-slate-500">ยอดขายในช่วงที่กรอง</span>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/60 via-rose-50/30 to-orange-100/25 p-3 shadow-[0_16px_34px_-24px_rgba(244,63,94,0.35)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[8px] font-bold uppercase tracking-wider text-rose-500 sm:text-[10px]">
                ต้นทุนรวม
              </span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 sm:h-8 sm:w-8">
                <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m19 9-7 7-7-7" />
                </svg>
              </span>
            </div>
            <p className="mt-2 text-sm font-black text-rose-900 sm:mt-3 sm:text-2xl">
              ฿{periodTotalCost.toLocaleString()}
            </p>
            <div className="mt-1 hidden items-center gap-1.5 sm:flex">
              <div className="h-1 w-1 rounded-full bg-rose-500" />
              <span className="text-[10px] font-medium text-slate-500">จากกราฟช่วงเดียวกัน</span>
            </div>
          </div>

          <div
            className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.32)] backdrop-blur-xl transition-colors sm:p-5",
              periodTotalRevenue - periodTotalCost >= 0
                ? "border-white/60 bg-gradient-to-br from-white/60 to-emerald-100/28"
                : "border-white/60 bg-gradient-to-br from-white/60 to-orange-100/28",
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "truncate text-[8px] font-bold uppercase tracking-wider sm:text-[10px]",
                  periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-600" : "text-orange-600",
                )}
              >
                กำไรสุทธิ
              </span>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                  periodTotalRevenue - periodTotalCost >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600",
                )}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
            <p
              className={cn(
                "mt-2 text-sm font-black sm:mt-3 sm:text-2xl",
                periodTotalRevenue - periodTotalCost >= 0 ? "text-emerald-900" : "text-orange-900",
              )}
            >
              ฿{(periodTotalRevenue - periodTotalCost).toLocaleString()}
            </p>
            <div className="mt-1 hidden items-center gap-1.5 sm:flex">
              <div
                className={cn(
                  "h-1 w-1 rounded-full",
                  periodTotalRevenue - periodTotalCost >= 0 ? "bg-emerald-500" : "bg-orange-500",
                )}
              />
              <span className="text-[10px] font-medium text-slate-500">รายได้ − รายจ่าย</span>
            </div>
          </div>
        </div>

        {sparkLoading ? (
          <p className="mt-5 rounded-2xl border border-[#e8e6f4]/80 bg-gradient-to-br from-[#faf9ff]/90 via-white to-[#f0fdf9]/40 px-4 py-6 text-center text-sm text-slate-600 shadow-sm backdrop-blur-md">
            กำลังโหลดกราฟ…
          </p>
        ) : (
          <>
            <div className="mt-4 rounded-2xl border border-white/60 bg-gradient-to-br from-white/55 via-[#faf9ff]/35 to-indigo-50/25 p-4 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
              <div className="mb-2 sm:mb-3">
                <h3 className="bg-gradient-to-r from-[#312e81] to-[#5b61ff] bg-clip-text text-sm font-black text-transparent sm:text-base">
                  แนวโน้มรายได้และรายจ่าย
                </h3>
              </div>
              <div className="h-[220px] w-full sm:h-[280px]">
                <AppRevenueCostColumnChart
                  className="h-full w-full"
                  buckets={sparkRevenueCost}
                  title=""
                  emptyText="ไม่มีข้อมูลรายได้หรือต้นทุนในช่วงที่เลือก"
                  formatTitle={(b) =>
                    `${b.label}: รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
                  }
                />
              </div>
            </div>

            <div className="mt-4 min-w-0">
              <BarberDashboardCharts visitDualBuckets={sparkVisitDual} packageSalesBuckets={sparkPackageSales} />
            </div>
          </>
        )}
      </AppDashboardSection>

      {mobileFilterOpen ?
        <BarberModalPortal>
          <div
            className={barberModalBackdropClass}
            role="presentation"
            onClick={() => setMobileFilterOpen(false)}
          >
            <div
              id="barber-finance-filter-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-finance-filter-dialog-title"
              className={barberModalPanelMdClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-finance-filter-dialog-title" className={barberModalTitleClass}>
                    ตัวกรองข้อมูลการเงิน
                  </h2>
                  <p className={barberModalSubtitleClass}>เลือกช่วงเวลาและคำค้นหาเพื่อดูผลลัพธ์</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className={barberModalCloseBtnClass}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
              <form
                className="space-y-4 px-5 py-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMobileFilterOpen(false);
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[#4d47b6]" htmlFor="bb-fin-popup-y">
                    ปี
                    <select
                      id="bb-fin-popup-y"
                      className={`app-input mt-1.5 min-h-[48px] w-full rounded-xl px-3 py-2 text-base ${barberCardSurfaceRadiusClass}`}
                      value={String(year)}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-[#4d47b6]" htmlFor="bb-fin-popup-m">
                    เดือน
                    <select
                      id="bb-fin-popup-m"
                      className={`app-input mt-1.5 min-h-[48px] w-full rounded-xl px-3 py-2 text-base ${barberCardSurfaceRadiusClass}`}
                      value={month === "all" ? "all" : String(month)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMonth(v === "all" ? "all" : Number(v));
                        if (v === "all") setDay("all");
                      }}
                      aria-label="กรองตามเดือน หรือทุกเดือนในปี"
                    >
                      <option value="all">ทุกเดือนในปีนี้</option>
                      {MONTH_NUMBERS.map((m) => (
                        <option key={m} value={String(m)}>
                          {m} — {MONTH_LABELS_TH[m - 1]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-semibold text-[#4d47b6]" htmlFor="bb-fin-popup-d">
                  วัน
                  <select
                    id="bb-fin-popup-d"
                    className={cn(
                      `app-input mt-1.5 min-h-[48px] w-full rounded-xl px-3 py-2 text-base ${barberCardSurfaceRadiusClass}`,
                      month === "all" && "cursor-not-allowed opacity-60",
                    )}
                    disabled={month === "all"}
                    value={month === "all" ? "all" : day === "all" ? "all" : String(day)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDay(v === "all" ? "all" : Number(v));
                    }}
                    aria-label="กรองวันในปฏิทินไทย หรือทุกวันในเดือน"
                  >
                    <option value="all">ทุกวันในเดือน</option>
                    {month !== "all"
                      ? Array.from({ length: dayOptionsLen }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            {d}
                          </option>
                        ))
                      : null}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]" htmlFor="bb-fin-popup-q">
                  ค้นหา
                  <input
                    id="bb-fin-popup-q"
                    className="app-input mt-1.5 min-h-[48px] w-full rounded-xl px-3 py-2 text-base placeholder:text-[#8b87ad]"
                    placeholder="เบอร์หรือชื่อ"
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {financeQuickPresetButtons}
                </div>
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className={`app-btn-soft min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-white`}
                  >
                    ใช้การกรอง
                  </button>
                </div>
              </form>
            </div>
          </div>
        </BarberModalPortal>
      : null}

      {error ? <p className={barberInlineAlertErrorClass}>{error}</p> : null}

      <AppDashboardSection tone="slate">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/55 bg-gradient-to-br from-white/40 via-[#faf9ff]/35 to-[#fff7ed]/18 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl md:rounded-[2rem] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#0d9488] bg-clip-text text-transparent">
                  รายการในช่วงที่กรอง
                </span>
              </h2>
              {financeUnified && activeListTab === "sales" && loading ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  กำลังอัปเดต…
                </span>
              ) : null}
              {!financeUnified && loading ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  กำลังอัปเดต…
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {financeUnified && activeListTab === "costs"
                ? "ต้นทุน · รายจ่าย · แถบขวาจัดการ"
                : `${logs.length} รายการ`}
            </p>
          </div>
          {financeUnified ? (
            <div
              className={cn(
                barberOffersTabSegmentShellClass,
                "flex max-w-full shrink-0 flex-wrap items-center gap-1 p-1 backdrop-blur-sm",
              )}
              role="group"
              aria-label="สลับมุมมองรายรับและรายจ่าย"
            >
              {activeListTab === "costs" ? (
                <BarberCostToolbarInline toolbar={costToolbar} busy={costToolbarBusy} />
              ) : null}
              <button
                type="button"
                suppressHydrationWarning
                className={financeListTabBtnClass(activeListTab === "sales", "sales")}
                onClick={() => onFinanceListTabChange?.("sales")}
              >
                รายรับ
              </button>
              <button
                type="button"
                suppressHydrationWarning
                className={financeListTabBtnClass(activeListTab === "costs", "costs")}
                onClick={() => onFinanceListTabChange?.("costs")}
              >
                รายจ่าย
              </button>
            </div>
          ) : (
            <div
              className={cn(
                barberOffersTabSegmentShellClass,
                "flex shrink-0 items-center gap-1 p-1 backdrop-blur-sm",
              )}
              role="group"
              aria-label="สลับมุมมองรายรับและรายจ่าย"
            >
              <span
                className={financeListTabBtnClass(true, "sales")}
                aria-current="page"
              >
                รายรับ
              </span>
              {onRequestCostsTab ? (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={onRequestCostsTab}
                  className={financeListTabBtnClass(false, "costs")}
                >
                  รายจ่าย
                </button>
              ) : (
                <Link
                  href="/dashboard/barber/finance?tab=costs"
                  className={financeListTabBtnClass(false, "costs")}
                >
                  รายจ่าย
                </Link>
              )}
            </div>
          )}
        </div>

        {activeListTab === "sales" && !loading && logs.length === 0 && !error ? (
          <p className={`${barberOffersEmptyStateClass} mt-4 text-sm text-slate-600`}>
            ไม่มีรายการในช่วงนี้
          </p>
        ) : null}

        {activeListTab === "sales" && logs.length > 0 ? (
          <div
            className="mt-4 max-h-[min(70vh,40rem)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 pr-0.5 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0"
            role="region"
            aria-label="รายการผู้มาใช้บริการ — เลื่อนดูเพิ่มเติม"
          >
            <ul className="space-y-2 p-3 pb-4 sm:p-4">
              {logs.map((l) => {
                const isCash = l.visitType === "CASH_WALK_IN";
                const amt = isCash && l.amountBaht != null ? Number(l.amountBaht) : null;
                const receiptSrc = barberHistoryReceiptImgUrl(l.receiptImageUrl);
                return (
                  <li
                    key={l.id}
                    className={cn(
                      barberOffersListRowCardClass,
                      "flex min-w-0 gap-3 py-2.5 sm:items-start sm:gap-4",
                    )}
                  >
                    {receiptSrc ? (
                      <AppImageThumb
                        src={receiptSrc}
                        alt="สลิป"
                        onOpen={() => receiptLightbox.open(receiptSrc)}
                        className="self-start rounded-lg border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35 sm:h-[4.5rem] sm:w-[4.5rem]"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold tabular-nums text-[#2e2a58]">
                          {l.customer.phone}
                        </span>
                        <span
                          className={
                            isCash
                              ? "shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-950"
                              : "shrink-0 rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-bold text-emerald-900"
                          }
                        >
                          {visitLabel(l.visitType)}
                        </span>
                      </div>
                      {l.customer.name ? (
                        <p className="truncate text-xs text-[#5f5a8a]">{l.customer.name}</p>
                      ) : null}
                      <p className="text-[11px] leading-snug text-[#8b87ad]">
                        {formatBangkokShort(l.createdAt)}
                        {l.subscriptionId ? ` · #${l.subscriptionId}` : null}
                        {l.stylistName ? ` · ${l.stylistName}` : null}
                      </p>
                      {l.note ? (
                        <p className="line-clamp-2 text-xs leading-snug text-[#66638c]">{l.note}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 sm:min-w-[5.5rem]">
                      {isCash ? (
                        <p
                          className={cn(
                            "text-right text-lg font-bold tabular-nums leading-tight sm:text-xl",
                            amt != null ? "text-amber-900" : "text-[#b4b0ce]",
                          )}
                        >
                          {amt != null ? (
                            <>
                              ฿{formatBaht(amt)}
                              <span className="ml-0.5 text-[10px] font-semibold text-[#8b87ad]">บาท</span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold">—</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-right text-xs font-semibold text-emerald-800">แพ็กเกจ</p>
                      )}
                      <div className={cn(barberIconToolbarGroupClass, "shrink-0")} role="group" aria-label="แก้ไขหรือลบ">
                        <AppIconToolbarButton title="แก้ไข" ariaLabel="แก้ไขรายการ" onClick={() => openEditModal(l)}>
                          <AppIconPencil className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                        <AppIconToolbarButton
                          title="ลบรายการ"
                          ariaLabel="ลบรายการ"
                          onClick={() => void removeLog(l)}
                          className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
                        >
                          <AppIconTrash className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {financeUnified && costsPanel ? (
          <div
            className={cn(
              "mt-4 min-h-0 max-h-[min(70vh,40rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-2xl border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0",
              activeListTab !== "costs" && "hidden",
            )}
            role="region"
            aria-label="รายการต้นทุนและรายจ่าย"
          >
            {costsPanel}
          </div>
        ) : null}
      </AppDashboardSection>

      {editTarget ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeEditModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-history-edit-title"
              className={barberModalPanelMdClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-history-edit-title" className={barberModalTitleClass}>
                    แก้ไขรายการ
                  </h2>
                  <p className={cn(barberModalSubtitleClass, "truncate tabular-nums")}>รายการ #{editTarget.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className={barberModalCloseBtnClass}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3 px-5 py-5">
              {editErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{editErr}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เวลาทำรายการ (เวลาไทย)
                <input
                  type="datetime-local"
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 py-2 text-sm"
                  value={editCreatedLocal}
                  onChange={(e) => setEditCreatedLocal(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                เบอร์โทร
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 py-2 text-base tabular-nums"
                  inputMode="numeric"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อลูกค้า
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 100))}
                  placeholder="ไม่บังคับ"
                />
              </label>
              {editTarget.visitType === "CASH_WALK_IN" ? (
                <div className={`${barberCardSurfaceRadiusClass} border border-[#ecebff] bg-[#faf9ff] px-3 py-2.5`}>
                  <p className="text-xs font-semibold text-[#4d47b6]">รูปสลิป</p>
                  <input
                    ref={editReceiptInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f?.type.startsWith("image/")) return;
                      setEditReceiptRemoved(false);
                      setEditReceiptFile(f);
                    }}
                  />
                  {receiptPickUrl ? (
                    <button
                      type="button"
                      className="mt-2 block w-full cursor-zoom-in rounded-lg border border-transparent p-0 text-left focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4d47b6]/40"
                      onClick={() => receiptLightbox.open(receiptPickUrl)}
                      aria-label="ดูรูปสลิปใหม่เต็มจอ"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptPickUrl}
                        alt="ตัวอย่างสลิปใหม่"
                        className="max-h-36 w-full rounded-lg border border-[#ecebff] object-contain"
                      />
                    </button>
                  ) : resolvedEditReceipt ? (
                    <button
                      type="button"
                      className="mt-2 block w-full cursor-zoom-in rounded-lg border border-transparent p-0 text-left focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4d47b6]/40"
                      onClick={() => receiptLightbox.open(resolvedEditReceipt)}
                      aria-label="ดูรูปสลิปปัจจุบันเต็มจอ"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolvedEditReceipt}
                        alt="สลิปปัจจุบัน"
                        className="max-h-36 w-full rounded-lg border border-[#ecebff] object-contain"
                      />
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-[#8b87ad]">ยังไม่มีสลิป</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="app-btn-soft rounded-lg px-3 py-2 text-xs font-semibold text-[#2e2a58]"
                      onClick={() => editReceiptInputRef.current?.click()}
                    >
                      เลือกรูปใหม่
                    </button>
                    {(editTarget.receiptImageUrl || editReceiptFile) && !editReceiptRemoved ? (
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                        onClick={() => {
                          setEditReceiptFile(null);
                          setEditReceiptRemoved(true);
                        }}
                      >
                        ลบสลิป
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                หมายเหตุ
                <textarea
                  className="app-input mt-1 min-h-[72px] w-full resize-y rounded-xl px-3 py-2 text-sm"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value.slice(0, 255))}
                  placeholder="ไม่บังคับ"
                  rows={2}
                  maxLength={255}
                />
              </label>
              {editTarget.visitType === "CASH_WALK_IN" ? (
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ยอดเงินสด (บาท)
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-base tabular-nums"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="เว้นว่างได้"
                  />
                </label>
              ) : (
                <p className="rounded-lg bg-[#f8f7ff] px-3 py-2 text-xs text-[#5f5a8a]">
                  รายการหักแพ็กเกจ — แก้เวลา เบอร์ ชื่อ หมายเหตุได้ (ไม่มีสลิป/ยอดเงิน)
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className={`app-btn-soft min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-white disabled:opacity-60`}
                >
                  {editSaving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </BarberModalPortal>
      ) : null}

      <AppImageLightbox
        src={receiptLightbox.src}
        onClose={receiptLightbox.close}
        alt="รูปสลิป"
      />
    </div>
  );
}
