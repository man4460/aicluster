"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AppIconPencil,
  AppIconToolbarButton,
  AppIconTrash,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  useAppImageLightbox,
} from "@/components/app-templates";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberSellPackageModal } from "@/systems/barber/components/BarberSellPackageModal";
import {
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberListRowCardClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
  barberSectionNextClass,
} from "@/systems/barber/components/barber-ui-tokens";

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
  "self-start rounded-lg border border-[#ecebff] bg-[#f8f7ff] ring-[#ecebff] hover:ring-[#4d47b6]/35 sm:h-[4.5rem] sm:w-[4.5rem]";

/** ไม่ผูกกับ baseUrl จากเซิร์ฟเวอร์ — กันโหลดรูปไปโฮสต์ผิด (proxy / NEXT_PUBLIC_APP_URL) */
function slipUrlForImg(src: string | null | undefined): string | null {
  if (!src?.trim()) return null;
  const u = src.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return u;
  return resolveAssetUrl(u, typeof window !== "undefined" ? window.location.origin : "");
}

export function BarberPurchasesClient() {
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
    const res = await fetch("/api/barber/subscriptions?limit=150", { cache: "no-store" });
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
      credentials: "same-origin",
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

  return (
    <div className={barberPageStackClass}>
      {sellNotice ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{sellNotice}</p>
      ) : null}
      {err ? <p className={barberInlineAlertErrorClass}>{err}</p> : null}
      {loading ? (
        <>
          <section className={barberSectionFirstClass} aria-label="เครื่องมือ">
            <div className={cn(barberSectionActionsRowClass, "w-full justify-end sm:ml-auto sm:w-auto")}>
              <BarberDashboardBackLink />
              <button
                type="button"
                onClick={openSellModal}
                className="app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                ขายแพ็กเกจ
              </button>
            </div>
          </section>
          <p className="rounded-lg bg-[#f8f7ff] px-4 py-3 text-sm text-[#66638c]">กำลังโหลด…</p>
        </>
      ) : rows.length === 0 ? (
        <section className={barberSectionFirstClass} aria-label="ว่าง">
          <div className={cn(barberSectionActionsRowClass, "w-full justify-end sm:ml-auto sm:w-auto")}>
            <BarberDashboardBackLink />
            <button
              type="button"
              onClick={openSellModal}
              className="app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              ขายแพ็กเกจ
            </button>
          </div>
          <p className="rounded-xl border border-dashed border-[#dcd8f0] py-10 text-center text-sm text-[#66638c]">
            ยังไม่มีการซื้อแพ็ก
          </p>
        </section>
      ) : (
        <>
          <section className={barberSectionFirstClass} aria-label="กรอง">
            <AppSectionHeader
              tone="violet"
              title="กรอง"
              description={
                hasActiveFilters ? (
                  <>
                    แสดง{" "}
                    <span className="font-semibold tabular-nums text-slate-700">{filteredRows.length}</span> จาก{" "}
                    <span className="tabular-nums">{rows.length}</span> รายการ
                  </>
                ) : (
                  <>ทั้งหมด {rows.length} รายการ</>
                )
              }
              actionWrapClassName="flex min-w-0 flex-1 justify-end"
              action={
                <div className={barberSectionActionsRowClass}>
                  <BarberDashboardBackLink />
                  <button
                    type="button"
                    onClick={openSellModal}
                    className="app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    ขายแพ็กเกจ
                  </button>
                </div>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="purchase-filter-phone" className="sr-only">
                  เบอร์
                </label>
                <input
                  id="purchase-filter-phone"
                  className="app-input min-h-[48px] w-full rounded-xl px-3 py-2 text-base placeholder:text-[#8b87ad]"
                  inputMode="numeric"
                  placeholder="เบอร์"
                  value={filterPhone}
                  onChange={(e) => setFilterPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                />
              </div>
              <div>
                <label htmlFor="purchase-filter-name" className="sr-only">
                  ชื่อ
                </label>
                <input
                  id="purchase-filter-name"
                  className="app-input min-h-[48px] w-full rounded-xl px-3 py-2 text-base placeholder:text-[#8b87ad]"
                  placeholder="ชื่อลูกค้า"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
            </div>
          </section>

          {filteredRows.length === 0 ? (
            <section className={barberSectionNextClass} aria-label="ไม่พบ">
              <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 py-8 text-center text-sm text-amber-900">
                ไม่พบรายการ — ลองเปลี่ยนเบอร์หรือชื่อ
              </p>
            </section>
          ) : (
            <section className={barberSectionNextClass} aria-label="รายการสมาชิก">
              <p className="mb-3 text-xs leading-snug text-[#66638c]">
                คอลัมน์ซ้ายเป็นสลิปตอนขายแพ็ก (เทมเพลตกลาง) — ถ้ามีรูป คลิกเพื่อเปิดดูขนาดเต็ม
              </p>
              <ul className="space-y-2">
                {filteredRows.map((r) => {
                  const slipResolved = slipUrlForImg(r.saleReceiptImageUrl);
                  return (
                  <li
                    key={r.id}
                    className={cn(
                      barberListRowCardClass,
                      "flex min-w-0 gap-3 py-2.5 sm:items-start sm:gap-4",
                    )}
                  >
                    <AppImageThumb
                      src={slipResolved}
                      alt={slipResolved ? "สลิปขายแพ็กเกจ" : ""}
                      emptyLabel="ไม่มีสลิป"
                      onOpen={
                        slipResolved ? () => slipLightbox.open(slipResolved) : undefined
                      }
                      className={slipThumbClassName}
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
                      <p className="truncate text-sm font-medium text-[#4d47b6]">{r.package.name}</p>
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
        onSuccess={(r) => {
          const warn = r.warning?.trim();
          setSellNotice(
            warn ?
              `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${r.subscriptionId ?? ""} · ${warn}`
            : `เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${r.subscriptionId ?? ""}`,
          );
          void load();
        }}
      />

      {editTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => closeEditModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-purchase-edit-title"
            className="max-h-[min(92vh,560px)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#ecebff] bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#ecebff] bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 id="barber-purchase-edit-title" className="text-base font-bold text-[#2e2a58] sm:text-lg">
                  แก้ไขสมาชิกแพ็กเกจ
                </h2>
                <p className="mt-0.5 truncate text-xs text-[#66638c] tabular-nums">{editTarget.customer.phone}</p>
                <p className="truncate text-xs font-medium text-[#4d47b6]">{editTarget.package.name}</p>
              </div>
              <button
                type="button"
                onClick={() => closeEditModal()}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-[#66638c] hover:bg-[#f4f3fb] hover:text-[#2e2a58]"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => void submitEdit(e)} className="grid gap-3 px-4 py-4 sm:px-5">
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
              <div className="rounded-xl border border-[#ecebff] bg-[#faf9ff] p-3">
                <p className="text-xs font-semibold text-[#4d47b6]">สลิปตอนขายแพ็ก</p>
                <p className="mt-0.5 text-[11px] text-[#66638c]">
                  ถ้ารายการเดิมไม่มีรูป (ระบบเคยบันทึกผิดพลาด) แนบไฟล์ที่นี่ได้ — หรือติ๊กลบสลิป
                </p>
                {!editRemoveSlip && slipUrlForImg(editTarget.saleReceiptImageUrl) ? (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slipUrlForImg(editTarget.saleReceiptImageUrl) ?? ""}
                      alt="สลิปปัจจุบัน"
                      className="h-16 w-16 rounded-lg border border-[#ecebff] object-cover"
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
                  className="app-btn-soft min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold text-[#2e2a58]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="app-btn-primary min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {editSaving ? "กำลังบันทึก…" : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
