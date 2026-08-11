"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppColumnBarBucket, AppDualColumnBarBucket, AppRevenueCostBucket } from "@/components/app-templates";
import {
  AppDashboardSection,
  AppIconPencil,
  AppIconPrint,
  AppIconToolbarButton,
  AppIconTrash,
  AppImageLightbox,
  AppImageThumb,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import type { BarberFinanceRange } from "@/lib/barber/finance-range";
import { normalizeBarberSlipUrlForDashboard } from "@/lib/barber/receipt-display-url";
import { barberPaymentMethodLabel } from "@/systems/barber/lib/payment-method";
import type { BarberCostToolbarApi } from "@/systems/barber/components/BarberCostPanel";
import { BarberCostToolbarInline } from "@/systems/barber/components/BarberCostsClient";
import { BarberDashboardCharts } from "@/systems/barber/components/BarberDashboardCharts";
import {
  BarberMemberPrintModal,
  type BarberMemberPrintRow,
} from "@/systems/barber/components/BarberMemberPrintModal";
import type { BarberPrintShopProfile } from "@/systems/barber/lib/barber-print-docs";
import {
  barberCardSurfaceRadiusClass,
  barberDashboardSegmentBtnClass,
  barberDashboardSegmentShellClass,
  barberFieldClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelMdClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberNavActiveClass,
  barberNavIdleClass,
  barberOffersEmptyStateClass,
  barberOffersListRowCardClass,
  barberPageStackClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";

type LogRow = {
  id: number;
  visitType: string;
  note: string | null;
  amountBaht: string | null;
  receiptImageUrl: string | null;
  paymentMethod: string | null;
  createdAt: string;
  subscriptionId: number | null;
  stylistName: string | null;
  customer: {
    id: number;
    phone: string;
    name: string | null;
    taxInvoiceEnabled?: boolean;
    billingName?: string;
    taxId?: string;
    taxAddress?: string;
    taxBranch?: string;
  };
};

function logRowToPrintRow(l: LogRow): BarberMemberPrintRow | null {
  if (l.visitType !== "CASH_WALK_IN") return null;
  const amt = l.amountBaht != null ? Number(l.amountBaht) : NaN;
  if (!Number.isFinite(amt) || amt <= 0) return null;
  return {
    id: l.id,
    createdAt: l.createdAt,
    remainingSessions: 0,
    paymentMethod: l.paymentMethod,
    package: {
      name: l.note?.trim() || "บริการตัดผม",
      price: amt,
      totalSessions: 0,
    },
    customer: {
      phone: l.customer.phone,
      name: l.customer.name,
      taxInvoiceEnabled: l.customer.taxInvoiceEnabled,
      billingName: l.customer.billingName,
      taxId: l.customer.taxId,
      taxAddress: l.customer.taxAddress,
      taxBranch: l.customer.taxBranch,
    },
  };
}

const barberFinanceFilterInputClass = cn(
  barberFieldClass,
  barberCardSurfaceRadiusClass,
  "box-border min-h-[44px] h-11 border-[#e8e6f4]/90 bg-gradient-to-br from-white/95 to-[#f8f7ff]/60 placeholder:text-slate-400 shadow-sm",
);

const barberFinanceResetButtonClass = cn(
  barberDashboardSegmentBtnClass(false),
  "h-9 min-h-9 px-3",
);

function financeListTabBtnClass(active: boolean) {
  return cn(
    "inline-flex h-8 min-h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-[0.85rem] px-2 text-[11px] font-bold leading-none whitespace-nowrap transition-all sm:flex-initial sm:px-3 sm:text-xs",
    active ? barberNavActiveClass : barberNavIdleClass,
  );
}

function visitLabel(v: string) {
  if (v === "PACKAGE_USE") return "หักแพ็กเกจ";
  if (v === "CASH_WALK_IN") return "Walk-in";
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

function FinanceRangeChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(barberDashboardSegmentBtnClass(active), "px-2 sm:px-2.5")}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
      <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14v4M12 9v9M17 5v13" strokeLinecap="round" />
    </svg>
  );
}

function IconRangeToday({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRangeMonth({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconRangeYear({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h8" strokeLinecap="round" />
    </svg>
  );
}

function IconRangeCustom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
      <path d="M15 15l5 5M20 15l-5 5" strokeLinecap="round" />
    </svg>
  );
}

function IconIncome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" />
    </svg>
  );
}

function IconExpense({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M12 21V9M8 13l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5h14" strokeLinecap="round" />
    </svg>
  );
}

function financeRangeLabelTh(range: BarberFinanceRange, from: string, to: string): string {
  if (range === "TODAY") return "วันนี้";
  if (range === "MONTH") return "เดือนนี้";
  if (range === "YEAR") return "ปีนี้";
  if (from && to && from !== to) return `${from} ถึง ${to}`;
  if (from || to) return `วันที่ ${from || to}`;
  return "กำหนดเอง";
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
  onRequestCostsTab?: () => void;
  financeListTab?: "sales" | "costs";
  onFinanceListTabChange?: (tab: "sales" | "costs") => void;
  costsPanel?: ReactNode;
  costToolbar?: BarberCostToolbarApi | null;
  costToolbarBusy?: boolean;
  financeFilterBeforeTitle?: ReactNode;
  financeFilterTitle?: ReactNode;
}) {
  const pathname = usePathname();
  const financeUnified = Boolean(costsPanel && onFinanceListTabChange);
  const activeListTab = financeUnified ? financeListTab : "sales";
  const receiptLightbox = useAppImageLightbox();

  const todayKey = bangkokDateKey();
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [financeRange, setFinanceRange] = useState<BarberFinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState(`${todayKey.slice(0, 7)}-01`);
  const [dateTo, setDateTo] = useState(todayKey);
  const [draftQ, setDraftQ] = useState("");
  const [activeQ, setActiveQ] = useState("");
  const [rangeLabel, setRangeLabel] = useState("เดือนนี้");

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
  const [printRow, setPrintRow] = useState<BarberMemberPrintRow | null>(null);
  const [shopPrintProfile, setShopPrintProfile] = useState<BarberPrintShopProfile | null>(null);

  const filtersActive = financeRange !== "MONTH" || Boolean(activeQ.trim());

  useEffect(() => {
    void fetch("/api/barber/shop-profile", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { profile?: BarberPrintShopProfile }) => {
        if (d.profile) setShopPrintProfile(d.profile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onFinanceSales = embedded && pathname === "/dashboard/barber/finance";
    const onLegacyHistory = !embedded && pathname === "/dashboard/barber/history";
    if (!onFinanceSales && !onLegacyHistory) return;
    const t = bangkokDateKey();
    setFinanceRange("MONTH");
    setDateFrom(`${t.slice(0, 7)}-01`);
    setDateTo(t);
    setDraftQ("");
    setActiveQ("");
    setFilterOpen(false);
    setChartsOpen(false);
    setRangeLabel("เดือนนี้");
  }, [embedded, pathname]);

  useEffect(() => {
    const id = window.setTimeout(() => setActiveQ(draftQ.trim()), 350);
    return () => window.clearTimeout(id);
  }, [draftQ]);

  const buildRangeParams = useCallback(() => {
    const params = new URLSearchParams({ range: financeRange });
    if (financeRange === "CUSTOM") {
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
    }
    return params;
  }, [financeRange, dateFrom, dateTo]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildRangeParams();
      if (activeQ.length > 0) params.set("q", activeQ);
      const res = await fetch(`/api/barber/history?${params.toString()}`);
      const data = (await res.json().catch(() => ({}))) as {
        logs?: LogRow[];
        meta?: { rangeLabel?: string };
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
              paymentMethod: l.paymentMethod ?? null,
            }))
          : [],
      );
      if (data.meta?.rangeLabel) setRangeLabel(data.meta.rangeLabel);
      else setRangeLabel(financeRangeLabelTh(financeRange, dateFrom, dateTo));
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [buildRangeParams, activeQ, financeRange, dateFrom, dateTo]);

  const fetchSpark = useCallback(async () => {
    setSparkLoading(true);
    try {
      const params = buildRangeParams();
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
        meta?: { rangeLabel?: string };
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
      if (data.meta?.rangeLabel) setRangeLabel(data.meta.rangeLabel);
    } catch {
      setSparkRevenueCost([]);
      setSparkVisitDual([]);
      setSparkPackageSales([]);
    } finally {
      setSparkLoading(false);
    }
  }, [buildRangeParams]);

  const reloadAll = useCallback(async () => {
    await Promise.all([fetchHistory(), fetchSpark()]);
  }, [fetchHistory, fetchSpark]);

  useEffect(() => {
    void fetchSpark();
  }, [fetchSpark]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  function selectFinanceRange(next: BarberFinanceRange) {
    setFinanceRange(next);
    if (next === "CUSTOM" && !dateFrom && !dateTo) {
      const t = bangkokDateKey();
      setDateFrom(`${t.slice(0, 7)}-01`);
      setDateTo(t);
    }
    setRangeLabel(financeRangeLabelTh(next, dateFrom, dateTo));
  }

  function resetFilters() {
    const t = bangkokDateKey();
    setFinanceRange("MONTH");
    setDateFrom(`${t.slice(0, 7)}-01`);
    setDateTo(t);
    setDraftQ("");
    setActiveQ("");
    setRangeLabel("เดือนนี้");
  }

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
      await reloadAll();
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
    await reloadAll();
  }

  const { periodTotalRevenue, periodTotalCost } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    for (const b of sparkRevenueCost) {
      rev += b.revenue;
      cost += b.cost;
    }
    return { periodTotalRevenue: rev, periodTotalCost: cost };
  }, [sparkRevenueCost]);

  const net = periodTotalRevenue - periodTotalCost;
  const resolvedEditReceipt =
    editTarget && !editReceiptRemoved ? barberHistoryReceiptImgUrl(editTarget.receiptImageUrl) : null;

  return (
    <div className={embedded ? "min-w-0 space-y-4" : barberPageStackClass}>
      {financeFilterBeforeTitle ? <div className="print:hidden">{financeFilterBeforeTitle}</div> : null}
      {financeFilterTitle ? <div className="sr-only">{financeFilterTitle}</div> : null}

      <section aria-label={`สรุปการเงิน ${rangeLabel}`}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <li
            className={cn(
              barberCardSurfaceRadiusClass,
              "border border-white/60 bg-gradient-to-br from-white/70 via-emerald-50/40 to-emerald-100/25 p-3 shadow-sm backdrop-blur-xl sm:p-5",
            )}
          >
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-emerald-700/80">
              รายรับ · {rangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
              ฿{periodTotalRevenue.toLocaleString()}
            </p>
          </li>
          <li
            className={cn(
              barberCardSurfaceRadiusClass,
              "border border-white/60 bg-gradient-to-br from-white/70 via-rose-50/35 to-orange-100/20 p-3 shadow-sm backdrop-blur-xl sm:p-5",
            )}
          >
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-rose-500">
              รายจ่าย · {rangeLabel}
            </p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
              ฿{periodTotalCost.toLocaleString()}
            </p>
          </li>
          <li
            className={cn(
              barberCardSurfaceRadiusClass,
              "col-span-2 border border-white/60 p-3 shadow-sm backdrop-blur-xl sm:col-span-1 sm:p-5",
              net >= 0
                ? "bg-gradient-to-br from-white/70 to-emerald-100/25"
                : "bg-gradient-to-br from-white/70 to-rose-100/25",
            )}
          >
            <p
              className={cn(
                "text-left text-[10px] font-black uppercase tracking-widest",
                net >= 0 ? "text-[#66638c]" : "text-rose-600",
              )}
            >
              สุทธิ · {rangeLabel}
            </p>
            <p
              className={cn(
                "mt-2 text-left text-2xl font-black tabular-nums sm:text-3xl",
                net >= 0 ? "text-[#1e1b4b]" : "text-rose-800",
              )}
            >
              ฿{net.toLocaleString()}
            </p>
          </li>
        </ul>
      </section>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-center justify-between gap-2 sm:gap-3"
          actionWrapClassName="shrink-0"
          action={
            <div className={cn(barberDashboardSegmentShellClass, "max-w-full")} role="group" aria-label="เครื่องมือการเงิน">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="barber-finance-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  barberDashboardSegmentBtnClass(filterOpen),
                  "relative",
                  filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
                )}
              >
                <IconFilter className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="barber-finance-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={barberDashboardSegmentBtnClass(chartsOpen)}
              >
                <IconChart className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}</span>
              </button>
              <button
                type="button"
                onClick={() => void reloadAll()}
                disabled={loading || sparkLoading}
                aria-busy={loading || sparkLoading}
                aria-label="รีเฟรชข้อมูลรายงาน"
                title="รีเฟรช"
                className={cn(barberDashboardSegmentBtnClass(false), "disabled:opacity-50")}
              >
                <IconRefresh className={cn("h-3.5 w-3.5 shrink-0", (loading || sparkLoading) && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          }
        />

        <div
          id="barber-finance-filter-panel"
          className={cn("mt-3 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div
            className={cn(barberDashboardSegmentShellClass, "w-full flex-wrap justify-start sm:w-auto sm:flex-nowrap")}
            role="group"
            aria-label="กรองช่วงเวลาการเงิน"
          >
            <FinanceRangeChip
              label="วันนี้"
              active={financeRange === "TODAY"}
              onClick={() => selectFinanceRange("TODAY")}
              icon={<IconRangeToday className="h-3.5 w-3.5 shrink-0" />}
            />
            <FinanceRangeChip
              label="เดือนนี้"
              active={financeRange === "MONTH"}
              onClick={() => selectFinanceRange("MONTH")}
              icon={<IconRangeMonth className="h-3.5 w-3.5 shrink-0" />}
            />
            <FinanceRangeChip
              label="ปีนี้"
              active={financeRange === "YEAR"}
              onClick={() => selectFinanceRange("YEAR")}
              icon={<IconRangeYear className="h-3.5 w-3.5 shrink-0" />}
            />
            <FinanceRangeChip
              label="กำหนดเอง"
              active={financeRange === "CUSTOM"}
              onClick={() => selectFinanceRange("CUSTOM")}
              icon={<IconRangeCustom className="h-3.5 w-3.5 shrink-0" />}
            />
          </div>

          <div
            className={cn(
              "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
              financeRange === "CUSTOM" ? "" : "",
            )}
          >
            {financeRange === "CUSTOM" ? (
              <>
                <label className="min-w-0 flex-1 sm:max-w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="ตั้งแต่วันที่ กรุงเทพ"
                    className={cn(barberFinanceFilterInputClass, "mt-1 w-full")}
                  />
                </label>
                <label className="min-w-0 flex-1 sm:max-w-[11rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="ถึงวันที่ กรุงเทพ"
                    className={cn(barberFinanceFilterInputClass, "mt-1 w-full")}
                  />
                </label>
              </>
            ) : null}
            <label className="min-w-0 flex-1 sm:min-w-[12rem]">
              <span className="sr-only">ค้นหาเบอร์หรือชื่อ</span>
              <input
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="ค้นหาเบอร์หรือชื่อ…"
                aria-label="ค้นหาเบอร์หรือชื่อ"
                inputMode="search"
                className={cn(barberFinanceFilterInputClass, "w-full")}
              />
            </label>
            {filtersActive ? (
              <button
                type="button"
                onClick={() => resetFilters()}
                className={barberFinanceResetButtonClass}
                aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
              >
                รีเซ็ต · เดือนนี้
              </button>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {rangeLabel}</p>
        </div>

        {chartsOpen ? (
          <div id="barber-finance-charts" className="mt-4 space-y-4">
            {sparkLoading ? (
              <p className="rounded-[2rem] border border-[#e8e6f4]/80 bg-gradient-to-br from-[#faf9ff]/90 via-white to-[#f0fdf9]/40 px-4 py-6 text-center text-sm text-slate-600 shadow-sm backdrop-blur-md">
                กำลังโหลดกราฟ…
              </p>
            ) : (
              <>
                <p className="text-sm font-black text-[#1e1b4b]">รายได้เทียบต้นทุน · {rangeLabel}</p>
                <div className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/55 via-[#faf9ff]/35 to-indigo-50/25 p-4 shadow-[0_16px_34px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5">
                  <div className="h-[220px] w-full sm:h-[280px]">
                    <AppRevenueCostColumnChart
                      className="h-full w-full"
                      compact
                      buckets={sparkRevenueCost}
                      title=""
                      emptyText="ไม่มีข้อมูลรายได้หรือต้นทุนในช่วงที่เลือก"
                      formatTitle={(b) =>
                        `${b.label}: รายได้ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
                      }
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <BarberDashboardCharts visitDualBuckets={sparkVisitDual} packageSalesBuckets={sparkPackageSales} />
                </div>
              </>
            )}
          </div>
        ) : null}

        <div className="mt-4 space-y-3 border-t border-[#ecebff] pt-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">
                  รายการในช่วงที่กรอง
                </h3>
                {(financeUnified ? activeListTab === "sales" && loading : loading) ? (
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
              <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                {activeListTab === "costs" ? (
                  <div className="flex justify-end">
                    <BarberCostToolbarInline toolbar={costToolbar} busy={costToolbarBusy} />
                  </div>
                ) : null}
                <div
                  className={cn(barberDashboardSegmentShellClass, "w-full flex-nowrap sm:w-auto")}
                  role="tablist"
                  aria-label="สลับมุมมองรายรับและรายจ่าย"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeListTab === "sales"}
                    className={financeListTabBtnClass(activeListTab === "sales")}
                    onClick={() => onFinanceListTabChange?.("sales")}
                  >
                    <IconIncome className="h-3.5 w-3.5 shrink-0" />
                    <span className="sm:hidden">รายรับ</span>
                    <span className="hidden sm:inline">ประวัติ / รายรับ</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeListTab === "costs"}
                    className={financeListTabBtnClass(activeListTab === "costs")}
                    onClick={() => onFinanceListTabChange?.("costs")}
                  >
                    <IconExpense className="h-3.5 w-3.5 shrink-0" />
                    รายจ่าย
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(barberDashboardSegmentShellClass, "w-full flex-nowrap sm:w-auto")}
                role="tablist"
                aria-label="สลับมุมมองรายรับและรายจ่าย"
              >
                <span className={financeListTabBtnClass(true)} aria-current="page" role="tab" aria-selected>
                  <IconIncome className="h-3.5 w-3.5 shrink-0" />
                  <span className="sm:hidden">รายรับ</span>
                  <span className="hidden sm:inline">ประวัติ / รายรับ</span>
                </span>
                {onRequestCostsTab ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={false}
                    onClick={onRequestCostsTab}
                    className={financeListTabBtnClass(false)}
                  >
                    <IconExpense className="h-3.5 w-3.5 shrink-0" />
                    รายจ่าย
                  </button>
                ) : (
                  <Link href="/dashboard/barber/finance?tab=costs" className={financeListTabBtnClass(false)} role="tab">
                    <IconExpense className="h-3.5 w-3.5 shrink-0" />
                    รายจ่าย
                  </Link>
                )}
              </div>
            )}
          </div>

          {error ? <p className={barberInlineAlertErrorClass}>{error}</p> : null}

          {activeListTab === "sales" && !loading && logs.length === 0 && !error ? (
            <p className={`${barberOffersEmptyStateClass} text-sm text-slate-600`}>ไม่มีรายการในช่วงนี้</p>
          ) : null}

          {activeListTab === "sales" && logs.length > 0 ? (
            <div
              className="max-h-[min(70vh,40rem)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-[2rem] border border-white/55 bg-white/35 pr-0.5 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0"
              role="tabpanel"
              aria-label="รายการผู้มาใช้บริการ — เลื่อนดูเพิ่มเติม"
            >
              <ul className="space-y-2 p-3 pb-4 sm:p-4">
                {logs.map((l) => {
                  const isCash = l.visitType === "CASH_WALK_IN";
                  const amt = isCash && l.amountBaht != null ? Number(l.amountBaht) : null;
                  const receiptSrc = barberHistoryReceiptImgUrl(l.receiptImageUrl);
                  const salePrintRow = logRowToPrintRow(l);
                  return (
                    <li
                      key={l.id}
                      className={cn(barberOffersListRowCardClass, "flex min-w-0 gap-3 py-2.5 sm:items-start sm:gap-4")}
                    >
                      {receiptSrc ? (
                        <AppImageThumb
                          src={receiptSrc}
                          alt="สลิป"
                          onOpen={() => receiptLightbox.open(receiptSrc)}
                          className="h-14 w-14 shrink-0 self-start rounded-[1.25rem] border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold tabular-nums text-[#2e2a58]">{l.customer.phone}</span>
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
                          {isCash && l.paymentMethod ? ` · ${barberPaymentMethodLabel(l.paymentMethod)}` : null}
                        </p>
                        {l.note ? (
                          <p className="line-clamp-2 text-xs leading-snug text-[#66638c]">{l.note}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:min-w-[5.5rem]">
                        {isCash ? (
                          <p
                            className={cn(
                              "text-right text-lg font-black tabular-nums leading-tight sm:text-xl",
                              amt != null ? "text-emerald-700" : "text-[#b4b0ce]",
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
                        <div
                          className={cn(barberIconToolbarGroupClass, "shrink-0")}
                          role="group"
                          aria-label="พิมพ์ แก้ไข หรือลบ"
                        >
                          {salePrintRow ? (
                            <AppIconToolbarButton
                              title="พิมพ์ใบเสร็จ / ใบกำกับภาษี"
                              ariaLabel={`พิมพ์เอกสารยอดขาย ${l.customer.phone}`}
                              onClick={() => setPrintRow(salePrintRow)}
                              className="text-[#4d47b6] hover:bg-[#ecebff] hover:text-[#2e2a58]"
                            >
                              <AppIconPrint className="h-3.5 w-3.5" />
                            </AppIconToolbarButton>
                          ) : null}
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
                "min-h-0 max-h-[min(70vh,40rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-[2rem] border border-white/55 bg-white/35 shadow-[0_16px_38px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-0",
                activeListTab !== "costs" && "hidden",
              )}
              role="tabpanel"
              aria-label="รายการต้นทุนและรายจ่าย"
            >
              {costsPanel}
            </div>
          ) : null}
        </div>
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
                <button type="button" onClick={() => closeEditModal()} className={barberModalCloseBtnClass} aria-label="ปิด">
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3 px-5 py-5">
                {editErr ? (
                  <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{editErr}</p>
                ) : null}
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  เวลาทำรายการ (เวลาไทย)
                  <input
                    type="datetime-local"
                    className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 py-2 text-sm"
                    value={editCreatedLocal}
                    onChange={(e) => setEditCreatedLocal(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  เบอร์โทร
                  <input
                    className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 py-2 text-base tabular-nums"
                    inputMode="numeric"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-[#4d47b6]">
                  ชื่อลูกค้า
                  <input
                    className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 py-2 text-sm"
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
                        className="mt-2 block w-full cursor-zoom-in rounded-[1.25rem] border border-transparent p-0 text-left focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4d47b6]/40"
                        onClick={() => receiptLightbox.open(receiptPickUrl)}
                        aria-label="ดูรูปสลิปใหม่เต็มจอ"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={receiptPickUrl}
                          alt="ตัวอย่างสลิปใหม่"
                          className="max-h-36 w-full rounded-[1.25rem] border border-[#ecebff] object-contain"
                        />
                      </button>
                    ) : resolvedEditReceipt ? (
                      <button
                        type="button"
                        className="mt-2 block w-full cursor-zoom-in rounded-[1.25rem] border border-transparent p-0 text-left focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4d47b6]/40"
                        onClick={() => receiptLightbox.open(resolvedEditReceipt)}
                        aria-label="ดูรูปสลิปปัจจุบันเต็มจอ"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolvedEditReceipt}
                          alt="สลิปปัจจุบัน"
                          className="max-h-36 w-full rounded-[1.25rem] border border-[#ecebff] object-contain"
                        />
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-[#8b87ad]">ยังไม่มีสลิป</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="app-btn-soft rounded-[1.25rem] px-3 py-2 text-xs font-semibold text-[#2e2a58]"
                        onClick={() => editReceiptInputRef.current?.click()}
                      >
                        เลือกรูปใหม่
                      </button>
                      {(editTarget.receiptImageUrl || editReceiptFile) && !editReceiptRemoved ? (
                        <button
                          type="button"
                          className="rounded-[1.25rem] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
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
                    className="app-input mt-1 min-h-[72px] w-full resize-y rounded-[1.25rem] px-3 py-2 text-sm"
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
                      className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-base tabular-nums"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="เว้นว่างได้"
                    />
                  </label>
                ) : (
                  <p className="rounded-[1.25rem] bg-[#f8f7ff] px-3 py-2 text-xs text-[#5f5a8a]">
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

      <AppImageLightbox src={receiptLightbox.src} onClose={receiptLightbox.close} alt="รูปสลิป" />

      <BarberMemberPrintModal
        open={Boolean(printRow)}
        row={printRow}
        shop={shopPrintProfile}
        preferTaxInvoice={Boolean(printRow?.customer.taxInvoiceEnabled)}
        onClose={() => setPrintRow(null)}
      />
    </div>
  );
}
