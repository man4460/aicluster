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
  ASSET_AUDIT_STATUS_LABEL,
  ASSET_AUDIT_STATUS_TONE,
  ASSET_CONDITION_LABEL,
  formatThaiDateShort,
} from "@/systems/asset/lib/asset-types";
import type {
  AssetAuditStatus,
  AssetCondition,
} from "@/generated/prisma/enums";

type AssetLookup = { id: number; assetCode: string; assetName: string };
type Master = { id: number; name: string };
type Row = {
  id: string;
  auditCode: string;
  auditDate: string;
  auditorName: string | null;
  expectedCondition: AssetCondition | null;
  actualCondition: AssetCondition | null;
  status: AssetAuditStatus;
  note: string | null;
  asset: AssetLookup;
  expectedLocation: Master | null;
  actualLocation: Master | null;
};

const STATUSES: AssetAuditStatus[] = ["MATCH", "MISMATCH", "MISSING"];
const CONDITIONS: AssetCondition[] = ["GOOD", "FAIR", "POOR", "BROKEN"];

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

export function AssetAuditsClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [assets, setAssets] = useState<AssetLookup[]>([]);
  const [locations, setLocations] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    id: "",
    assetId: "",
    auditDate: todayYmd(),
    auditorName: "",
    expectedLocationId: "",
    actualLocationId: "",
    expectedCondition: "GOOD" as AssetCondition,
    actualCondition: "GOOD" as AssetCondition,
    status: "MATCH" as AssetAuditStatus,
    note: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/asset/audits", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setItems((j.items as Row[]) ?? []);
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

  const startCreate = () => {
    setForm({
      id: "",
      assetId: "",
      auditDate: todayYmd(),
      auditorName: "",
      expectedLocationId: "",
      actualLocationId: "",
      expectedCondition: "GOOD",
      actualCondition: "GOOD",
      status: "MATCH",
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
      const body: Record<string, unknown> = {
        assetId: Number(form.assetId),
        auditDate: form.auditDate,
        auditorName: form.auditorName.trim() || null,
        expectedLocationId: form.expectedLocationId ? Number(form.expectedLocationId) : null,
        actualLocationId: form.actualLocationId ? Number(form.actualLocationId) : null,
        expectedCondition: form.expectedCondition,
        actualCondition: form.actualCondition,
        status: form.status,
        note: form.note.trim() || null,
      };
      if (form.id) body.id = form.id;
      const r = await fetch("/api/asset/audits", {
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
        title="ตรวจนับ"
        description="ตรวจสอบทรัพย์สินตามตำแหน่งและสภาพจริง"
        action={
          <button
            type="button"
            onClick={startCreate}
            className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold sm:min-h-0"
          >
            + ตรวจนับ
          </button>
        }
      />
      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState>ยังไม่มีบันทึกตรวจนับ</AppEmptyState>
        ) : (
          <ul className="divide-y divide-white/60">
            {items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#66638c]">{it.auditCode}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        ASSET_AUDIT_STATUS_TONE[it.status],
                      )}
                    >
                      {ASSET_AUDIT_STATUS_LABEL[it.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-[#2e2a58]">{it.asset.assetName}</p>
                  <p className="text-xs text-[#66638c]">{it.asset.assetCode}</p>
                  <p className="mt-1 text-[11px] text-[#66638c]">
                    {formatThaiDateShort(it.auditDate)}
                    {it.auditorName ? ` · ผู้ตรวจ ${it.auditorName}` : ""}
                  </p>
                  <p className="text-[11px] text-[#66638c]">
                    คาด {it.expectedLocation?.name ?? "—"} ·{" "}
                    {it.expectedCondition ? ASSET_CONDITION_LABEL[it.expectedCondition] : "—"}
                  </p>
                  <p className="text-[11px] text-[#66638c]">
                    จริง {it.actualLocation?.name ?? "—"} ·{" "}
                    {it.actualCondition ? ASSET_CONDITION_LABEL[it.actualCondition] : "—"}
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
        title="บันทึกตรวจนับ"
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
            <Field label="วันที่ตรวจ">
              <input
                type="date"
                value={form.auditDate}
                onChange={(e) => setForm((f) => ({ ...f, auditDate: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="ผู้ตรวจ">
              <input
                type="text"
                value={form.auditorName}
                onChange={(e) => setForm((f) => ({ ...f, auditorName: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ที่ตั้ง (คาดว่า)">
              <select
                value={form.expectedLocationId}
                onChange={(e) => setForm((f) => ({ ...f, expectedLocationId: e.target.value }))}
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
            <Field label="ที่ตั้ง (จริง)">
              <select
                value={form.actualLocationId}
                onChange={(e) => setForm((f) => ({ ...f, actualLocationId: e.target.value }))}
                className={inputCls}
              >
                <option value="">— ไม่พบ —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="สภาพ (คาดว่า)">
              <select
                value={form.expectedCondition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expectedCondition: e.target.value as AssetCondition }))
                }
                className={inputCls}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {ASSET_CONDITION_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="สภาพ (จริง)">
              <select
                value={form.actualCondition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, actualCondition: e.target.value as AssetCondition }))
                }
                className={inputCls}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {ASSET_CONDITION_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="สรุปสถานะ">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as AssetAuditStatus }))
              }
              className={inputCls}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ASSET_AUDIT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
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
