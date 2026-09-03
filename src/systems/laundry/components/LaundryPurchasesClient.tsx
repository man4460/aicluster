"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AppIconPencil,
  AppIconPrint,
  AppIconToolbarButton,
  AppIconTrash,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  LaundryMemberPrintModal,
  type LaundryMemberPrintRow,
} from "@/systems/laundry/components/LaundryMemberPrintModal";
import { LaundryPaymentPanel } from "@/systems/laundry/components/LaundryPaymentPanel";
import { LaundrySellPackageModal } from "@/systems/laundry/components/LaundrySellPackageModal";
import {
  LaundryTaxInvoiceFields,
  emptyLaundryTaxInvoiceForm,
  type LaundryTaxInvoiceFormValue,
} from "@/systems/laundry/components/LaundryTaxInvoiceFields";
import {
  isLaundryPaymentMethod,
  laundryPaymentMethodLabel,
  type LaundryPaymentMethod,
} from "@/systems/laundry/lib/payment-method";
import {
  laundryCardBodyPaddingXClass,
  laundryCardSurfaceRadiusClass,
  laundryDashboardSegmentBtnClass,
  laundryDashboardSegmentShellClass,
  laundryIconToolbarGroupClass,
  laundryInlineAlertErrorClass,
  laundryModalBackdropClass,
  laundryModalCloseBtnClass,
  laundryModalHeaderClass,
  laundryModalPanelLgClass,
  laundryModalSubtitleClass,
  laundryModalTitleClass,
  laundryMutedLoadingNoticeClass,
  laundryOffersEmptyStateClass,
  laundryOffersListRowCardClass,
  laundryOutlineButtonClass,
  laundryPageStackClass,
  laundryPrimaryButtonClass,
  laundryFieldClass,
  laundrySectionFirstClass,
  laundrySectionNextClass,
  laundryStatCardClass,
} from "@/systems/laundry/lib/ui-tokens";
import { useLaundryShopPrintProfile } from "@/systems/laundry/lib/use-laundry-shop-print-profile";

type RowCustomer = {
  id: number;
  phone: string;
  name: string | null;
  taxInvoiceEnabled?: boolean;
  billingName?: string;
  taxId?: string;
  taxAddress?: string;
  taxBranch?: string;
};

type Row = {
  id: number;
  createdAt: string;
  status: string;
  remainingSessions: number;
  saleReceiptImageUrl: string | null;
  paymentMethod: string | null;
  package: { id: number; name: string; price: string; totalSessions: number; imageUrl?: string | null };
  customer: RowCustomer;
};

type StatusFilterKey = "ALL" | "ACTIVE" | "EXHAUSTED" | "CANCELLED";

function statusLabel(s: string) {
  if (s === "ACTIVE") return "ใช้งาน";
  if (s === "EXHAUSTED") return "หมดแล้ว";
  if (s === "CANCELLED") return "ยกเลิก";
  return s;
}

function statusBadgeClass(s: string) {
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/90";
  if (s === "EXHAUSTED") return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  if (s === "CANCELLED") return "bg-rose-100 text-rose-900 ring-1 ring-rose-200/90";
  return "bg-[#ecebff] text-[#2e2a58] ring-1 ring-[#dcd8f0]";
}

function statusAccentGradient(s: string) {
  if (s === "ACTIVE") return "from-emerald-500 via-teal-500 to-[#0d9488]";
  if (s === "EXHAUSTED") return "from-slate-400 via-slate-500 to-slate-600";
  if (s === "CANCELLED") return "from-rose-500 via-pink-500 to-fuchsia-500";
  return "from-[#4338ca] via-[#5b61ff] to-[#0d9488]";
}

function formatPriceBaht(priceStr: string) {
  const n = Number(priceStr);
  if (!Number.isFinite(n)) return priceStr;
  return n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

const slipThumbClassName = cn(
  "self-start",
  laundryCardSurfaceRadiusClass,
  "border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35 sm:h-[4.5rem] sm:w-[4.5rem]",
);

const slipThumbCompactClassName = cn(
  "h-14 w-14 shrink-0 self-start",
  laundryCardSurfaceRadiusClass,
  "border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35",
);

function IconFilterFunnel({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export type LaundryPurchasesEmbeddedToolbarApi = {
  openSellModal: () => void;
  filterOpen: boolean;
  hasActiveFilters: boolean;
  toggleFilter: () => void;
};

type Props = {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: LaundryPurchasesEmbeddedToolbarApi | null) => void;
};

export function LaundryPurchasesClient({ embedded = false, onEmbeddedToolbar }: Props = {}) {
  const slipLightbox = useAppImageLightbox();
  const { profile: shopPrint } = useLaundryShopPrintProfile();
  const [printRow, setPrintRow] = useState<LaundryMemberPrintRow | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterPhone, setFilterPhone] = useState("");
  const [filterName, setFilterName] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("ALL");
  const [filterOpen, setFilterOpen] = useState(true);

  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [editRemain, setEditRemain] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "EXHAUSTED" | "CANCELLED">("ACTIVE");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<LaundryPaymentMethod>("CASH");
  const [editSlipUrl, setEditSlipUrl] = useState<string | null>(null);
  const [editTaxForm, setEditTaxForm] = useState<LaundryTaxInvoiceFormValue>(emptyLaundryTaxInvoiceForm());
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellNotice, setSellNotice] = useState<string | null>(null);

  const stats = useMemo(() => {
    const countActive = rows.filter((r) => r.status === "ACTIVE").length;
    const countExhausted = rows.filter((r) => r.status === "EXHAUSTED").length;
    const countCancelled = rows.filter((r) => r.status === "CANCELLED").length;
    let revenue = 0;
    for (const r of rows) {
      if (r.status !== "CANCELLED") {
        const n = Number(r.package.price);
        if (Number.isFinite(n)) revenue += n;
      }
    }
    return { countActive, countExhausted, countCancelled, revenue, countTotal: rows.length };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const phoneQ = filterPhone.replace(/\D/g, "");
    const nameQ = filterName.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (phoneQ.length > 0) {
        const p = r.customer.phone.replace(/\D/g, "");
        if (!p.includes(phoneQ)) return false;
      }
      if (nameQ.length > 0) {
        const n = (r.customer.name ?? "").toLowerCase();
        if (!n.includes(nameQ)) return false;
      }
      return true;
    });
  }, [rows, filterPhone, filterName, statusFilter]);

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    filterPhone.replace(/\D/g, "").length > 0 ||
    filterName.trim().length > 0;

  const statusChipOptions: { key: StatusFilterKey; label: string; count: number }[] = [
    { key: "ALL", label: "ทั้งหมด", count: stats.countTotal },
    { key: "ACTIVE", label: "ใช้งาน", count: stats.countActive },
    { key: "EXHAUSTED", label: "หมดแล้ว", count: stats.countExhausted },
    { key: "CANCELLED", label: "ยกเลิก", count: stats.countCancelled },
  ];

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/laundry/subscriptions?limit=150", {
      cache: "no-store",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { subscriptions?: Row[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setRows([]);
      return;
    }
    setRows(
      (data.subscriptions ?? []).map((r) => {
        const raw = r as Row & { sale_receipt_image_url?: string | null; payment_method?: string | null };
        return {
          ...r,
          saleReceiptImageUrl: raw.saleReceiptImageUrl ?? raw.sale_receipt_image_url ?? null,
          paymentMethod: raw.paymentMethod ?? raw.payment_method ?? null,
        };
      }),
    );
  }, []);

  function openEditModal(r: Row) {
    setEditErr(null);
    setEditTarget(r);
    setEditRemain(String(r.remainingSessions));
    setEditStatus(r.status === "EXHAUSTED" || r.status === "CANCELLED" ? r.status : "ACTIVE");
    setEditCustomerName(r.customer.name ?? "");
    setEditPaymentMethod(isLaundryPaymentMethod(r.paymentMethod) ? r.paymentMethod : "CASH");
    setEditSlipUrl(r.saleReceiptImageUrl?.trim() || null);
    setEditTaxForm({
      taxInvoiceEnabled: Boolean(r.customer.taxInvoiceEnabled),
      billingName: r.customer.billingName ?? "",
      taxId: r.customer.taxId ?? "",
      taxAddress: r.customer.taxAddress ?? "",
      taxBranch: r.customer.taxBranch ?? "",
    });
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditErr(null);
    setEditSaving(false);
    setEditSlipUrl(null);
  }

  useEffect(() => {
    if (!editTarget) return;
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
  }, [editTarget]);

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditErr(null);
    const remain = Number(editRemain);
    if (!Number.isInteger(remain) || remain < 0) {
      setEditErr("จำนวนครั้งคงเหลือต้องเป็นเลขจำนวนเต็ม ≥ 0");
      return;
    }
    setEditSaving(true);
    try {
      const originalSlip = editTarget.saleReceiptImageUrl?.trim() || null;
      const nextSlip =
        editPaymentMethod === "CASH" || editPaymentMethod === "CREDIT_CARD" ? null : editSlipUrl?.trim() || null;
      const body: Record<string, unknown> = {
        remainingSessions: remain,
        status: editStatus,
        customerName: editCustomerName.trim() || null,
        paymentMethod: editPaymentMethod,
        taxInvoiceEnabled: editTaxForm.taxInvoiceEnabled,
        billingName: editTaxForm.billingName.trim() || null,
        taxId: editTaxForm.taxId.trim() || null,
        taxAddress: editTaxForm.taxAddress.trim() || null,
        taxBranch: editTaxForm.taxBranch.trim() || null,
      };
      if (nextSlip !== originalSlip) {
        body.saleReceiptImageUrl = nextSlip;
      }

      const res = await fetch(`/api/laundry/subscriptions/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setEditErr(data.error ?? "แก้ไขไม่สำเร็จ");
        return;
      }
      closeEditModal();
      await load();
    } finally {
      setEditSaving(false);
    }
  }

  async function removeRow(r: Row) {
    if (!confirm(`ลบผู้ซื้อแพ็กเกจ #${r.id} (${r.customer.phone}) ?`)) return;
    const res = await fetch(`/api/laundry/subscriptions/${r.id}`, {
      method: "DELETE",
      cache: "no-store",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await load();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const openSellModal = useCallback(() => {
    setSellNotice(null);
    setSellModalOpen(true);
  }, []);

  const toggleFilter = useCallback(() => {
    setFilterOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      openSellModal,
      filterOpen,
      hasActiveFilters,
      toggleFilter,
    });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, openSellModal, filterOpen, hasActiveFilters, toggleFilter]);

  function renderRow(r: Row, compact: boolean) {
    const total = Math.max(1, Number(r.package.totalSessions) || 1);
    const remain = Math.max(0, Math.min(total, r.remainingSessions));
    const pct = Math.max(0, Math.min(100, Math.round((remain / total) * 100)));
    const isUsedUp = remain === 0 || r.status === "EXHAUSTED";
    const boughtAt = new Date(r.createdAt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const pkgImage = r.package.imageUrl?.trim() || null;
    const slip = r.saleReceiptImageUrl?.trim() || null;

    return (
      <li
        key={r.id}
        className={cn(
          laundryOffersListRowCardClass,
          "group/item relative overflow-hidden",
          compact ? "!px-3 py-2.5" : "py-3 pr-3 sm:py-2.5 sm:pr-4",
          r.status === "ACTIVE" && "border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/25",
          r.status === "EXHAUSTED" && "border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-zinc-50/30",
          r.status === "CANCELLED" && "border-rose-200/70 bg-gradient-to-br from-white via-rose-50/35 to-pink-50/25",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b opacity-90",
            statusAccentGradient(r.status),
          )}
        />
        <div className={cn("flex min-w-0 gap-2.5", compact ? "pl-2" : "gap-3 pl-3 sm:gap-4 sm:pl-4")}>
          <AppImageThumb
            src={slip}
            alt={slip ? "สลิปขายแพ็กเกจ" : ""}
            emptyLabel="ไม่มีสลิป"
            onOpen={slip ? () => slipLightbox.open(slip) : undefined}
            className={compact ? slipThumbCompactClassName : cn(slipThumbClassName, "shrink-0")}
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span className="text-sm font-black tabular-nums text-[#1e1b4b]">{r.customer.phone}</span>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold", statusBadgeClass(r.status))}>
                    {statusLabel(r.status)}
                  </span>
                </div>
                {r.customer.name ? (
                  <p className="truncate text-[11px] font-semibold text-[#5f5a8a]">{r.customer.name}</p>
                ) : null}
              </div>
              <div className={cn(laundryIconToolbarGroupClass, "shrink-0")} role="group" aria-label="พิมพ์ แก้ไข หรือลบ">
                {Number(r.package.price) > 0 ?
                  <AppIconToolbarButton
                    title="พิมพ์"
                    ariaLabel="พิมพ์ใบเสร็จหรือใบกำกับภาษี"
                    onClick={() => setPrintRow(rowToPrintRow(r))}
                  >
                    <AppIconPrint className="h-3.5 w-3.5" />
                  </AppIconToolbarButton>
                : null}
                <AppIconToolbarButton title="แก้ไข" ariaLabel="แก้ไขสมาชิกแพ็กเกจ" onClick={() => openEditModal(r)}>
                  <AppIconPencil className="h-3.5 w-3.5" />
                </AppIconToolbarButton>
                <AppIconToolbarButton
                  title="ลบ"
                  ariaLabel="ลบ"
                  onClick={() => void removeRow(r)}
                  className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
                >
                  <AppIconTrash className="h-3.5 w-3.5" />
                </AppIconToolbarButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
              <div className="flex min-w-0 items-center gap-1.5">
                {pkgImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pkgImage} alt="" className="h-6 w-6 shrink-0 rounded-lg object-cover ring-1 ring-white shadow-sm" />
                ) : null}
                <p className="min-w-0 truncate text-xs font-black text-[#4d47b6]">{r.package.name}</p>
              </div>
              <p className="shrink-0 text-sm font-black tabular-nums text-[#1e1b4b]">
                <span className="mr-0.5 text-[10px] font-bold text-[#8b87ad]">฿</span>
                {formatPriceBaht(r.package.price)}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span
                className={cn(
                  "tabular-nums",
                  isUsedUp ? "text-slate-500" : r.status === "CANCELLED" ? "text-rose-600" : "text-[#4d47b6]",
                )}
              >
                {r.remainingSessions}/{r.package.totalSessions}
              </span>
              <div className="min-w-0 flex-1" aria-hidden>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-[#ecebff] ring-1 ring-inset ring-[#e8e6f4]/80">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      isUsedUp
                        ? "bg-slate-400"
                        : r.status === "CANCELLED"
                          ? "bg-rose-400"
                          : "bg-gradient-to-r from-[#4338ca] to-[#0d9488]",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="tabular-nums text-[#8b87ad]">{pct}%</span>
            </div>

            <p className="truncate text-[10px] leading-snug text-[#8b87ad]">
              {boughtAt}
              {r.paymentMethod ? ` · ${laundryPaymentMethodLabel(r.paymentMethod)}` : ""}
            </p>
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className={embedded ? "min-w-0 space-y-3" : laundryPageStackClass}>
      {sellNotice ? (
        <p className={cn(laundryCardSurfaceRadiusClass, "bg-emerald-50", laundryCardBodyPaddingXClass, "py-3 text-sm text-emerald-900")}>
          {sellNotice}
        </p>
      ) : null}
      {err ? <p className={laundryInlineAlertErrorClass}>{err}</p> : null}

      {loading ? (
        <p className={laundryMutedLoadingNoticeClass}>กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <section className={laundrySectionFirstClass} aria-label="ว่าง">
          {!embedded ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openSellModal}
                className={laundryPrimaryButtonClass}
              >
                ขายแพ็กเกจ
              </button>
            </div>
          ) : null}
          <p className={cn(laundryOffersEmptyStateClass, "py-8 text-center text-sm text-[#66638c]")}>ยังไม่มีการซื้อแพ็ก</p>
        </section>
      ) : (
        <>
          <section className={cn(embedded ? "min-w-0 space-y-3" : laundrySectionFirstClass, "min-w-0")} aria-label="ภาพรวมสมาชิกแพ็ก">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <div className={cn(laundryStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-violet-200/70 bg-gradient-to-br from-white via-violet-50/50 to-indigo-50/40")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700/80">สมาชิกทั้งหมด</p>
                <p className={cn("mt-1 bg-gradient-to-br from-[#4338ca] via-[#5b61ff] to-[#6366f1] bg-clip-text font-black tabular-nums leading-none text-transparent", embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]")}>
                  {stats.countTotal}
                </p>
              </div>
              <div className={cn(laundryStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/55 to-teal-50/40")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">ใช้งานอยู่</p>
                <p className={cn("mt-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-[#0d9488] bg-clip-text font-black tabular-nums leading-none text-transparent", embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]")}>
                  {stats.countActive}
                </p>
              </div>
              <div className={cn(laundryStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-zinc-50/50")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-slate-400 to-slate-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">หมดแล้ว</p>
                <p className={cn("mt-1 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 bg-clip-text font-black tabular-nums leading-none text-transparent", embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]")}>
                  {stats.countExhausted}
                </p>
              </div>
              <div className={cn(laundryStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-fuchsia-200/70 bg-gradient-to-br from-white via-fuchsia-50/45 to-pink-50/40")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-700/80">รายได้สะสม</p>
                <p className={cn("mt-1 flex items-baseline bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899] bg-clip-text font-black tabular-nums leading-none text-transparent", embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]")}>
                  <span className="mr-0.5 text-sm font-bold text-[#9b97b8]">฿</span>
                  {stats.revenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </section>

          <section className={cn(embedded ? "min-w-0 space-y-2.5" : laundrySectionNextClass)} aria-label="กรองรายการ">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
                {!embedded ?
                  <div className={cn(laundryDashboardSegmentShellClass, "max-w-full")} role="group" aria-label="เครื่องมือกรองสมาชิก">
                    <button
                      type="button"
                      onClick={toggleFilter}
                      aria-expanded={filterOpen}
                      aria-controls="laundry-purchases-filter-panel"
                      aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                      title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                      className={cn(
                        laundryDashboardSegmentBtnClass(filterOpen),
                        "relative min-h-[40px] min-w-[40px] sm:min-w-0",
                        hasActiveFilters && !filterOpen && "ring-1 ring-amber-300/80",
                      )}
                    >
                      <IconFilterFunnel className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                      {hasActiveFilters ?
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white" aria-hidden />
                      : null}
                    </button>
                  </div>
                : null}
                <p className="min-w-0 text-sm font-black tabular-nums text-[#2e2a58]">
                  {hasActiveFilters ? `${filteredRows.length}/${rows.length}` : rows.length} รายการ
                </p>
              </div>
              {!embedded ? (
                <button type="button" onClick={openSellModal} className={cn(laundryDashboardSegmentBtnClass(true), "min-h-[44px] px-4")}>
                  ขายแพ็กเกจ
                </button>
              ) : null}
            </div>

            <div id="laundry-purchases-filter-panel" className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
              <div className={cn(laundryDashboardSegmentShellClass, "w-full flex-wrap justify-start")} role="tablist" aria-label="กรองตามสถานะ">
                {statusChipOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    className={laundryDashboardSegmentBtnClass(statusFilter === opt.key)}
                  >
                    {opt.label} ({opt.count})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[14rem]" htmlFor="laundry-purchase-filter-phone">
                  <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
                  <input
                    id="laundry-purchase-filter-phone"
                    className={cn(laundryFieldClass, "mt-1")}
                    inputMode="numeric"
                    placeholder="เช่น 081..."
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  />
                </label>
                <label className="min-w-0 flex-1 sm:max-w-[16rem]" htmlFor="laundry-purchase-filter-name">
                  <span className="text-xs font-bold text-[#4d47b6]">ชื่อลูกค้า</span>
                  <input
                    id="laundry-purchase-filter-name"
                    className={cn(laundryFieldClass, "mt-1")}
                    placeholder="ค้นหาบางส่วนได้"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                </label>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPhone("");
                      setFilterName("");
                      setStatusFilter("ALL");
                    }}
                    className={cn(laundryDashboardSegmentBtnClass(false), "h-11 min-h-[44px] px-4")}
                  >
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {filteredRows.length === 0 ? (
            <p className={cn(laundryOffersEmptyStateClass, "py-8 text-center text-sm text-amber-950")}>ไม่พบรายการ — ปรับตัวกรอง</p>
          ) : (
            <ul className={embedded ? "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2.5"}>
              {filteredRows.map((r) => renderRow(r, embedded))}
            </ul>
          )}
        </>
      )}

      <AppImageLightbox src={slipLightbox.src} onClose={slipLightbox.close} />

      <LaundrySellPackageModal
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        onSuccess={async (r) => {
          const warn = r.warning?.trim();
          setSellNotice(
            warn
              ? `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัส #${r.subscriptionId ?? ""} · ${warn}`
              : `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัส #${r.subscriptionId ?? ""}`,
          );
          await load();
        }}
      />

      {editTarget ? (
        <div className={laundryModalBackdropClass} role="presentation" onClick={() => closeEditModal()}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="laundry-purchase-edit-title"
            className={laundryModalPanelLgClass}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={laundryModalHeaderClass}>
              <div className="min-w-0">
                <h2 id="laundry-purchase-edit-title" className={laundryModalTitleClass}>
                  แก้ไขสมาชิกแพ็ก
                </h2>
                <p className={cn(laundryModalSubtitleClass, "truncate tabular-nums")}>{editTarget.customer.phone}</p>
                <p className="truncate text-xs font-medium text-[#4d47b6]">{editTarget.package.name}</p>
              </div>
              <button type="button" onClick={() => closeEditModal()} className={laundryModalCloseBtnClass} aria-label="ปิด">
                ✕
              </button>
            </div>
            <form onSubmit={(e) => void submitEdit(e)} className="grid max-h-[min(78vh,40rem)] gap-3 overflow-y-auto px-5 py-5">
              {editErr ? (
                <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{editErr}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อลูกค้า (ไม่บังคับ)
                <input
                  className={cn(laundryFieldClass, "mt-1")}
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value.slice(0, 100))}
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                จำนวนครั้งคงเหลือ
                <input
                  type="number"
                  min={0}
                  max={9999}
                  className={cn(laundryFieldClass, "mt-1 tabular-nums")}
                  value={editRemain}
                  onChange={(e) => setEditRemain(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                สถานะ
                <select
                  className={cn(laundryFieldClass, "mt-1")}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                >
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="EXHAUSTED">หมดแล้ว</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </label>
              <p className="rounded-[1.25rem] bg-[#f8f7ff] px-3 py-2 text-[11px] leading-relaxed text-[#5f5a8a]">
                แพ็ก {editTarget.package.totalSessions} ครั้ง · ราคา ฿{formatPriceBaht(editTarget.package.price)} (อ่านอย่างเดียว)
              </p>
              <LaundryTaxInvoiceFields value={editTaxForm} onChange={setEditTaxForm} fallbackName={editCustomerName} disabled={editSaving} />
              <LaundryPaymentPanel
                amountBaht={Number(editTarget.package.price) || 0}
                method={editPaymentMethod}
                slipUrl={editSlipUrl}
                onMethodChange={setEditPaymentMethod}
                onSlipUrlChange={setEditSlipUrl}
                disabled={editSaving}
              />
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeEditModal()}
                  className={cn(laundryOutlineButtonClass, "w-full sm:w-auto")}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className={cn(laundryPrimaryButtonClass, "w-full sm:w-auto")}
                >
                  {editSaving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <LaundryMemberPrintModal
        open={Boolean(printRow)}
        row={printRow}
        shop={shopPrint}
        onClose={() => setPrintRow(null)}
      />
    </div>
  );
}

function rowToPrintRow(r: Row): LaundryMemberPrintRow {
  return {
    id: r.id,
    createdAt: r.createdAt,
    remainingSessions: r.remainingSessions,
    paymentMethod: r.paymentMethod,
    package: {
      name: r.package.name,
      price: r.package.price,
      totalSessions: r.package.totalSessions,
    },
    customer: {
      phone: r.customer.phone,
      name: r.customer.name,
      taxInvoiceEnabled: r.customer.taxInvoiceEnabled,
      billingName: r.customer.billingName,
      taxId: r.customer.taxId,
      taxAddress: r.customer.taxAddress,
      taxBranch: r.customer.taxBranch,
    },
  };
}
