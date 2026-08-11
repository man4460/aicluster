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
import {
  appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberMemberPrintModal } from "@/systems/barber/components/BarberMemberPrintModal";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import { BarberPaymentPanel } from "@/systems/barber/components/BarberPaymentPanel";
import { BarberSellPackageModal } from "@/systems/barber/components/BarberSellPackageModal";
import {
  BarberTaxInvoiceFields,
  emptyBarberTaxInvoiceForm,
  type BarberTaxInvoiceFormValue,
} from "@/systems/barber/components/BarberTaxInvoiceFields";
import {
  barberCardSurfaceRadiusClass,
  barberCardBodyPaddingXClass,
  barberDashboardSegmentBtnClass,
  barberDashboardSegmentShellClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberOffersEmptyStateClass,
  barberOffersListRowCardClass,
  barberMutedLoadingNoticeClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
  barberSectionNextClass,
  barberStatCardClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { useBarberSubscriptionSaleReceiptBlobUrl } from "@/systems/barber/hooks/use-barber-subscription-sale-receipt-blob-url";
import type { BarberPrintShopProfile } from "@/systems/barber/lib/barber-print-docs";
import {
  barberPaymentMethodLabel,
  isBarberPaymentMethod,
  type BarberPaymentMethod,
} from "@/systems/barber/lib/payment-method";

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
  soldByStylist: { id: number; name: string } | null;
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

const slipThumbClassName =
  `self-start ${barberCardSurfaceRadiusClass} border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35 sm:h-[4.5rem] sm:w-[4.5rem]`;

const slipThumbCompactClassName =
  `h-14 w-14 shrink-0 self-start ${barberCardSurfaceRadiusClass} border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35`;

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

function BarberPurchaseSlipCell(props: {
  row: Row;
  className: string;
  onOpenLightbox: (src: string) => void;
}) {
  const { row, className, onOpenLightbox } = props;
  const { displaySrc, loading } = useBarberSubscriptionSaleReceiptBlobUrl(row.id, row.saleReceiptImageUrl);
  const hasHint = Boolean(row.saleReceiptImageUrl?.trim());

  if (!hasHint) {
    return <AppImageThumb src={null} emptyLabel="ไม่มีสลิป" className={className} />;
  }

  if (loading) {
    return (
      <div
        className={cn(
          className,
          "flex items-center justify-center text-[11px] font-medium text-[#8b87ad]",
        )}
        aria-hidden
      >
        โหลด…
      </div>
    );
  }

  return (
    <AppImageThumb
      src={displaySrc}
      alt={displaySrc ? "สลิปขายแพ็กเกจ" : ""}
      emptyLabel="ไม่มีสลิป"
      onOpen={displaySrc ? () => onOpenLightbox(displaySrc) : undefined}
      className={className}
    />
  );
}

export type BarberPurchasesEmbeddedToolbarApi = {
  openSellModal: () => void;
};

type BarberPurchasesClientProps = {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: BarberPurchasesEmbeddedToolbarApi | null) => void;
};

export function BarberPurchasesClient({
  embedded = false,
  onEmbeddedToolbar,
}: BarberPurchasesClientProps = {}) {
  const slipLightbox = useAppImageLightbox();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterPhone, setFilterPhone] = useState("");
  const [filterName, setFilterName] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("ALL");

  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [editRemain, setEditRemain] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "EXHAUSTED" | "CANCELLED">("ACTIVE");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<BarberPaymentMethod>("CASH");
  const [editSlipUrl, setEditSlipUrl] = useState<string | null>(null);
  const [editTaxForm, setEditTaxForm] = useState<BarberTaxInvoiceFormValue>(emptyBarberTaxInvoiceForm());
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellNotice, setSellNotice] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [printRow, setPrintRow] = useState<Row | null>(null);
  const [shopProfile, setShopProfile] = useState<BarberPrintShopProfile | null>(null);

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
    const res = await fetch("/api/barber/subscriptions?limit=150", {
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
        const slip = raw.saleReceiptImageUrl ?? raw.sale_receipt_image_url ?? null;
        return {
          ...r,
          saleReceiptImageUrl: slip,
          paymentMethod: raw.paymentMethod ?? raw.payment_method ?? null,
        };
      }),
    );
  }, []);

  function openEditModal(r: Row) {
    setEditErr(null);
    setEditTarget(r);
    setEditRemain(String(r.remainingSessions));
    setEditStatus(
      r.status === "EXHAUSTED" || r.status === "CANCELLED" ? r.status : "ACTIVE",
    );
    setEditCustomerName(r.customer.name ?? "");
    setEditPaymentMethod(isBarberPaymentMethod(r.paymentMethod) ? r.paymentMethod : "CASH");
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
    void fetch("/api/barber/shop-profile", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { profile?: BarberPrintShopProfile }) => {
        if (d.profile) setShopProfile(d.profile);
      })
      .catch(() => {});
  }, []);

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
        editPaymentMethod === "CASH" || editPaymentMethod === "CREDIT_CARD"
          ? null
          : editSlipUrl?.trim() || null;
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

      const res = await fetch(`/api/barber/subscriptions/${editTarget.id}`, {
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
    const res = await fetch(`/api/barber/subscriptions/${r.id}`, {
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

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({ openSellModal });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, openSellModal]);

  return (
    <div className={embedded ? "min-w-0 space-y-3" : barberPageStackClass}>
      {sellNotice ? (
        <p className={`${barberCardSurfaceRadiusClass} bg-emerald-50 ${barberCardBodyPaddingXClass} py-3 text-sm text-emerald-900`}>
          {sellNotice}
        </p>
      ) : null}
      {err ? <p className={barberInlineAlertErrorClass}>{err}</p> : null}
      {loading ? (
        <>
          {!embedded ? (
            <section className={barberSectionFirstClass} aria-label="เครื่องมือ">
              <div className={cn(barberSectionActionsRowClass, "w-full justify-end sm:ml-auto sm:w-auto")}>
                <BarberDashboardBackLink />
                <button
                  type="button"
                  onClick={openSellModal}
                  className={`app-btn-primary inline-flex min-h-[44px] items-center justify-center ${barberCardSurfaceRadiusClass} px-4 py-2.5 text-center text-sm font-semibold text-white`}
                >
                  ขายแพ็กเกจ
                </button>
              </div>
            </section>
          ) : null}
          <p className={barberMutedLoadingNoticeClass}>กำลังโหลด…</p>
        </>
      ) : rows.length === 0 ? (
        <section className={barberSectionFirstClass} aria-label="ว่าง">
          {!embedded ? (
            <div className={cn(barberSectionActionsRowClass, "w-full justify-end sm:ml-auto sm:w-auto")}>
              <BarberDashboardBackLink />
              <button
                type="button"
                onClick={openSellModal}
                      className={`app-btn-primary inline-flex min-h-[44px] items-center justify-center ${barberCardSurfaceRadiusClass} px-4 py-2.5 text-center text-sm font-semibold text-white`}
              >
                ขายแพ็กเกจ
              </button>
            </div>
          ) : null}
          <p className={`${barberOffersEmptyStateClass} text-center text-sm text-[#66638c]`}>
            ยังไม่มีการซื้อแพ็ก
          </p>
        </section>
      ) : (
        <>
          <section className={cn(embedded ? "min-w-0 space-y-3" : barberSectionFirstClass, "min-w-0")} aria-label="ภาพรวมสมาชิกแพ็กเกจ">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <div
                className={cn(
                  barberStatCardClass,
                  embedded && "min-h-0 p-3",
                  "relative overflow-hidden border-violet-200/70 bg-gradient-to-br from-white via-violet-50/50 to-indigo-50/40",
                )}
              >
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-700/80">สมาชิกทั้งหมด</p>
                <p className={cn(
                  "mt-1 bg-gradient-to-br from-[#4338ca] via-[#5b61ff] to-[#6366f1] bg-clip-text font-black tabular-nums leading-none text-transparent",
                  embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]",
                )}>
                  {stats.countTotal}
                  <span className="ml-1 text-sm font-bold text-[#8b87ad]">ราย</span>
                </p>
                <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-violet-300/40 via-indigo-200/30 to-transparent blur-2xl" />
              </div>
              <div className={cn(barberStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/55 to-teal-50/40")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">ใช้งานอยู่</p>
                <p className={cn(
                  "mt-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-[#0d9488] bg-clip-text font-black tabular-nums leading-none text-transparent",
                  embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]",
                )}>
                  {stats.countActive}
                  <span className="ml-1 text-sm font-bold text-[#7a9e96]">ราย</span>
                </p>
                <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-300/45 via-teal-200/30 to-transparent blur-2xl" />
              </div>
              <div className={cn(barberStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-zinc-50/50")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-slate-400 to-slate-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">หมดแล้ว</p>
                <p className={cn(
                  "mt-1 bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 bg-clip-text font-black tabular-nums leading-none text-transparent",
                  embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]",
                )}>
                  {stats.countExhausted}
                  <span className="ml-1 text-sm font-bold text-[#a5a9b2]">ราย</span>
                </p>
                <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-slate-300/40 via-zinc-200/30 to-transparent blur-2xl" />
              </div>
              <div className={cn(barberStatCardClass, embedded && "min-h-0 p-3", "relative overflow-hidden border-fuchsia-200/70 bg-gradient-to-br from-white via-fuchsia-50/45 to-pink-50/40")}>
                <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-700/80">รายได้สะสม</p>
                <p className={cn(
                  "mt-1 flex items-baseline bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899] bg-clip-text font-black tabular-nums leading-none text-transparent",
                  embedded ? "text-xl" : "text-2xl sm:text-[1.8rem]",
                )}>
                  <span className="mr-0.5 text-sm font-bold text-[#9b97b8]">฿</span>
                  {stats.revenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                </p>
                <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-fuchsia-300/40 via-pink-200/30 to-transparent blur-2xl" />
              </div>
            </div>
          </section>

          <section className={cn(embedded ? "min-w-0 space-y-2.5" : barberSectionNextClass)} aria-label="กรองรายการ">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
                <div className={cn(barberDashboardSegmentShellClass, "max-w-full")} role="group" aria-label="เครื่องมือกรองสมาชิก">
                  <button
                    type="button"
                    onClick={() => setFilterOpen((o) => !o)}
                    aria-expanded={filterOpen}
                    aria-controls="barber-purchases-filter-panel"
                    aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                    title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                    className={cn(
                      barberDashboardSegmentBtnClass(filterOpen),
                      "relative",
                      hasActiveFilters && !filterOpen && "ring-1 ring-amber-300/80",
                    )}
                  >
                    <IconFilterFunnel className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                    {hasActiveFilters ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </div>
                <p className="min-w-0 text-sm font-black tabular-nums text-[#2e2a58]">
                  <span className="sr-only">
                    {hasActiveFilters ?
                      `แสดง ${filteredRows.length} จาก ${rows.length} รายการ`
                    : `ทั้งหมด ${rows.length} รายการ`}
                  </span>
                  <span aria-hidden className="inline-flex items-baseline gap-0.5">
                    {hasActiveFilters ?
                      <>
                        <span className="bg-gradient-to-r from-[#4338ca] to-[#5b61ff] bg-clip-text text-transparent">
                          {filteredRows.length}
                        </span>
                        <span className="text-xs font-bold text-[#8b87ad]">/{rows.length}</span>
                      </>
                    : (
                      <span className="bg-gradient-to-r from-[#4338ca] to-[#0d9488] bg-clip-text text-transparent">
                        {rows.length}
                      </span>
                    )}
                    <span className="ml-1 text-xs font-bold text-[#8b87ad]">รายการ</span>
                  </span>
                </p>
              </div>
              {!embedded ?
                <div className={cn(barberSectionActionsRowClass, "shrink-0")}>
                  <BarberDashboardBackLink />
                  <div className={barberDashboardSegmentShellClass} role="group">
                    <button
                      type="button"
                      onClick={openSellModal}
                      className={barberDashboardSegmentBtnClass(true)}
                      aria-label="ขายแพ็กเกจ"
                    >
                      ขายแพ็กเกจ
                    </button>
                  </div>
                </div>
              : null}
            </div>

            <div
              id="barber-purchases-filter-panel"
              className={cn("space-y-3", filterOpen ? "block" : "hidden")}
            >
              <div
                className={cn(barberDashboardSegmentShellClass, "w-full flex-wrap justify-start")}
                role="tablist"
                aria-label="กรองตามสถานะ"
              >
                {statusChipOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    suppressHydrationWarning
                    className={barberDashboardSegmentBtnClass(statusFilter === opt.key)}
                  >
                    <span className="inline-flex items-baseline gap-1">
                      {opt.label}
                      <span
                        aria-hidden
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                          statusFilter === opt.key ? "bg-white/25 text-white/95" : "bg-[#e8e6fc]/80 text-[#4d47b6]",
                        )}
                      >
                        {opt.count}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[14rem]" htmlFor="purchase-filter-phone">
                  <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
                  <input
                    id="purchase-filter-phone"
                    className="app-input mt-1 min-h-[44px] w-full rounded-[1.25rem] px-3 py-2 text-base placeholder:text-[#8b87ad]"
                    inputMode="numeric"
                    placeholder="เช่น 081..."
                    autoComplete="tel"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  />
                </label>
                <label className="min-w-0 flex-1 sm:max-w-[16rem]" htmlFor="purchase-filter-name">
                  <span className="text-xs font-bold text-[#4d47b6]">ชื่อลูกค้า</span>
                  <input
                    id="purchase-filter-name"
                    className="app-input mt-1 min-h-[44px] w-full rounded-[1.25rem] px-3 py-2 text-base placeholder:text-[#8b87ad]"
                    placeholder="ค้นหาบางส่วนได้"
                    autoComplete="name"
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
                    className={cn(barberDashboardSegmentBtnClass(false), "h-11 min-h-[44px] px-4")}
                    aria-label="ล้างตัวกรอง"
                  >
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {filteredRows.length === 0 ? (
            <section className={cn(embedded ? "min-w-0" : barberSectionNextClass)} aria-label="ไม่พบ">
              <p
                className={`${barberCardSurfaceRadiusClass} border border-dashed border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/40 ${barberCardBodyPaddingXClass} py-8 text-center text-sm font-medium text-amber-950`}
              >
                ไม่พบรายการ — ปรับตัวกรอง
              </p>
            </section>
          ) : (
            <section className={cn(embedded ? "min-w-0" : barberSectionNextClass, "min-w-0")} aria-label="รายการสมาชิก">
              {!embedded ? (
                <p className="mb-3 text-xs leading-snug text-[#5f5a8a]">
                  <span className="text-[#6366f1]">คลิกรูปสลิป</span> ซ้ายเพื่อขยาย
                </p>
              ) : null}
              <ul
                className={
                  embedded
                    ? "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-2.5"
                }
              >
                {filteredRows.map((r) => {
                  const total = Math.max(1, Number(r.package.totalSessions) || 1);
                  const remain = Math.max(0, Math.min(total, r.remainingSessions));
                  const pct = Math.max(0, Math.min(100, Math.round((remain / total) * 100)));
                  const used = Math.max(0, total - remain);
                  const isUsedUp = remain === 0 || r.status === "EXHAUSTED";
                  const boughtAt = new Date(r.createdAt).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  if (embedded) {
                    const pkgImage = r.package.imageUrl?.trim() || null;
                    return (
                      <li
                        key={r.id}
                        className={cn(
                          barberOffersListRowCardClass,
                          "group/item relative overflow-hidden !px-3 py-2.5",
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
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-70",
                            r.status === "ACTIVE" && "bg-emerald-300/35",
                            r.status === "EXHAUSTED" && "bg-slate-300/35",
                            r.status === "CANCELLED" && "bg-rose-300/35",
                            !["ACTIVE", "EXHAUSTED", "CANCELLED"].includes(r.status) && "bg-indigo-300/30",
                          )}
                        />
                        <div className="flex min-w-0 gap-2.5 pl-2">
                          <BarberPurchaseSlipCell
                            row={r}
                            className={slipThumbCompactClassName}
                            onOpenLightbox={(src) => slipLightbox.open(src)}
                          />
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                  <span className="text-sm font-black tabular-nums text-[#1e1b4b]">
                                    {r.customer.phone}
                                  </span>
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold",
                                      statusBadgeClass(r.status),
                                    )}
                                  >
                                    {statusLabel(r.status)}
                                  </span>
                                </div>
                                {r.customer.name ? (
                                  <p className="truncate text-[11px] font-semibold text-[#5f5a8a]">
                                    {r.customer.name}
                                  </p>
                                ) : null}
                              </div>
                              <div
                                className={cn(barberIconToolbarGroupClass, "shrink-0")}
                                role="group"
                                aria-label="แก้ไขหรือลบ"
                              >
                                {Number(r.package.price) > 0 ? (
                                  <AppIconToolbarButton
                                    title="พิมพ์"
                                    ariaLabel="พิมพ์ใบเสร็จหรือใบกำกับภาษี"
                                    onClick={() => setPrintRow(r)}
                                  >
                                    <AppIconPrint className="h-3.5 w-3.5" />
                                  </AppIconToolbarButton>
                                ) : null}
                                <AppIconToolbarButton
                                  title="แก้ไข"
                                  ariaLabel="แก้ไขสมาชิกแพ็กเกจ"
                                  onClick={() => openEditModal(r)}
                                >
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
                                  <img
                                    src={pkgImage}
                                    alt=""
                                    className="h-6 w-6 shrink-0 rounded-lg object-cover ring-1 ring-white shadow-sm"
                                  />
                                ) : null}
                                <p className="min-w-0 truncate text-xs font-black text-[#4d47b6]">
                                  {r.package.name}
                                </p>
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
                                  isUsedUp
                                    ? "text-slate-500"
                                    : r.status === "CANCELLED"
                                      ? "text-rose-600"
                                      : "text-[#4d47b6]",
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
                              {" · "}
                              {r.soldByStylist?.name ?? "—"}
                              {r.paymentMethod
                                ? ` · ${barberPaymentMethodLabel(r.paymentMethod)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={r.id}
                      className={cn(
                        barberOffersListRowCardClass,
                        "group/item relative overflow-hidden py-3 pr-3 sm:py-2.5 sm:pr-4",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b opacity-90 transition-[width,opacity] duration-300 group-hover/item:w-1.5 group-hover/item:opacity-100",
                          statusAccentGradient(r.status),
                        )}
                      />
                      <div className="flex min-w-0 gap-3 sm:gap-4 pl-3 sm:pl-4">
                        <BarberPurchaseSlipCell
                          row={r}
                          className={cn(slipThumbClassName, "shrink-0")}
                          onOpenLightbox={(src) => slipLightbox.open(src)}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-sm font-black tabular-nums tracking-tight text-[#1e1b4b] sm:text-[15px]">
                                  {r.customer.phone}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold",
                                    statusBadgeClass(r.status),
                                  )}
                                >
                                  {statusLabel(r.status)}
                                </span>
                              </div>
                              {r.customer.name ? (
                                <p className="truncate text-xs font-semibold text-[#5f5a8a]">{r.customer.name}</p>
                              ) : null}
                              <p className="truncate bg-gradient-to-r from-[#4338ca] via-[#5b61ff] to-[#6366f1] bg-clip-text text-sm font-black text-transparent">
                                {r.package.name}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[1.15rem] font-black tabular-nums leading-none text-[#1e1b4b] sm:text-[1.4rem]">
                                <span className="mr-0.5 text-xs font-bold text-[#8b87ad]">฿</span>
                                {formatPriceBaht(r.package.price)}
                              </p>
                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8b87ad]">
                                ราคาต่อแพ็ก
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                              <div className="inline-flex items-baseline gap-1 text-[#66638c]">
                                <span className="uppercase tracking-wide">ใช้ไป</span>
                                <span
                                  className={cn(
                                    "tabular-nums",
                                    used > 0 ? "text-[#f59e0b]" : "text-[#9b97b8]",
                                  )}
                                >
                                  {used}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1" aria-hidden>
                                <div className="relative h-2 overflow-hidden rounded-full bg-gradient-to-r from-slate-100 via-[#ecebff] to-slate-100 ring-1 ring-inset ring-[#e8e6f4]/80">
                                  <div
                                    className={cn(
                                      "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
                                      isUsedUp
                                        ? "bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600"
                                        : r.status === "CANCELLED"
                                          ? "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500"
                                          : "bg-gradient-to-r from-[#4338ca] via-[#5b61ff] to-[#0d9488]",
                                    )}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                              <div className="inline-flex items-baseline gap-1">
                                <span className="tabular-nums text-[#4d47b6]">
                                  {pct}%
                                </span>
                                <span className="uppercase tracking-wide text-[#66638c]">คงเหลือ</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-[1.15rem] bg-gradient-to-r from-[#faf9ff] via-white to-[#f0fdfa]/45 px-3 py-2 ring-1 ring-inset ring-[#ecebff]/60">
                              <div className="inline-flex items-baseline gap-1.5">
                                <span
                                  aria-hidden
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-xl text-white shadow-sm",
                                    isUsedUp
                                      ? "bg-gradient-to-br from-slate-500 to-slate-600"
                                      : r.status === "CANCELLED"
                                        ? "bg-gradient-to-br from-rose-500 to-fuchsia-500"
                                        : cn(appDashboardBrandGradientFillClass),
                                  )}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-3.5 w-3.5" aria-hidden>
                                    <path d="M3 3v18h18" />
                                    <path d="M7 14l3-3 4 4 5-6" />
                                  </svg>
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">
                                  สถานะครั้ง
                                </span>
                              </div>
                              <div className="inline-flex items-baseline gap-1">
                                <span
                                  className={cn(
                                    "text-xl font-black tabular-nums leading-none sm:text-[1.4rem]",
                                    isUsedUp
                                      ? "text-slate-500"
                                      : r.status === "CANCELLED"
                                        ? "text-rose-600"
                                        : "bg-gradient-to-br from-[#4338ca] to-[#0d9488] bg-clip-text text-transparent",
                                  )}
                                >
                                  {r.remainingSessions}
                                </span>
                                <span className="text-sm font-bold text-[#9b97b8] sm:text-base">
                                  /{r.package.totalSessions}
                                </span>
                                <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                                  ครั้ง
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-start justify-between gap-2 border-t border-dashed border-[#ecebff]/90 pt-2">
                            <div className="min-w-0 space-y-0.5">
                              <p className="text-[11px] leading-snug text-[#8b87ad]">
                                <span className="font-semibold text-[#5f5a8a]">ซื้อเมื่อ</span>{" "}
                                {boughtAt}{" "}
                                · <span className="font-semibold text-[#4d47b6]">#{r.id}</span>
                              </p>
                              <p className="text-[11px] text-[#66638c]">
                                <span className="font-semibold text-[#5f5a8a]">ช่างขาย</span>:{" "}
                                <span className="font-semibold text-[#2e2a58]">{r.soldByStylist?.name ?? "—"}</span>
                                {r.paymentMethod ? (
                                  <>
                                    {" · "}
                                    <span className="font-semibold text-[#2e2a58]">
                                      {barberPaymentMethodLabel(r.paymentMethod)}
                                    </span>
                                  </>
                                ) : null}
                              </p>
                            </div>
                            <div
                              className={cn(barberIconToolbarGroupClass, "shrink-0")}
                              role="group"
                              aria-label="แก้ไขหรือลบ"
                            >
                              {Number(r.package.price) > 0 ? (
                                <AppIconToolbarButton
                                  title="พิมพ์"
                                  ariaLabel="พิมพ์ใบเสร็จหรือใบกำกับภาษี"
                                  onClick={() => setPrintRow(r)}
                                >
                                  <AppIconPrint className="h-3.5 w-3.5" />
                                </AppIconToolbarButton>
                              ) : null}
                              <AppIconToolbarButton
                                title="แก้ไข"
                                ariaLabel="แก้ไขสมาชิกแพ็กเกจ"
                                onClick={() => openEditModal(r)}
                              >
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
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <AppImageLightbox src={slipLightbox.src} onClose={slipLightbox.close} />

      <BarberSellPackageModal
        open={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        onSuccess={async (r) => {
          const warn = r.warning?.trim();
          setSellNotice(
            warn ?
              `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${r.subscriptionId ?? ""} · ${warn}`
            : `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${r.subscriptionId ?? ""}`,
          );
          await load();
          const slip = r.saleReceiptImageUrl?.trim();
          const sid = r.subscriptionId;
          if (sid != null && slip) {
            setRows((prev) =>
              prev.map((row) => (row.id === sid ? { ...row, saleReceiptImageUrl: slip } : row)),
            );
          }
        }}
      />

      {editTarget ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeEditModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-purchase-edit-title"
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-purchase-edit-title" className={barberModalTitleClass}>
                    แก้ไขสมาชิกแพ็กเกจ
                  </h2>
                  <p className={cn(barberModalSubtitleClass, "truncate tabular-nums")}>{editTarget.customer.phone}</p>
                  <p className="truncate text-xs font-medium text-[#4d47b6]">{editTarget.package.name}</p>
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
              <form onSubmit={(e) => void submitEdit(e)} className="grid max-h-[min(78vh,40rem)] gap-3 overflow-y-auto px-5 py-5">
              {editErr ? (
                <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{editErr}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อลูกค้า (ไม่บังคับ)
                <input
                  className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value.slice(0, 100))}
                  placeholder="ชื่อที่แสดงในร้าน"
                  maxLength={100}
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                จำนวนครั้งคงเหลือ
                <input
                  type="number"
                  min={0}
                  max={9999}
                  className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-base tabular-nums"
                  value={editRemain}
                  onChange={(e) => setEditRemain(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                สถานะ
                <select
                  className="app-input mt-1 w-full rounded-[1.25rem] px-3 py-2.5 text-sm"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                >
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="EXHAUSTED">หมดแล้ว</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </label>
              <p className="rounded-[1.25rem] bg-[#f8f7ff] px-3 py-2 text-[11px] leading-relaxed text-[#5f5a8a]">
                แพ็ก {editTarget.package.totalSessions} ครั้ง · ราคา ฿{formatPriceBaht(editTarget.package.price)} บาท (อ่านอย่างเดียว)
              </p>

              <BarberTaxInvoiceFields
                value={editTaxForm}
                onChange={setEditTaxForm}
                fallbackName={editCustomerName}
                disabled={editSaving}
              />

              <BarberPaymentPanel
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

      <BarberMemberPrintModal
        open={Boolean(printRow)}
        row={printRow}
        shop={shopProfile}
        preferTaxInvoice={Boolean(printRow?.customer.taxInvoiceEnabled)}
        onClose={() => setPrintRow(null)}
      />
    </div>
  );
}
