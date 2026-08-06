"use client";

import { useEffect, useRef, useState } from "react";
import { prepareUploadFile } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { docFieldClass } from "@/systems/doc-transmission/doc-ui-tokens";
import {
  DOC_PRIORITY_LIST,
  DOC_STATUS_LIST,
  defaultThaiAcademicYear,
  type DocCategoryConfig,
} from "@/systems/doc-transmission/lib/doc-types";

export type DocRecordFormValues = {
  id?: string;
  category: DocCategoryConfig["key"];
  academicYear: string;
  docNumber?: string;
  subject: string;
  person: string;
  departmentId: number | null;
  recordDate: string;
  dueDate: string | null;
  status: "NORMAL" | "IN_PROGRESS" | "DONE" | "CANCELED";
  priority: "NORMAL" | "URGENT" | "IMMEDIATE";
  assigneeName: string;
  assigneeDept: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  note: string;
};

export type DocRecordFormSubmit = (values: DocRecordFormValues) => Promise<void> | void;

const inputClass = docFieldClass;
const labelClass = "text-[11px] font-bold uppercase tracking-wider text-[#66638c]";

export function emptyFormValues(category: DocCategoryConfig["key"]): DocRecordFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    category,
    academicYear: defaultThaiAcademicYear(),
    subject: "",
    person: "",
    departmentId: null,
    recordDate: today,
    dueDate: null,
    status: "NORMAL",
    priority: "NORMAL",
    assigneeName: "",
    assigneeDept: "",
    attachmentUrl: null,
    attachmentName: null,
    attachmentSize: null,
    note: "",
  };
}

export function DocRecordFormModal({
  open,
  category,
  initial,
  departments,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  category: DocCategoryConfig;
  initial: DocRecordFormValues;
  departments: ReadonlyArray<{ id: number; name: string; code: string }>;
  onClose: () => void;
  onSubmit: DocRecordFormSubmit;
  busy?: boolean;
}) {
  const [form, setForm] = useState<DocRecordFormValues>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial.id);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setUploadError(null);
    }
  }, [open, initial]);

  async function handlePickFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const prepared = await prepareUploadFile(file, { accept: "pdf" });
      const fd = new FormData();
      fd.append("file", prepared);
      if (form.attachmentName?.trim()) {
        fd.append("displayName", form.attachmentName.trim());
      }
      const res = await fetch("/api/doc-transmission/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => null)) as
        | {
            fileUrl?: string;
            displayName?: string;
            fileName?: string;
            fileSize?: number;
            error?: string;
          }
        | null;
      if (!res.ok || !json?.fileUrl) {
        throw new Error(json?.error ?? "อัปโหลดไม่สำเร็จ");
      }
      setForm((p) => ({
        ...p,
        attachmentUrl: json.fileUrl ?? null,
        // ชื่อที่แสดง — ให้ผู้ใช้ตั้ง; ถ้าเคยกรอกไว้แล้วคงค่าเดิม ไม่ดึงจากชื่อไฟล์ OS
        attachmentName: p.attachmentName?.trim()
          ? p.attachmentName.trim()
          : (json.displayName?.trim() || ""),
        attachmentSize: json.fileSize ?? prepared.size,
      }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.subject.trim() || !form.recordDate) return;
    if (form.attachmentUrl && !form.attachmentName?.trim()) {
      setUploadError("กรุณาตั้งชื่อไฟล์ที่แสดง");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        attachmentName: form.attachmentName?.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? `แก้ไข ${category.title}` : `เพิ่ม ${category.title}`}
      description={
        isEdit
          ? `ปรับปรุงข้อมูลเอกสาร ${category.shortTitle}`
          : `บันทึกเอกสารใหม่ในหมวด ${category.shortTitle}`
      }
      size="lg"
      footer={
        <FormModalFooterActions
          submitLabel={isEdit ? "บันทึกการแก้ไข" : "บันทึกเอกสาร"}
          loading={busy || uploading || submitting}
          submitDisabled={
            !form.subject.trim() ||
            !form.recordDate ||
            Boolean(form.attachmentUrl && !form.attachmentName?.trim())
          }
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>ปีการศึกษา/ปีงบฯ</label>
            <input
              type="text"
              required
              maxLength={4}
              pattern="\d{4}"
              value={form.academicYear}
              onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
              className={inputClass}
              placeholder="2567"
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>{category.numberLabel}</label>
            <input
              type="text"
              maxLength={60}
              value={form.docNumber ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, docNumber: e.target.value }))}
              className={inputClass}
              placeholder="ปล่อยว่างให้ระบบออกอัตโนมัติ"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>เรื่อง / หัวข้อ</label>
          <textarea
            required
            rows={2}
            maxLength={500}
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            className={cn(inputClass, "resize-none")}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>{category.personLabel}</label>
            <input
              type="text"
              maxLength={255}
              value={form.person}
              onChange={(e) => setForm((p) => ({ ...p, person: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>{category.dateLabel}</label>
            <input
              type="date"
              required
              value={form.recordDate}
              onChange={(e) => setForm((p) => ({ ...p, recordDate: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>หน่วยงานที่เกี่ยวข้อง</label>
            <select
              value={form.departmentId ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, departmentId: e.target.value ? Number(e.target.value) : null }))
              }
              className={inputClass}
            >
              <option value="">— ไม่ระบุ —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} · {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>กำหนดเสร็จ (ถ้ามี)</label>
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value || null }))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>สถานะเอกสาร</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DocRecordFormValues["status"] }))}
              className={inputClass}
            >
              {DOC_STATUS_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>ความเร่งด่วน</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as DocRecordFormValues["priority"] }))}
              className={inputClass}
            >
              {DOC_PRIORITY_LIST.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>ผู้รับมอบ / ผู้ดำเนินการ</label>
            <input
              type="text"
              maxLength={160}
              value={form.assigneeName}
              onChange={(e) => setForm((p) => ({ ...p, assigneeName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>หน่วยงานผู้รับมอบ</label>
            <input
              type="text"
              maxLength={160}
              value={form.assigneeDept}
              onChange={(e) => setForm((p) => ({ ...p, assigneeDept: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>ไฟล์แนบ (PDF เท่านั้น, ไม่เกิน 12MB)</label>
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[#bcb5e8] bg-[#f7f5ff] p-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePickFile(f);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <button
              type="button"
              className="app-btn-soft min-h-[40px] rounded-xl border border-white/55 bg-white/75 px-3 py-2 text-sm font-semibold text-[#5b61ff] hover:bg-white/90"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "กำลังอัปโหลด…" : form.attachmentUrl ? "เปลี่ยนไฟล์" : "เลือกไฟล์ PDF"}
            </button>
            <div className="min-w-0 flex-1 text-xs text-[#5f5a8a]">
              {form.attachmentUrl ? (
                <a
                  href={form.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-semibold text-[#5b61ff] underline-offset-2 hover:underline"
                >
                  {form.attachmentName?.trim() || "เปิดไฟล์ที่อัปโหลด"}
                </a>
              ) : (
                <span>ยังไม่ได้แนบไฟล์</span>
              )}
              {uploadError ? <p className="text-rose-600">{uploadError}</p> : null}
            </div>
            {form.attachmentUrl ? (
              <button
                type="button"
                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                onClick={() =>
                  setForm((p) => ({ ...p, attachmentUrl: null, attachmentName: null, attachmentSize: null }))
                }
              >
                ลบไฟล์
              </button>
            ) : null}
          </div>
          <div className="space-y-1 pt-1">
            <label className={labelClass} htmlFor="doc-attachment-display-name">
              ชื่อไฟล์ที่แสดง
            </label>
            <input
              id="doc-attachment-display-name"
              type="text"
              maxLength={160}
              placeholder="ตั้งชื่อเอง เช่น หนังสือสั่งการ 1/2568"
              value={form.attachmentName ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, attachmentName: e.target.value }))}
              className={inputClass}
            />
            <p className="text-[11px] text-[#8b87b0]">ชื่อนี้ใช้แสดงในระบบ — ไม่ใช่ชื่อไฟล์บนเซิร์ฟเวอร์</p>
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>หมายเหตุ</label>
          <textarea
            rows={2}
            maxLength={4000}
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            className={cn(inputClass, "resize-none")}
          />
        </div>
      </form>
    </FormModal>
  );
}
