"use client";

import { useMemo } from "react";
import type { GlmOcrSlipResult } from "@/lib/vision/glm-ocr-service";
import { cn } from "@/lib/cn";
import { AppImageThumb } from "@/components/app-templates";

export type SlipConfirmFormState = {
  entryDateYmd: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  title: string;
  transferFrom: string;
  transferTo: string;
  bank: string;
  reference: string;
  note: string;
};

function todayYmdBangkokClient(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

export function buildSlipFormFromGlm(r: GlmOcrSlipResult): SlipConfirmFormState {
  const type: "INCOME" | "EXPENSE" =
    r.directionGuess === "in" ? "INCOME" : r.directionGuess === "out" ? "EXPENSE" : "EXPENSE";
  const parts = [r.slipNote, r.transferFrom && `ผู้โอน: ${r.transferFrom}`, r.transferTo && `ผู้รับ: ${r.transferTo}`].filter(
    Boolean,
  ) as string[];
  const note = parts.join("\n").slice(0, 600);
  return {
    entryDateYmd: r.entryDateYmd || todayYmdBangkokClient(),
    amount: r.amountBaht != null ? String(r.amountBaht) : "",
    type,
    category: "อื่นๆ",
    title: (r.transferTo || r.bankName || "รายการจากสลิป").slice(0, 160),
    transferFrom: r.transferFrom ?? "",
    transferTo: r.transferTo ?? "",
    bank: r.bankName ?? "",
    reference: r.reference ?? "",
    note,
  };
}

type Props = {
  imageDataUrl: string;
  glmResult: GlmOcrSlipResult;
  form: SlipConfirmFormState;
  onChange: (next: SlipConfirmFormState) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onOpenImage: () => void;
};

const labelClass = "mb-0.5 block text-xs font-medium text-slate-600";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-[#0000BF] focus:ring-1 focus:ring-[#0000BF]/30";

export function PersonalAiSlipConfirmPanel({ imageDataUrl, glmResult, form, onChange, saving, onSave, onCancel, onOpenImage }: Props) {
  const nameHint = useMemo(() => {
    if (!form.transferFrom && !form.transferTo) {
      return "อ่านชื่อผู้โอน/รับไม่ชัด — กรุณาแก้มือ";
    }
    return null;
  }, [form.transferFrom, form.transferTo]);

  function patch(p: Partial<SlipConfirmFormState>) {
    onChange({ ...form, ...p });
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">การอ่านสลิป (Kimi → GLM-OCR, Ollama local)</p>
          <p className="text-xs text-slate-500">
            ลอง Kimi ก่อน แล้วใช้ GLM-OCR รองเมื่อตัวแรกไม่พอ — ตรวจก่อนกดยืนยัน; ส่งรูปไป Telegram ได้เพิ่มถ้าต้องการ
          </p>
        </div>
        <AppImageThumb src={imageDataUrl} alt="สลิป" className="h-16 w-16 rounded-lg" onOpen={onOpenImage} />
      </div>

      <p className="mb-2 rounded-lg border border-indigo-200/80 bg-indigo-50/90 px-2.5 py-2 text-xs font-medium leading-snug text-[#1e1b4b]">
        แสดงผลการอ่านสลิป — ตรวจ/แก้ไขรายช่องด้านล่าง แล้วกด「ยืนยันบันทึก」เพื่อบันทึกรายรับ–รายจ่าย
      </p>

      {glmResult.readPipeline?.usedGlmFallback ? (
        <p className="mb-2 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs text-sky-900">
          รอบนี้ใช้ <span className="font-semibold">GLM-OCR รอง</span>
          หลัง {glmResult.readPipeline.primaryModel} (JSON อ่อนหรือ error)
          {glmResult.readPipeline.primaryError
            ? ` — ${glmResult.readPipeline.primaryError.slice(0, 180)}${glmResult.readPipeline.primaryError.length > 180 ? "…" : ""}`
            : null}
        </p>
      ) : glmResult.readPipeline && !glmResult.readPipeline.usedGlmFallback ? (
        <p className="mb-2 text-xs text-emerald-800/90">ใช้ผลจาก {glmResult.readPipeline.primaryModel} รอบแรก</p>
      ) : null}

      {glmResult.parseWarning ? (
        <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">{glmResult.parseWarning}</p>
      ) : null}
      {nameHint ? <p className="mb-2 text-xs text-amber-800">{nameHint}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="slip-date">
            วันที่ (ค.ศ. YYYY-MM-DD)
          </label>
          <input
            id="slip-date"
            className={inputClass}
            value={form.entryDateYmd}
            onChange={(e) => patch({ entryDateYmd: e.target.value.slice(0, 10) })}
            placeholder="2026-04-22"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-amt">
            จำนวนเงิน (บาท) <span className="text-red-600">*</span>
          </label>
          <input
            id="slip-amt"
            className={inputClass}
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => patch({ amount: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-type">
            ประเภท
          </label>
          <select
            id="slip-type"
            className={inputClass}
            value={form.type}
            onChange={(e) => patch({ type: e.target.value as "INCOME" | "EXPENSE" })}
          >
            <option value="EXPENSE">รายจ่าย</option>
            <option value="INCOME">รายรับ</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-cat">
            หมวด
          </label>
          <input
            id="slip-cat"
            className={inputClass}
            value={form.category}
            onChange={(e) => patch({ category: e.target.value.slice(0, 100) })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="slip-title">
            หัวข้อรายการ
          </label>
          <input
            id="slip-title"
            className={inputClass}
            value={form.title}
            onChange={(e) => patch({ title: e.target.value.slice(0, 160) })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-from">
            ผู้โอน
          </label>
          <input
            id="slip-from"
            className={inputClass}
            value={form.transferFrom}
            onChange={(e) => patch({ transferFrom: e.target.value.slice(0, 200) })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-to">
            ผู้รับ
          </label>
          <input
            id="slip-to"
            className={inputClass}
            value={form.transferTo}
            onChange={(e) => patch({ transferTo: e.target.value.slice(0, 200) })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-bank">
            ธนาคาร / แอป
          </label>
          <input
            id="slip-bank"
            className={inputClass}
            value={form.bank}
            onChange={(e) => patch({ bank: e.target.value.slice(0, 100) })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slip-ref">
            รหัสอ้างอิง
          </label>
          <input
            id="slip-ref"
            className={inputClass}
            value={form.reference}
            onChange={(e) => patch({ reference: e.target.value.slice(0, 100) })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="slip-note">
            โน้ต
          </label>
          <textarea
            id="slip-note"
            rows={3}
            className={cn(inputClass, "resize-y")}
            value={form.note}
            onChange={(e) => patch({ note: e.target.value.slice(0, 600) })}
          />
        </div>
      </div>

      <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium">ดูข้อความดิบจากโมเดล</summary>
        <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-snug text-slate-700">
          {glmResult.rawText}
        </pre>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "ยืนยันบันทึก (รายรับ–รายจ่าย)"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
