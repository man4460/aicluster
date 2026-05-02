"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AppIconPencil,
  AppIconToolbarButton,
  AppIconTrash,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import { BarberSellPackageModal } from "@/systems/barber/components/BarberSellPackageModal";
import {
  barberCardSurfaceRadiusClass,
  barberCardBodyPaddingXClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberOffersEmptyStateClass,
  barberOffersFilterBarClass,
  barberOffersListRowCardClass,
  barberMutedLoadingNoticeClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelMdClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
  barberSectionNextClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { useBarberSubscriptionSaleReceiptBlobUrl } from "@/systems/barber/hooks/use-barber-subscription-sale-receipt-blob-url";

type Row = {
  id: number;
  createdAt: string;
  status: string;
  remainingSessions: number;
  saleReceiptImageUrl: string | null;
  package: { id: number; name: string; price: string; totalSessions: number };
  customer: { id: number; phone: string; name: string | null };
  soldByStylist: { id: number; name: string } | null;
};

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

function formatPriceBaht(priceStr: string) {
  const n = Number(priceStr);
  if (!Number.isFinite(n)) return priceStr;
  return n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

const slipThumbClassName =
  `self-start ${barberCardSurfaceRadiusClass} border border-[#e0dcfa]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#eef2ff]/80 shadow-sm ring-1 ring-[#ecebff]/80 hover:ring-[#4d47b6]/35 sm:h-[4.5rem] sm:w-[4.5rem]`;

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

function BarberEditSlipPreview(props: {
  subscriptionId: number;
  saleReceiptImageUrl: string | null;
  imgClassName: string;
}) {
  const { subscriptionId, saleReceiptImageUrl, imgClassName } = props;
  const { displaySrc, loading } = useBarberSubscriptionSaleReceiptBlobUrl(
    subscriptionId,
    saleReceiptImageUrl,
  );
  const hasHint = Boolean(saleReceiptImageUrl?.trim());
  if (!hasHint) return null;
  if (loading) {
    return (
      <div
        className={cn(imgClassName, "flex items-center justify-center bg-[#f8f7ff] text-[10px] text-[#8b87ad]")}
      >
        โหลด…
      </div>
    );
  }
  if (!displaySrc) {
    return (
      <div
        className={cn(imgClassName, "flex items-center justify-center bg-amber-50 text-center text-[10px] text-amber-900")}
      >
        โหลดไม่สำเร็จ
      </div>
    );
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={displaySrc} alt="สลิปปัจจุบัน" className={imgClassName} />
    </>
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

  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [editRemain, setEditRemain] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "EXHAUSTED" | "CANCELLED">("ACTIVE");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editSlipFile, setEditSlipFile] = useState<File | null>(null);
  const [editRemoveSlip, setEditRemoveSlip] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellNotice, setSellNotice] = useState<string | null>(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [draftFilterPhone, setDraftFilterPhone] = useState("");
  const [draftFilterName, setDraftFilterName] = useState("");

  const filteredRows = useMemo(() => {
    const phoneQ = filterPhone.replace(/\D/g, "");
    const nameQ = filterName.trim().toLowerCase();
    return rows.filter((r) => {
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
  }, [rows, filterPhone, filterName]);

  const hasActiveFilters =
    filterPhone.replace(/\D/g, "").length > 0 || filterName.trim().length > 0;

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
        const raw = r as Row & { sale_receipt_image_url?: string | null };
        const slip = raw.saleReceiptImageUrl ?? raw.sale_receipt_image_url ?? null;
        return { ...r, saleReceiptImageUrl: slip };
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
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditErr(null);
    setEditSaving(false);
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

  const openFilterPopup = useCallback(() => {
    setDraftFilterPhone(filterPhone);
    setDraftFilterName(filterName);
    setFilterPopupOpen(true);
  }, [filterPhone, filterName]);

  const closeFilterPopup = useCallback(() => {
    setFilterPopupOpen(false);
  }, []);

  const applyFilterPopup = useCallback(() => {
    setFilterPhone(draftFilterPhone.replace(/\D/g, "").slice(0, 15));
    setFilterName(draftFilterName);
    setFilterPopupOpen(false);
  }, [draftFilterPhone, draftFilterName]);

  useEffect(() => {
    if (!filterPopupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterPopupOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterPopupOpen]);

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
      let saleReceiptImageUrl: string | null | undefined;
      if (editRemoveSlip) {
        saleReceiptImageUrl = null;
      } else if (editSlipFile) {
        const fd = new FormData();
        fd.append("file", editSlipFile);
        const up = await fetch("/api/barber/cash-receipt/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const upData = (await up.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!up.ok) {
          setEditErr(upData.error ?? "อัปโหลดสลิปไม่สำเร็จ");
          return;
        }
        if (!upData.imageUrl) {
          setEditErr("อัปโหลดสลิปไม่สำเร็จ");
          return;
        }
        saleReceiptImageUrl = upData.imageUrl;
      }

      const body: Record<string, unknown> = {
        remainingSessions: remain,
        status: editStatus,
        customerName: editCustomerName.trim() || null,
      };
      if (saleReceiptImageUrl !== undefined) {
        body.saleReceiptImageUrl = saleReceiptImageUrl;
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
    <div className={embedded ? "space-y-4 sm:space-y-5" : barberPageStackClass}>
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
          <section className={barberSectionFirstClass} aria-label="กรองรายการ">
            <div
              className={cn(
                barberOffersFilterBarClass,
                "flex flex-wrap items-center justify-between gap-3",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={openFilterPopup}
                  aria-haspopup="dialog"
                  aria-expanded={filterPopupOpen}
                  aria-controls="purchase-filter-dialog"
                  title="เปิดตัวกรอง"
                  className={cn(
                    `flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center ${barberCardSurfaceRadiusClass} bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] text-[#5b61ff] shadow-sm outline-none ring-1 ring-indigo-100/80 transition hover:from-[#e8ecff] hover:to-[#dde4ff] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35`,
                    hasActiveFilters && "ring-2 ring-[#5b61ff]/40",
                  )}
                >
                  <IconFilterFunnel className="h-[18px] w-[18px]" />
                </button>
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
                  <button
                    type="button"
                    onClick={openSellModal}
                    className={`app-btn-primary inline-flex min-h-[44px] items-center justify-center ${barberCardSurfaceRadiusClass} px-4 py-2.5 text-center text-sm font-semibold text-white`}
                  >
                    ขายแพ็กเกจ
                  </button>
                </div>
              : null}
            </div>
          </section>

          {filterPopupOpen ?
            <BarberModalPortal>
              <div
                className={barberModalBackdropClass}
                role="presentation"
                onClick={closeFilterPopup}
              >
                <div
                  id="purchase-filter-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="purchase-filter-dialog-title"
                  className={barberModalPanelMdClass}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={barberModalHeaderClass}>
                    <div className="min-w-0">
                      <h2 id="purchase-filter-dialog-title" className={barberModalTitleClass}>
                        กรองรายการ
                      </h2>
                      <p className={barberModalSubtitleClass}>เบอร์ · ชื่อ (ว่างได้)</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeFilterPopup}
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
                      applyFilterPopup();
                    }}
                  >
                    <label className="block text-xs font-semibold text-[#4d47b6]" htmlFor="purchase-filter-phone-popup">
                      เบอร์โทร
                      <input
                        id="purchase-filter-phone-popup"
                        className="app-input mt-1.5 min-h-[48px] w-full rounded-xl px-3 py-2 text-base placeholder:text-[#8b87ad]"
                        inputMode="numeric"
                        placeholder="เช่น 081..."
                        autoComplete="tel"
                        value={draftFilterPhone}
                        onChange={(e) => setDraftFilterPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#4d47b6]" htmlFor="purchase-filter-name-popup">
                      ชื่อลูกค้า
                      <input
                        id="purchase-filter-name-popup"
                        className="app-input mt-1.5 min-h-[48px] w-full rounded-xl px-3 py-2 text-base placeholder:text-[#8b87ad]"
                        placeholder="ค้นหาบางส่วนได้"
                        autoComplete="name"
                        value={draftFilterName}
                        onChange={(e) => setDraftFilterName(e.target.value)}
                      />
                    </label>
                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftFilterPhone("");
                          setDraftFilterName("");
                        }}
                        className={`app-btn-soft min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                      >
                        ล้าง
                      </button>
                      <button
                        type="button"
                        onClick={closeFilterPopup}
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

          {filteredRows.length === 0 ? (
            <section className={barberSectionNextClass} aria-label="ไม่พบ">
              <p
                className={`${barberCardSurfaceRadiusClass} border border-dashed border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/40 ${barberCardBodyPaddingXClass} py-8 text-center text-sm font-medium text-amber-950`}
              >
                ไม่พบรายการ — ปรับตัวกรอง
              </p>
            </section>
          ) : (
            <section className={barberSectionNextClass} aria-label="รายการสมาชิก">
              <p className="mb-3 text-xs leading-snug text-[#5f5a8a]">
                <span className="text-[#6366f1]">คลิกรูปสลิป</span> ซ้ายเพื่อขยาย
              </p>
              <ul className="space-y-2">
                {filteredRows.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      barberOffersListRowCardClass,
                      "flex min-w-0 gap-3 py-2.5 sm:items-start sm:gap-4",
                    )}
                  >
                    <BarberPurchaseSlipCell
                      row={r}
                      className={slipThumbClassName}
                      onOpenLightbox={(src) => slipLightbox.open(src)}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold tabular-nums text-[#2e2a58]">{r.customer.phone}</span>
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
                        <p className="truncate text-xs text-[#5f5a8a]">{r.customer.name}</p>
                      ) : null}
                      <p className="truncate bg-gradient-to-r from-[#4338ca] to-[#6366f1] bg-clip-text text-sm font-semibold text-transparent">
                        {r.package.name}
                      </p>
                      <p className="text-[11px] leading-snug text-[#8b87ad]">
                        ซื้อ{" "}
                        {new Date(r.createdAt).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · #{r.id}
                      </p>
                      <p className="text-[11px] text-[#66638c]">
                        ช่างขาย:{" "}
                        <span className="font-medium text-[#2e2a58]">{r.soldByStylist?.name ?? "—"}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                      <p className="text-lg font-bold tabular-nums leading-tight text-[#2e2a58] sm:text-xl">
                        ฿{formatPriceBaht(r.package.price)}
                        <span className="ml-0.5 text-[10px] font-semibold text-[#8b87ad]">บาท</span>
                      </p>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8b87ad]">เหลือ / ทั้งหมด</p>
                        <p className="text-xl font-bold tabular-nums leading-tight text-[#4d47b6]">
                          {r.remainingSessions}
                          <span className="text-sm font-semibold text-[#9b97b8]">/{r.package.totalSessions}</span>
                          <span className="ml-0.5 text-[10px] font-semibold text-[#66638c]">ครั้ง</span>
                        </p>
                      </div>
                      <div className={cn(barberIconToolbarGroupClass, "shrink-0")} role="group" aria-label="แก้ไขหรือลบ">
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
                  </li>
                ))}
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
              className={barberModalPanelMdClass}
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
              <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3 px-5 py-5">
              {editErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{editErr}</p>
              ) : null}
              <label className="block text-xs font-semibold text-[#4d47b6]">
                ชื่อลูกค้า (ไม่บังคับ)
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
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
                  className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-base tabular-nums"
                  value={editRemain}
                  onChange={(e) => setEditRemain(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-[#4d47b6]">
                สถานะ
                <select
                  className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                >
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="EXHAUSTED">หมดแล้ว</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </label>
              <p className="rounded-lg bg-[#f8f7ff] px-3 py-2 text-[11px] leading-relaxed text-[#5f5a8a]">
                แพ็ก {editTarget.package.totalSessions} ครั้ง · ราคา ฿{formatPriceBaht(editTarget.package.price)} บาท (อ่านอย่างเดียว)
              </p>
              <div className={`${barberCardSurfaceRadiusClass} border border-[#ecebff] bg-[#faf9ff] p-3`}>
                <p className="text-xs font-semibold text-[#4d47b6]">สลิปตอนขายแพ็ก</p>
                <p className="mt-0.5 text-[11px] text-[#66638c]">
                  ถ้ารายการเดิมไม่มีรูป (ระบบเคยบันทึกผิดพลาด) แนบไฟล์ที่นี่ได้ — หรือติ๊กลบสลิป
                </p>
                {!editRemoveSlip && editTarget.saleReceiptImageUrl?.trim() ? (
                  <div className="mt-2 flex items-center gap-2">
                    <BarberEditSlipPreview
                      subscriptionId={editTarget.id}
                      saleReceiptImageUrl={editTarget.saleReceiptImageUrl}
                      imgClassName="h-16 w-16 shrink-0 rounded-lg border border-[#ecebff] object-cover"
                    />
                    <span className="text-[11px] text-[#5f5a8a]">มีสลิปในระบบ</span>
                  </div>
                ) : !editRemoveSlip ? (
                  <p className="mt-2 text-[11px] text-amber-800">ยังไม่มีสลิปในระบบสำหรับรายการนี้</p>
                ) : null}
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-[#2e2a58]">
                  <input
                    type="checkbox"
                    checked={editRemoveSlip}
                    onChange={(e) => {
                      setEditRemoveSlip(e.target.checked);
                      if (e.target.checked) setEditSlipFile(null);
                    }}
                  />
                  ลบสลิปออกจากรายการ
                </label>
                {!editRemoveSlip ? (
                  <label className="mt-2 block text-xs font-semibold text-[#4d47b6]">
                    แนบหรือเปลี่ยนสลิป (JPG / PNG / WEBP)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="mt-1 block w-full text-sm text-[#2e2a58] file:mr-2 file:rounded-lg file:border-0 file:bg-[#ecebff] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#2e2a58]"
                      onChange={(e) => setEditSlipFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                ) : null}
              </div>
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
    </div>
  );
}
