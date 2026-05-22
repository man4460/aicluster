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
  ASSET_MAINTENANCE_STATUS_LABEL,
  ASSET_MAINTENANCE_TYPE_LABEL,
  formatTHB,
  formatThaiDateShort,
} from "@/systems/asset/lib/asset-types";
import { assetRowEditIconButtonClass, IconRowEdit } from "@/systems/asset/components/AssetRowActionIcons";
import type {
  AssetMaintenanceStatus,
  AssetMaintenanceType,
} from "@/generated/prisma/enums";

type AssetLookup = { id: number; assetCode: string; assetName: string };
type Row = {
  id: string;
  maintenanceCode: string;
  type: AssetMaintenanceType;
  startDate: string;
  endDate: string | null;
  cost: string | null;
  vendor: string | null;
  description: string | null;
  result: string | null;
  status: AssetMaintenanceStatus;
  asset: AssetLookup;
};

const TYPES: AssetMaintenanceType[] = ["CORRECTIVE", "PREVENTIVE"];
const STATUSES: AssetMaintenanceStatus[] = ["IN_PROGRESS", "COMPLETED", "CANCELLED"];

const inputCls = assetFieldClass;

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function AssetMaintenanceClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [assets, setAssets] = useState<AssetLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: "" as string,
    assetId: "",
    type: "CORRECTIVE" as AssetMaintenanceType,
    startDate: todayYmd(),
    endDate: "",
    cost: "",
    vendor: "",
    description: "",
    result: "",
    status: "IN_PROGRESS" as AssetMaintenanceStatus,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/asset/maintenance", { cache: "no-store" });
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
      type: "CORRECTIVE",
      startDate: todayYmd(),
      endDate: "",
      cost: "",
      vendor: "",
      description: "",
      result: "",
      status: "IN_PROGRESS",
    });
    setModalOpen(true);
  };

  const startEdit = (it: Row) => {
    setForm({
      id: it.id,
      assetId: String(it.asset.id),
      type: it.type,
      startDate: it.startDate.slice(0, 10),
      endDate: it.endDate ? it.endDate.slice(0, 10) : "",
      cost: it.cost ?? "",
      vendor: it.vendor ?? "",
      description: it.description ?? "",
      result: it.result ?? "",
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
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate || null,
        cost: form.cost ? Number(form.cost) : null,
        vendor: form.vendor.trim() || null,
        description: form.description.trim() || null,
        result: form.result.trim() || null,
        status: form.status,
      };
      if (form.id) body.id = form.id;
      const r = await fetch("/api/asset/maintenance", {
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
        title="ซ่อมบำรุง"
        description="แจ้งซ่อม บันทึกค่าใช้จ่ายและผลการซ่อม"
        action={
          <button
            type="button"
            onClick={startCreate}
            className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold sm:min-h-0"
          >
            + เปิดใบซ่อม
          </button>
        }
      />
      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState>ยังไม่มีรายการซ่อมบำรุง</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className={cn(assetListRowCardClass, "flex flex-wrap items-start justify-between gap-3")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#66638c]">{it.maintenanceCode}</span>
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                      {ASSET_MAINTENANCE_TYPE_LABEL[it.type]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        it.status === "IN_PROGRESS"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : it.status === "COMPLETED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600",
                      )}
                    >
                      {ASSET_MAINTENANCE_STATUS_LABEL[it.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-[#2e2a58]">{it.asset.assetName}</p>
                  <p className="text-xs text-[#66638c]">{it.asset.assetCode}</p>
                  <p className="mt-1 text-[11px] text-[#66638c]">
                    เริ่ม {formatThaiDateShort(it.startDate)}
                    {it.endDate ? ` · เสร็จ ${formatThaiDateShort(it.endDate)}` : ""}
                    {it.cost ? ` · ค่าใช้จ่าย ${formatTHB(Number(it.cost))} บาท` : ""}
                    {it.vendor ? ` · ${it.vendor}` : ""}
                  </p>
                  {it.description ? (
                    <p className="mt-1 text-[11px] italic text-[#66638c]">อาการ: {it.description}</p>
                  ) : null}
                  {it.result ? (
                    <p className="text-[11px] text-[#5d559b]">ผล: {it.result}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(it)}
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไขใบซ่อม ${it.maintenanceCode}`}
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
        title={form.id ? "แก้ไขใบซ่อม" : "เปิดใบซ่อมใหม่"}
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
            <Field label="ประเภท">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as AssetMaintenanceType }))
                }
                className={inputCls}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ASSET_MAINTENANCE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="สถานะ">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as AssetMaintenanceStatus }))
                }
                className={inputCls}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ASSET_MAINTENANCE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="เริ่ม">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="เสร็จ">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ค่าใช้จ่าย (บาท)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="ผู้ให้บริการ">
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                className={inputCls}
                placeholder="ศูนย์บริการ ฯลฯ"
              />
            </Field>
          </div>
          <Field label="อาการ/รายละเอียด">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={cn(inputCls, "min-h-[60px]")}
              rows={2}
            />
          </Field>
          <Field label="ผลการซ่อม">
            <textarea
              value={form.result}
              onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
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
