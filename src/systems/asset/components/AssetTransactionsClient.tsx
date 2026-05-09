"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  ASSET_TRANSACTION_TYPE_EMOJI,
  ASSET_TRANSACTION_TYPE_LABEL,
  ASSET_TRANSACTION_STATUS_LABEL,
  formatThaiDateShort,
} from "@/systems/asset/lib/asset-types";
import type {
  AssetTransactionStatus,
  AssetTransactionType,
} from "@/generated/prisma/enums";

type Master = { id: number; name: string };
type AssetLookup = {
  id: number;
  assetCode: string;
  assetName: string;
  status: string;
  location: { id: number; name: string } | null;
  holderName: string | null;
};
type TxRow = {
  id: string;
  transactionCode: string;
  type: AssetTransactionType;
  transactionDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: AssetTransactionStatus;
  fromHolderName: string | null;
  toHolderName: string | null;
  note: string | null;
  asset: { id: number; assetCode: string; assetName: string };
  fromLocation: { id: number; name: string } | null;
  toLocation: { id: number; name: string } | null;
};

const TX_TYPES: AssetTransactionType[] = ["ASSIGN", "BORROW", "RETURN", "TRANSFER"];

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function AssetTransactionsClient() {
  const [items, setItems] = useState<TxRow[]>([]);
  const [assets, setAssets] = useState<AssetLookup[]>([]);
  const [locations, setLocations] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "ASSIGN" as AssetTransactionType,
    assetId: "",
    fromLocationId: "",
    toLocationId: "",
    fromHolderName: "",
    toHolderName: "",
    transactionDate: todayYmd(),
    expectedReturnDate: "",
    note: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/asset/transactions", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setItems((j.items as TxRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLookups = useCallback(async () => {
    const [a, l] = await Promise.all([
      fetch("/api/asset/assets", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/asset/locations", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setAssets((a.items as AssetLookup[]) ?? []);
    setLocations(((l.items as (Master & { isActive: boolean })[]) ?? []).filter((x) => x.isActive));
  }, []);

  useEffect(() => {
    void refreshLookups();
    void refresh();
  }, [refreshLookups, refresh]);

  const startCreate = (type: AssetTransactionType) => {
    setForm({
      type,
      assetId: "",
      fromLocationId: "",
      toLocationId: "",
      fromHolderName: "",
      toHolderName: "",
      transactionDate: todayYmd(),
      expectedReturnDate: "",
      note: "",
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.assetId) {
      alert("กรุณาเลือกทรัพย์สิน");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        type: form.type,
        assetId: Number(form.assetId),
        fromLocationId: form.fromLocationId ? Number(form.fromLocationId) : null,
        toLocationId: form.toLocationId ? Number(form.toLocationId) : null,
        fromHolderName: form.fromHolderName.trim() || null,
        toHolderName: form.toHolderName.trim() || null,
        transactionDate: form.transactionDate,
        expectedReturnDate: form.expectedReturnDate || null,
        note: form.note.trim() || null,
      };
      const r = await fetch("/api/asset/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      await Promise.all([refresh(), refreshLookups()]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDashboardSection tone="slate">
      <AppSectionHeader
        tone="slate"
        title="การเคลื่อนไหวทรัพย์สิน"
        description="มอบหมาย · ยืม · คืน · ย้ายระหว่างสถานที่/ผู้ดูแล"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TX_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => startCreate(t)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/55 bg-gradient-to-br from-white/65 to-[#ede9ff]/55 px-3 py-2 text-sm font-bold text-[#2e2a58] shadow-[0_10px_24px_-18px_rgba(76,70,178,0.55)] transition hover:from-white/85 hover:to-[#ede9ff]/85"
          >
            <span aria-hidden>{ASSET_TRANSACTION_TYPE_EMOJI[t]}</span>
            <span>{ASSET_TRANSACTION_TYPE_LABEL[t]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState>ยังไม่มีรายการเคลื่อนไหว — กดปุ่มด้านบนเพื่อสร้าง</AppEmptyState>
        ) : (
          <ul className="divide-y divide-white/60">
            {items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#66638c]">{it.transactionCode}</span>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {ASSET_TRANSACTION_TYPE_LABEL[it.type]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        it.status === "ACTIVE"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : it.status === "COMPLETED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600",
                      )}
                    >
                      {ASSET_TRANSACTION_STATUS_LABEL[it.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-[#2e2a58]">
                    {it.asset.assetName}
                  </p>
                  <p className="text-xs text-[#66638c]">{it.asset.assetCode}</p>
                  <p className="mt-1 text-[11px] text-[#66638c]">
                    {it.fromLocation?.name ? `จาก ${it.fromLocation.name}` : null}
                    {it.fromLocation?.name && it.toLocation?.name ? " → " : ""}
                    {it.toLocation?.name ? `ไป ${it.toLocation.name}` : null}
                    {it.toHolderName ? ` · ผู้รับ: ${it.toHolderName}` : ""}
                  </p>
                  <p className="text-[11px] text-[#66638c]">
                    {formatThaiDateShort(it.transactionDate)}
                    {it.expectedReturnDate
                      ? ` · กำหนดคืน ${formatThaiDateShort(it.expectedReturnDate)}`
                      : ""}
                    {it.actualReturnDate
                      ? ` · คืน ${formatThaiDateShort(it.actualReturnDate)}`
                      : ""}
                  </p>
                  {it.note ? <p className="mt-1 text-[11px] italic text-[#66638c]">{it.note}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => (submitting ? null : setModalOpen(false))}
        title={`สร้างใบ${ASSET_TRANSACTION_TYPE_LABEL[form.type]}`}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={submit}
            submitLabel="บันทึก"
            loading={submitting}
            submitDisabled={!form.assetId}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <Field label="ประเภท">
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as AssetTransactionType }))
              }
              className={inputCls}
            >
              {TX_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ASSET_TRANSACTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ทรัพย์สิน *">
            <select
              value={form.assetId}
              onChange={(e) => {
                const a = assets.find((x) => String(x.id) === e.target.value);
                setForm((f) => ({
                  ...f,
                  assetId: e.target.value,
                  fromLocationId: a?.location?.id ? String(a.location.id) : "",
                  fromHolderName: a?.holderName ?? "",
                }));
              }}
              className={inputCls}
              required
            >
              <option value="">— เลือกทรัพย์สิน —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} · {a.assetName}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="จากสถานที่">
              <select
                value={form.fromLocationId}
                onChange={(e) => setForm((f) => ({ ...f, fromLocationId: e.target.value }))}
                className={inputCls}
              >
                <option value="">— ไม่ระบุ —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ไปสถานที่">
              <select
                value={form.toLocationId}
                onChange={(e) => setForm((f) => ({ ...f, toLocationId: e.target.value }))}
                className={inputCls}
              >
                <option value="">— ไม่ระบุ —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {form.type !== "RETURN" ? (
            <Field label="ผู้รับ/ผู้ครอบครอง">
              <input
                type="text"
                value={form.toHolderName}
                onChange={(e) => setForm((f) => ({ ...f, toHolderName: e.target.value }))}
                className={inputCls}
                placeholder="ชื่อพนักงาน/หน่วยงาน"
              />
            </Field>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Field label="วันที่">
              <input
                type="date"
                value={form.transactionDate}
                onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
            {form.type === "BORROW" ? (
              <Field label="กำหนดคืน">
                <input
                  type="date"
                  value={form.expectedReturnDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expectedReturnDate: e.target.value }))
                  }
                  className={inputCls}
                />
              </Field>
            ) : null}
          </div>
          <Field label="หมายเหตุ">
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={cn(inputCls, "min-h-[60px]")}
              rows={2}
            />
          </Field>
        </div>
      </FormModal>
    </AppDashboardSection>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#66638c]">{label}</span>
      {children}
    </label>
  );
}
