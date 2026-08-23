"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { PlanFeaturePolicyDto } from "@/lib/modules/plan-feature-policy";

const fieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

function ToggleRow({
  id,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-white/60 bg-white/70 p-4 shadow-sm">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-black text-[#1e1b4b]">
          {title}
        </label>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#66638c]">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-8 w-14 shrink-0 rounded-full border transition",
          checked ? "border-emerald-300 bg-emerald-500" : "border-slate-200 bg-slate-200",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
            checked ? "left-7" : "left-0.5",
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}

export function PlanFeaturesAdminClient() {
  const [policy, setPolicy] = useState<PlanFeaturePolicyDto | null>(null);
  const [draft, setDraft] = useState<PlanFeaturePolicyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/plan-features", { credentials: "include", cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { policy?: PlanFeaturePolicyDto; error?: string };
      if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
      if (!j.policy) throw new Error("ไม่พบนโยบาย");
      setPolicy(j.policy);
      setDraft(j.policy);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setPolicy(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const res = await fetch("/api/admin/plan-features", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataRowLimitEnabled: draft.dataRowLimitEnabled,
          dailyMaxDataRows: draft.dailyMaxDataRows,
          monthlyDataRowsThreshold: draft.monthlyDataRowsThreshold,
          slipPrintGateEnabled: draft.slipPrintGateEnabled,
          slipUploadGateEnabled: draft.slipUploadGateEnabled,
          documentUploadGateEnabled: draft.documentUploadGateEnabled,
          multiKitchenGateEnabled: draft.multiKitchenGateEnabled,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { policy?: PlanFeaturePolicyDto; error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      if (!j.policy) throw new Error("บันทึกไม่สำเร็จ");
      setPolicy(j.policy);
      setDraft(j.policy);
      setOkMsg("บันทึกเงื่อนไขแพ็กเกจแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    !!policy &&
    !!draft &&
    (policy.dataRowLimitEnabled !== draft.dataRowLimitEnabled ||
      policy.dailyMaxDataRows !== draft.dailyMaxDataRows ||
      policy.monthlyDataRowsThreshold !== draft.monthlyDataRowsThreshold ||
      policy.slipPrintGateEnabled !== draft.slipPrintGateEnabled ||
      policy.slipUploadGateEnabled !== draft.slipUploadGateEnabled ||
      policy.documentUploadGateEnabled !== draft.documentUploadGateEnabled ||
      policy.multiKitchenGateEnabled !== draft.multiKitchenGateEnabled);

  return (
    <AppDashboardSection tone="violet" className="space-y-4">
      <AppSectionHeader
        title="เงื่อนไขแพ็กเกจ"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(appTemplateOutlineButtonClass, "min-h-[40px] min-w-[40px] rounded-xl px-3 text-xs font-black sm:min-w-0")}
              onClick={() => void load()}
              disabled={loading || saving}
              aria-label="รีเฟรชเงื่อนไขแพ็กเกจ"
            >
              รีเฟรช
            </button>
            <button
              type="button"
              className={cn(appDashboardBrandCtaPillButtonClass, "min-h-[40px] rounded-xl px-4 text-xs font-black disabled:opacity-50")}
              disabled={!dirty || saving || !draft}
              onClick={() => void save()}
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        }
      />

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800" role="alert">
          {err}
        </p>
      ) : null}
      {okMsg ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" role="status">
          {okMsg}
        </p>
      ) : null}

      {loading || !draft ? (
        <div className="h-40 animate-pulse rounded-[1.25rem] bg-[#ecebff]/50" aria-hidden />
      ) : (
        <div className="space-y-3">
          <ToggleRow
            id="gate-data-rows"
            title="เปิดเงื่อนไขจำนวนแถว"
            description={
              draft.dataRowLimitEnabled
                ? "สายรายวันถูกจำกัดจำนวนแถว · แพ็ก 199 ของโมดูลนั้นได้มากกว่าเกณฑ์ที่ตั้ง"
                : "ปิดแล้ว — ไม่จำกัดจำนวนแถวสำหรับทุกแพ็กเกจ"
            }
            checked={draft.dataRowLimitEnabled}
            disabled={saving}
            onChange={(next) => setDraft((d) => (d ? { ...d, dataRowLimitEnabled: next } : d))}
          />

          <div
            className={cn(
              "grid gap-3 rounded-[1.25rem] border border-white/60 bg-white/55 p-4 sm:grid-cols-2",
              !draft.dataRowLimitEnabled && "opacity-55",
            )}
          >
            <div>
              <label htmlFor="daily-max-rows" className="text-xs font-black uppercase tracking-wide text-[#66638c]">
                สายรายวัน — สูงสุด (แถว)
              </label>
              <input
                id="daily-max-rows"
                type="number"
                min={1}
                max={10_000_000}
                className={cn(fieldClass, "mt-1.5 tabular-nums")}
                value={draft.dailyMaxDataRows}
                disabled={saving || !draft.dataRowLimitEnabled}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setDraft((d) => (d ? { ...d, dailyMaxDataRows: Number.isFinite(n) ? n : d.dailyMaxDataRows } : d));
                }}
              />
            </div>
            <div>
              <label htmlFor="monthly-threshold" className="text-xs font-black uppercase tracking-wide text-[#66638c]">
                แพ็ก 199 ต่อโมดูล — ได้มากกว่า (แถว)
              </label>
              <input
                id="monthly-threshold"
                type="number"
                min={1}
                max={10_000_000}
                className={cn(fieldClass, "mt-1.5 tabular-nums")}
                value={draft.monthlyDataRowsThreshold}
                disabled={saving || !draft.dataRowLimitEnabled}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setDraft((d) =>
                    d ? { ...d, monthlyDataRowsThreshold: Number.isFinite(n) ? n : d.monthlyDataRowsThreshold } : d,
                  );
                }}
              />
            </div>
          </div>

          <ToggleRow
            id="gate-slip-print"
            title="เปิดเงื่อนไขพิมพ์สลิป"
            description={
              draft.slipPrintGateEnabled
                ? "พิมพ์สลิปเปิดเฉพาะแพ็ก 199 ของโมดูลนั้น (และแอดมิน)"
                : "ปิดแล้ว — พิมพ์สลิปได้ทุกแพ็กเกจรวมสายรายวัน"
            }
            checked={draft.slipPrintGateEnabled}
            disabled={saving}
            onChange={(next) => setDraft((d) => (d ? { ...d, slipPrintGateEnabled: next } : d))}
          />

          <ToggleRow
            id="gate-slip-upload"
            title="เปิดเงื่อนไขอัปโหลดสลิป"
            description={
              draft.slipUploadGateEnabled
                ? "อัปโหลดสลิปชำระ/หลักฐานโอนเปิดเฉพาะแพ็ก 199 ของโมดูลนั้น"
                : "ปิดแล้ว — อัปโหลดสลิปได้ทุกแพ็กเกจ"
            }
            checked={draft.slipUploadGateEnabled}
            disabled={saving}
            onChange={(next) => setDraft((d) => (d ? { ...d, slipUploadGateEnabled: next } : d))}
          />

          <ToggleRow
            id="gate-document-upload"
            title="เปิดเงื่อนไขอัปโหลดเอกสาร"
            description={
              draft.documentUploadGateEnabled
                ? "อัปโหลดเอกสาร (เช่น สารบรรณ / แนบไฟล์) เปิดเฉพาะแพ็ก 199 ของโมดูลนั้น"
                : "ปิดแล้ว — อัปโหลดเอกสารได้ทุกแพ็กเกจ"
            }
            checked={draft.documentUploadGateEnabled}
            disabled={saving}
            onChange={(next) => setDraft((d) => (d ? { ...d, documentUploadGateEnabled: next } : d))}
          />

          <ToggleRow
            id="gate-multi-kitchen"
            title="เปิดเงื่อนไขหลายแผนกครัว (POS ร้านอาหาร)"
            description={
              draft.multiKitchenGateEnabled
                ? "ตั้งแผนกครัวหลายจุด · จำแนกเมนู · ลิงก์ครัวแยก — เปิดเฉพาะแพ็ก 199 ของ POS ร้านอาหาร"
                : "ปิดแล้ว — ใช้หลายแผนกครัวได้ทุกแพ็กเกจ"
            }
            checked={draft.multiKitchenGateEnabled}
            disabled={saving}
            onChange={(next) => setDraft((d) => (d ? { ...d, multiKitchenGateEnabled: next } : d))}
          />

          {policy?.updatedAt ? (
            <p className="text-[11px] font-semibold text-[#9b98c4]">
              อัปเดตล่าสุด{" "}
              {new Date(policy.updatedAt).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </div>
      )}
    </AppDashboardSection>
  );
}
