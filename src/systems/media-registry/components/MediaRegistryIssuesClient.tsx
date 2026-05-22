"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { mrListRowCardCompactClass } from "@/systems/media-registry/components/media-registry-ui-tokens";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { MEDIA_REGISTRY_ISSUE_TYPE } from "@/systems/media-registry/lib/constants";

type MediaOption = { id: string; registerNo: string; mediaName: string };

type IssueRow = {
  id: string;
  recordType: string;
  mediaName: string;
  registerNo: string;
  quantityAffected: number;
  cost: string;
  detail: string | null;
  repairStatus: string | null;
  recordDate: string;
};

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

const issueTypes = Object.values(MEDIA_REGISTRY_ISSUE_TYPE);

export function MediaRegistryIssuesClient() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [media, setMedia] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    mediaId: "",
    recordType: (issueTypes[0] ?? "ชำรุด") as string,
    quantityAffected: "1",
    cost: "0",
    detail: "",
    repairStatus: "",
    recordDate: bangkokDateKey(),
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, mr] = await Promise.all([
        fetch("/api/media-registry/issues", { cache: "no-store" }),
        fetch("/api/media-registry/items", { cache: "no-store" }),
      ]);
      const ij = await ir.json();
      const mj = await mr.json();
      if (ir.ok) setIssues(ij.items as IssueRow[]);
      if (mr.ok) {
        const raw = mj.items as MediaOption[];
        setMedia(raw);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = async () => {
    if (!form.mediaId) {
      alert("เลือกสื่อ");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/media-registry/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mediaId: form.mediaId,
          recordType: form.recordType,
          quantityAffected: Number(form.quantityAffected) || 1,
          cost: form.cost,
          detail: form.detail.trim() || null,
          repairStatus: form.recordType === "ซ่อมบำรุง" ? form.repairStatus.trim() || null : null,
          recordDate: form.recordDate,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ชำรุด / ซ่อม / สูญหาย / จำหน่าย"
          description="สร้างบันทึกและปรับจำนวนในทะเบียนตามประเภท (อ้างอิง media_system)"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2 sm:min-w-0 sm:px-4"
              aria-label="เพิ่มบันทึก"
              onClick={() => setOpen(true)}
            >
              <IconPlus className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">+ บันทึก</span>
            </button>
          }
        />

        {loading ? (
          <p className="mt-4 text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : issues.length === 0 ? (
          <AppEmptyState className="mt-4">ยังไม่มีบันทึก</AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {issues.map((it) => (
              <li
                key={it.id}
                className={cn(mrListRowCardCompactClass, "text-sm text-[#2e2a58]")}
              >
                <span className="font-semibold">
                  {it.recordType} · {it.mediaName}
                </span>
                <span className="ml-2 text-xs text-[#66638c]">{it.registerNo}</span>
                <p className="mt-0.5 text-xs text-[#66638c]">
                  {it.recordDate.slice(0, 10)} · {it.quantityAffected} ชิ้น
                  {it.cost !== "0" ? ` · ${it.cost} ฿` : ""}
                  {it.repairStatus ? ` · ซ่อม: ${it.repairStatus}` : ""}
                </p>
                {it.detail ? <p className="mt-1 text-xs text-[#5f5a8a]">{it.detail}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title="บันทึกเหตุการณ์"
        footer={
          <FormModalFooterActions
            onCancel={() => setOpen(false)}
            onSubmit={() => void submit()}
            submitLabel={submitting ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={submitting}
          />
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">สื่อ *</span>
            <select
              className={cn(inputCls, "mt-1")}
              value={form.mediaId}
              onChange={(e) => setForm((f) => ({ ...f, mediaId: e.target.value }))}
            >
              <option value="">— เลือก —</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.registerNo} · {m.mediaName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">ประเภท</span>
            <select
              className={cn(inputCls, "mt-1")}
              value={form.recordType}
              onChange={(e) => setForm((f) => ({ ...f, recordType: e.target.value }))}
            >
              {issueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">จำนวน</span>
              <input
                className={cn(inputCls, "mt-1")}
                type="number"
                min={1}
                value={form.quantityAffected}
                onChange={(e) => setForm((f) => ({ ...f, quantityAffected: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">ค่าใช้จ่าย (บาท)</span>
              <input
                className={cn(inputCls, "mt-1")}
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">วันที่</span>
            <input
              className={cn(inputCls, "mt-1")}
              type="date"
              value={form.recordDate}
              onChange={(e) => setForm((f) => ({ ...f, recordDate: e.target.value }))}
            />
          </label>
          {form.recordType === "ซ่อมบำรุง" ? (
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">สถานะซ่อม (เช่น เสร็จสิ้น)</span>
              <input
                className={cn(inputCls, "mt-1")}
                placeholder="เสร็จสิ้น — จะตั้งสื่อกลับพร้อมใช้งาน"
                value={form.repairStatus}
                onChange={(e) => setForm((f) => ({ ...f, repairStatus: e.target.value }))}
              />
            </label>
          ) : null}
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">รายละเอียด</span>
            <textarea
              className={cn(inputCls, "mt-1 min-h-[80px]")}
              value={form.detail}
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </>
  );
}
