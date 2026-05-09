"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type Settings = {
  orgName: string | null;
  orgAddress: string | null;
  orgPhone: string | null;
  orgEmail: string | null;
  assetPrefix: string;
  txPrefix: string;
  mtPrefix: string;
  dpPrefix: string;
  auPrefix: string;
  currency: string;
};

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

export function AssetSettingsClient() {
  const [form, setForm] = useState<Settings>({
    orgName: "",
    orgAddress: "",
    orgPhone: "",
    orgEmail: "",
    assetPrefix: "AST",
    txPrefix: "TX",
    mtPrefix: "MT",
    dpPrefix: "DP",
    auPrefix: "AU",
    currency: "THB",
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/asset/settings", { cache: "no-store" });
    const j = await r.json();
    if (r.ok && j.setting) {
      setForm({
        orgName: j.setting.orgName ?? "",
        orgAddress: j.setting.orgAddress ?? "",
        orgPhone: j.setting.orgPhone ?? "",
        orgEmail: j.setting.orgEmail ?? "",
        assetPrefix: j.setting.assetPrefix ?? "AST",
        txPrefix: j.setting.txPrefix ?? "TX",
        mtPrefix: j.setting.mtPrefix ?? "MT",
        dpPrefix: j.setting.dpPrefix ?? "DP",
        auPrefix: j.setting.auPrefix ?? "AU",
        currency: j.setting.currency ?? "THB",
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/asset/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgName: form.orgName?.trim() || null,
          orgAddress: form.orgAddress?.trim() || null,
          orgPhone: form.orgPhone?.trim() || null,
          orgEmail: form.orgEmail?.trim() || null,
          assetPrefix: form.assetPrefix.trim() || "AST",
          txPrefix: form.txPrefix.trim() || "TX",
          mtPrefix: form.mtPrefix.trim() || "MT",
          dpPrefix: form.dpPrefix.trim() || "DP",
          auPrefix: form.auPrefix.trim() || "AU",
          currency: form.currency.trim() || "THB",
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDashboardSection tone="slate">
      <AppSectionHeader
        tone="slate"
        title="ตั้งค่า"
        description="ข้อมูลองค์กรและ Prefix รหัสเอกสาร"
        action={
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0"
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="ชื่อองค์กร">
          <input
            type="text"
            value={form.orgName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="โทรศัพท์">
          <input
            type="text"
            value={form.orgPhone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, orgPhone: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="อีเมล">
          <input
            type="email"
            value={form.orgEmail ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, orgEmail: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="สกุลเงิน">
          <input
            type="text"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className={inputCls}
            maxLength={8}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="ที่อยู่">
            <textarea
              value={form.orgAddress ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, orgAddress: e.target.value }))}
              className={cn(inputCls, "min-h-[80px]")}
              rows={3}
            />
          </Field>
        </div>
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#66638c]">
        Prefix รหัสเอกสาร
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Field label="ทรัพย์สิน">
          <input
            type="text"
            value={form.assetPrefix}
            onChange={(e) => setForm((f) => ({ ...f, assetPrefix: e.target.value }))}
            className={inputCls}
            maxLength={10}
          />
        </Field>
        <Field label="เคลื่อนไหว">
          <input
            type="text"
            value={form.txPrefix}
            onChange={(e) => setForm((f) => ({ ...f, txPrefix: e.target.value }))}
            className={inputCls}
            maxLength={10}
          />
        </Field>
        <Field label="ซ่อมบำรุง">
          <input
            type="text"
            value={form.mtPrefix}
            onChange={(e) => setForm((f) => ({ ...f, mtPrefix: e.target.value }))}
            className={inputCls}
            maxLength={10}
          />
        </Field>
        <Field label="จำหน่ายออก">
          <input
            type="text"
            value={form.dpPrefix}
            onChange={(e) => setForm((f) => ({ ...f, dpPrefix: e.target.value }))}
            className={inputCls}
            maxLength={10}
          />
        </Field>
        <Field label="ตรวจนับ">
          <input
            type="text"
            value={form.auPrefix}
            onChange={(e) => setForm((f) => ({ ...f, auPrefix: e.target.value }))}
            className={inputCls}
            maxLength={10}
          />
        </Field>
      </div>

      {savedAt ? (
        <p className="mt-3 text-xs text-emerald-600">
          ✓ บันทึกแล้วเมื่อ {new Date(savedAt).toLocaleTimeString("th-TH")}
        </p>
      ) : null}
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
