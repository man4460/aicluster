"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { assetFieldClass, assetListRowCardClass } from "@/systems/asset/asset-ui-tokens";
import {
  ASSET_DISPOSAL_METHOD_LABEL,
  ASSET_DISPOSAL_STATUS_LABEL,
  formatTHB,
  formatThaiDateShort,
} from "@/systems/asset/lib/asset-types";
import { assetRowEditIconButtonClass, IconRowEdit } from "@/systems/asset/components/AssetRowActionIcons";
import type {
  AssetDisposalMethod,
  AssetDisposalStatus,
} from "@/generated/prisma/enums";

type AssetLookup = { id: number; assetCode: string; assetName: string };
type Row = {
  id: string;
  disposalCode: string;
  disposalDate: string;
  reason: string | null;
  method: AssetDisposalMethod;
  salePrice: string | null;
  buyer: string | null;
  approvedByName: string | null;
  documentUrl: string | null;
  note: string | null;
  status: AssetDisposalStatus;
  asset: AssetLookup;
};

const METHODS: AssetDisposalMethod[] = ["SALE", "DONATION", "WRITE_OFF", "RECYCLE"];
const STATUSES: AssetDisposalStatus[] = ["COMPLETED", "PENDING", "CANCELLED"];

const inputCls = assetFieldClass;

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function AssetDisposalsClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [assets, setAssets] = useState<AssetLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: "",
    assetId: "",
    disposalDate: todayYmd(),
    reason: "",
    method: "SALE" as AssetDisposalMethod,
    salePrice: "",
    buyer: "",
    approvedByName: "",
    documentUrl: "",
    note: "",
    status: "COMPLETED" as AssetDisposalStatus,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/asset/disposals", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setItems((j.items as Row[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAssets = useCallback(async () => {
    const r = await fetch("/api/asset/assets", { cache: "no-store" }).then((x) => x.json());
    setAssets((r.items as AssetLookup[]) ?? []);
  }, []);

  useEffect(() => {
    void refreshAssets();
    void refresh();
  }, [refreshAssets, refresh]);

  const startCreate = () => {
    setForm({
      id: "",
      assetId: "",
      disposalDate: todayYmd(),
      reason: "",
      method: "SALE",
      salePrice: "",
      buyer: "",
      approvedByName: "",
      documentUrl: "",
      note: "",
      status: "COMPLETED",
    });
    setModalOpen(true);
  };

  const startEdit = (it: Row) => {
    setForm({
      id: it.id,
      assetId: String(it.asset.id),
      disposalDate: it.disposalDate.slice(0, 10),
      reason: it.reason ?? "",
      method: it.method,
      salePrice: it.salePrice ?? "",
      buyer: it.buyer ?? "",
      approvedByName: it.approvedByName ?? "",
      documentUrl: it.documentUrl ?? "",
      note: it.note ?? "",
      status: it.status,
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
      const body: Record<string, unknown> = {
        assetId: Number(form.assetId),
        disposalDate: form.disposalDate,
        reason: form.reason.trim() || null,
        method: form.method,
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        buyer: form.buyer.trim() || null,
        approvedByName: form.approvedByName.trim() || null,
        documentUrl: form.documentUrl.trim() || null,
        note: form.note.trim() || null,
        status: form.status,
      };
      if (form.id) body.id = form.id;
      const r = await fetch("/api/asset/disposals", {
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
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDashboardSection tone="slate">
      <AppSectionHeader
        tone="slate"
        title="จำหน่ายออก"
        description="ขาย/บริจาค/ตัดจำหน่าย/รีไซเคิล ทรัพย์สินที่หมดอายุการใช้งาน"
        action={
          <button
            type="button"
            onClick={startCreate}
            className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold sm:min-h-0"
          >
            + ใบจำหน่ายออก
          </button>
        }
      />
      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState>ยังไม่มีรายการจำหน่ายออก</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className={cn(assetListRowCardClass, "flex flex-wrap items-start justify-between gap-3")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#66638c]">{it.disposalCode}</span>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {ASSET_DISPOSAL_METHOD_LABEL[it.method]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        it.status === "COMPLETED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : it.status === "PENDING"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600",
                      )}
                    >
                      {ASSET_DISPOSAL_STATUS_LABEL[it.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-[#2e2a58]">{it.asset.assetName}</p>
                  <p className="text-xs text-[#66638c]">{it.asset.assetCode}</p>
                  <p className="mt-1 text-[11px] text-[#66638c]">
                    {formatThaiDateShort(it.disposalDate)}
                    {it.salePrice ? ` · มูลค่า ${formatTHB(Number(it.salePrice))} บาท` : ""}
                    {it.buyer ? ` · ${it.buyer}` : ""}
                  </p>
                  {it.reason ? (
                    <p className="mt-1 text-[11px] italic text-[#66638c]">เหตุผล: {it.reason}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(it)}
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไขใบจำหน่าย ${it.disposalCode}`}
                  title="แก้ไข"
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => (submitting ? null : setModalOpen(false))}
        title={form.id ? "แก้ไขใบจำหน่ายออก" : "ใบจำหน่ายออกใหม่"}
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
          <Field label="ทรัพย์สิน *">
            <select
              value={form.assetId}
              onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
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
            <Field label="วิธีการ">
              <select
                value={form.method}
                onChange={(e) =>
                  setForm((f) => ({ ...f, method: e.target.value as AssetDisposalMethod }))
                }
                className={inputCls}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {ASSET_DISPOSAL_METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="สถานะ">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as AssetDisposalStatus }))
                }
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ASSET_DISPOSAL_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="วันที่">
            <input
              type="date"
              value={form.disposalDate}
              onChange={(e) => setForm((f) => ({ ...f, disposalDate: e.target.value }))}
              className={inputCls}
            />
          </Field>
          {form.method === "SALE" ? (
            <div className="grid grid-cols-2 gap-2">
              <Field label="ราคาขาย (บาท)">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="ผู้ซื้อ">
                <input
                  type="text"
                  value={form.buyer}
                  onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            </div>
          ) : null}
          <Field label="ผู้อนุมัติ">
            <input
              type="text"
              value={form.approvedByName}
              onChange={(e) => setForm((f) => ({ ...f, approvedByName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="เหตุผล">
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className={cn(inputCls, "min-h-[60px]")}
              rows={2}
            />
          </Field>
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
