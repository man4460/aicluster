"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import type { LaundryOrder, LaundryRevenueEntry } from "@/systems/laundry/laundry-service";
import { laundrySectionHeadingClass } from "@/systems/laundry/lib/ui-tokens";

export type LaundryHistoryLogRow = {
  id: number;
  visitType: string;
  note: string | null;
  packageName?: string | null;
  packageDescription?: string | null;
  amountBaht: string | null;
  paymentMethod: string | null;
  receiptImageUrl?: string | null;
  createdAt: string;
  customer: { phone: string; name: string | null };
};

type UnifiedKind = "log" | "order" | "revenue";

type UnifiedRow = {
  key: string;
  kind: UnifiedKind;
  at: number;
  title: string;
  subtitle: string;
  amount: number | null;
  log?: LaundryHistoryLogRow;
  order?: LaundryOrder;
  revenue?: LaundryRevenueEntry;
};

function visitLabel(v: string): string {
  if (v === "PACKAGE_USE") return "หักแพ็กเกจ";
  if (v === "PACKAGE_SALE") return "ขายแพ็กเกจ";
  if (v === "CASH_WALK_IN") return "Walk-in / เงินสด";
  return v;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function localInputToIso(local: string): string {
  if (!local.trim()) return new Date().toISOString();
  const d = new Date(`${local}:00+07:00`);
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

export function LaundryServiceHistoryList({
  logs,
  orders,
  revenueEntries,
  baseUrl = "",
  loading,
  error,
  onRefresh,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onEditRevenue,
}: {
  logs: LaundryHistoryLogRow[];
  orders: LaundryOrder[];
  revenueEntries: LaundryRevenueEntry[];
  baseUrl?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void | Promise<void>;
  onViewOrder: (o: LaundryOrder) => void;
  onEditOrder: (o: LaundryOrder) => void;
  onDeleteOrder: (o: LaundryOrder) => void | Promise<void>;
  onEditRevenue: (e: LaundryRevenueEntry) => void;
}) {
  const notice = useAppNoticePopup();
  const lightbox = useAppImageLightbox();
  const [editLog, setEditLog] = useState<LaundryHistoryLogRow | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCreatedLocal, setEditCreatedLocal] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const rows = useMemo(() => {
    const out: UnifiedRow[] = [];
    for (const l of logs) {
      const amt = l.amountBaht != null ? Number(l.amountBaht) : NaN;
      const pkgName = l.packageName?.trim() || (l.visitType === "PACKAGE_USE" || l.visitType === "PACKAGE_SALE" ? l.note?.trim() : "") || "";
      const visit = visitLabel(l.visitType);
      const title =
        (l.visitType === "PACKAGE_USE" || l.visitType === "PACKAGE_SALE") && pkgName
          ? `${visit} · ${pkgName}`
          : visit;
      const desc = l.packageDescription?.trim() || "";
      out.push({
        key: `log-${l.id}`,
        kind: "log",
        at: new Date(l.createdAt).getTime(),
        title,
        subtitle: [l.customer.name?.trim() || l.customer.phone, desc || l.note?.trim()]
          .filter((x) => Boolean(x) && x !== pkgName)
          .join(" · "),
        amount: Number.isFinite(amt) && amt > 0 ? amt : null,
        log: l,
      });
    }
    for (const o of orders) {
      out.push({
        key: `order-${o.id}`,
        kind: "order",
        at: new Date(o.order_at).getTime(),
        title: o.package_name?.trim() || `ออเดอร์ #${o.id}`,
        subtitle: [o.customer_name, o.customer_phone].filter(Boolean).join(" · "),
        amount: o.final_price > 0 ? o.final_price : null,
        order: o,
      });
    }
    for (const e of revenueEntries) {
      out.push({
        key: `rev-${e.id}`,
        kind: "revenue",
        at: new Date(e.earned_at).getTime(),
        title: e.item_label?.trim() || e.category_name || "รายรับเพิ่ม",
        subtitle: [e.category_name, e.note?.trim()].filter(Boolean).join(" · "),
        amount: e.amount > 0 ? e.amount : null,
        revenue: e,
      });
    }
    out.sort((a, b) => b.at - a.at);
    return out;
  }, [logs, orders, revenueEntries]);

  useEffect(() => {
    if (!editLog) return;
    setEditPhone(editLog.customer.phone);
    setEditName(editLog.customer.name ?? "");
    setEditNote(editLog.note ?? "");
    setEditAmount(editLog.amountBaht ?? "");
    setEditCreatedLocal(toLocalInput(editLog.createdAt));
    setEditErr(null);
  }, [editLog]);

  async function submitEditLog() {
    if (!editLog) return;
    setEditErr(null);
    const digits = editPhone.replace(/\D/g, "").slice(0, 20);
    if (digits.length < 9) {
      setEditErr("เบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }
    const body: Record<string, unknown> = {
      note: editNote.trim() || null,
      createdAt: localInputToIso(editCreatedLocal),
      customerPhone: digits,
      customerName: editName.trim() || null,
    };
    if (editLog.visitType === "CASH_WALK_IN") {
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
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/laundry/history/${editLog.id}`, {
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
      setEditLog(null);
      await onRefresh();
    } finally {
      setEditSaving(false);
    }
  }

  async function removeLog(l: LaundryHistoryLogRow) {
    const ok = await notice.confirm(`ลบประวัติ «${visitLabel(l.visitType)}» ของ ${l.customer.name?.trim() || l.customer.phone} ?`, {
      title: "ยืนยันลบประวัติ",
      confirmLabel: "ลบ",
    });
    if (!ok) return;
    const res = await fetch(`/api/laundry/history/${l.id}`, { method: "DELETE", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      notice.error(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await onRefresh();
  }

  async function removeRevenue(e: LaundryRevenueEntry) {
    const ok = await notice.confirm(`ลบรายรับ «${e.item_label || e.category_name}» ยอด ฿${e.amount.toLocaleString("th-TH")} ?`, {
      title: "ยืนยันลบรายรับ",
      confirmLabel: "ลบ",
    });
    if (!ok) return;
    const res = await fetch(`/api/laundry/session/revenue-entries/${e.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      notice.error(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await onRefresh();
  }

  return (
    <>
      {notice.popup}
      <div>
        <h3 className={laundrySectionHeadingClass}>
          ประวัติบริการ
          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#5f5a8a]">
            {rows.length}
          </span>
        </h3>
        <p className="mt-1 text-xs font-medium text-[#66638c]">
          รวมหักแพ็ก · ขายแพ็ก · Walk-in · ออเดอร์ · รายรับเพิ่ม — แถวละ 1 รายการ
        </p>

        {error ?
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
            {error}
          </p>
        : loading ?
          <p className="mt-3 text-center text-sm text-[#66638c]">กำลังโหลดประวัติ…</p>
        : rows.length === 0 ?
          <AppEmptyState tone="slate" className="mt-3">
            ไม่มีประวัติในช่วงที่เลือก
          </AppEmptyState>
        : <ul className="mt-3 grid list-none grid-cols-1 gap-2 p-0" aria-label="ประวัติบริการทั้งหมด">
            {rows.map((row) => {
              const slipRaw =
                row.kind === "revenue" ? row.revenue?.slip_photo_url?.trim()
                : row.kind === "log" ? row.log?.receiptImageUrl?.trim()
                : row.kind === "order" ? row.order?.receipt_image_url?.trim()
                : null;
                  const slipResolved = slipRaw ? resolveAssetUrl(slipRaw, baseUrl) : null;
              const showSlipThumb = Boolean(slipResolved) || row.kind === "revenue";
              return (
              <li
                key={row.key}
                className="rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    {showSlipThumb ?
                      <AppImageThumb
                        src={slipResolved}
                        alt="สลิป"
                        emptyLabel="ไม่มีสลิป"
                        onOpen={() => slipResolved && lightbox.open(slipResolved)}
                        className="h-14 w-14 shrink-0 rounded-lg sm:h-16 sm:w-16"
                      />
                    : null}
                    <button
                      type="button"
                      className={cn(
                        "min-w-0 flex-1 text-left",
                        row.kind === "order" && "cursor-pointer",
                      )}
                      onClick={() => {
                        if (row.kind === "order" && row.order) onViewOrder(row.order);
                      }}
                    >
                      <p className="text-sm font-bold text-[#1e1b4b]">{row.title}</p>
                      {row.subtitle ?
                        <p className="mt-0.5 truncate text-xs text-[#5f5a8a]">{row.subtitle}</p>
                      : null}
                      <p className="mt-1 text-[11px] text-[#66638c]">
                        {new Date(row.at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                        {row.kind === "order" && row.order ? ` · #${row.order.id}` : null}
                        {row.kind === "log" && row.log ? ` · #${row.log.id}` : null}
                        {row.kind === "revenue" && row.revenue ? ` · #${row.revenue.id}` : null}
                      </p>
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {row.amount != null ?
                      <p className="mr-1 text-base font-black tabular-nums text-emerald-700 sm:text-lg">
                        ฿{row.amount.toLocaleString("th-TH")}
                      </p>
                    : null}
                    {row.kind === "log" && row.log ?
                      <>
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไขประวัติ #${row.log.id}`}
                          title="แก้ไข"
                          onClick={() => setEditLog(row.log!)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบประวัติ #${row.log.id}`}
                          title="ลบ"
                          onClick={() => void removeLog(row.log!)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </>
                    : null}
                    {row.kind === "order" && row.order ?
                      <>
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไขออเดอร์ #${row.order.id}`}
                          title="แก้ไข"
                          onClick={() => onEditOrder(row.order!)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบออเดอร์ #${row.order.id}`}
                          title="ลบ"
                          onClick={() => void onDeleteOrder(row.order!)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </>
                    : null}
                    {row.kind === "revenue" && row.revenue ?
                      <>
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไขรายรับ #${row.revenue.id}`}
                          title="แก้ไข"
                          onClick={() => onEditRevenue(row.revenue!)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบรายรับ #${row.revenue.id}`}
                          title="ลบ"
                          onClick={() => void removeRevenue(row.revenue!)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </>
                    : null}
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        }
      </div>

      <AppImageLightbox src={lightbox.src} alt="สลิปรายรับ" onClose={lightbox.close} />
      <FormModal
        open={Boolean(editLog)}
        onClose={() => setEditLog(null)}
        title="แก้ไขประวัติบริการ"
        description="ปรับเบอร์ · ชื่อ · หมายเหตุ · เวลา"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setEditLog(null)}
            onSubmit={() => void submitEditLog()}
            submitLabel="บันทึก"
            loading={editSaving}
          />
        }
      >
        {editErr ? (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{editErr}</p>
        ) : null}
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              inputMode="numeric"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อลูกค้า</span>
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value.slice(0, 100))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">วันเวลา (ไทย)</span>
            <input
              type="datetime-local"
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              value={editCreatedLocal}
              onChange={(e) => setEditCreatedLocal(e.target.value)}
            />
          </label>
          {editLog?.visitType === "CASH_WALK_IN" ?
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">ยอดเงิน (บาท)</span>
              <input
                className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
                inputMode="decimal"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </label>
          : null}
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุ</span>
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value.slice(0, 255))}
            />
          </label>
        </div>
      </FormModal>
    </>
  );
}
