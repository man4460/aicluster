"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { openPrintableHtml } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  smartPoliceFieldClass,
  smartPoliceLabelClass,
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";

type TemplateDetail = {
  id: string;
  category: string;
  title: string;
  originalTitle: string;
  fileName: string;
  fileKind: "pdf" | "docx" | "other";
  fileHref: string;
  contentHtml: string;
  sourceHtml: string;
  notes: string;
  isActive: boolean;
  hasOverride: boolean;
};

export function SmartPoliceFormTemplateViewerClient({ formId }: { formId: string }) {
  const [data, setData] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/smart-police/form-templates/${formId}`, { cache: "no-store" });
    setLoading(false);
    if (!res.ok) {
      setError("ไม่พบแม่แบบ");
      return;
    }
    const json = (await res.json()) as { template: TemplateDetail };
    setData(json.template);
    setTitle(json.template.title);
    setContentHtml(json.template.contentHtml);
    setNotes(json.template.notes);
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    const res = await fetch(`/api/smart-police/form-templates/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || data.originalTitle,
        contentHtml: data.fileKind === "docx" ? contentHtml : undefined,
        notes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      showToast("บันทึกไม่สำเร็จ");
      return;
    }
    showToast("บันทึกแม่แบบแล้ว");
    setEditMode(false);
    await load();
  }

  async function resetContent() {
    if (!window.confirm("คืนเนื้อหาเป็นต้นฉบับแบบฟอร์ม?")) return;
    setSaving(true);
    await fetch(`/api/smart-police/form-templates/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetContent: true }),
    });
    setSaving(false);
    showToast("คืนต้นฉบับแล้ว");
    setEditMode(false);
    await load();
  }

  function printContent() {
    if (!data) return;
    if (data.fileKind === "pdf") {
      window.open(data.fileHref, "_blank", "noopener,noreferrer");
      return;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
      title || data.title,
    )}</title>
<style>
  body{font-family:Tahoma,"Sarabun",sans-serif;margin:24px;color:#111;line-height:1.55}
  h1{font-size:18px;margin:0 0 12px}
  .meta{color:#555;font-size:12px;margin-bottom:16px}
  .body{font-size:14px}
  .notes{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-size:13px;white-space:pre-wrap}
</style></head><body>
<h1>${escapeHtml(title || data.title)}</h1>
<p class="meta">${escapeHtml(data.category)} · ${escapeHtml(data.fileName)}</p>
<div class="body">${contentHtml || "<p>—</p>"}</div>
${notes.trim() ? `<div class="notes"><strong>หมายเหตุสถานี</strong><br/>${escapeHtml(notes)}</div>` : ""}
</body></html>`;
    openPrintableHtml(html);
  }

  const backHref = "/dashboard/smart-police/templates";

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-800 text-slate-200">
        กำลังโหลดแม่แบบ…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-slate-800 text-slate-100">
        <p>{error ?? "ไม่พบแม่แบบ"}</p>
        <Link href={backHref} className="underline">
          กลับรายการแม่แบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-800 text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">{data.title}</p>
          <p className="truncate text-xs text-slate-400">
            {data.category} · {data.fileKind === "pdf" ? "PDF" : "Word"} · {data.fileName}
            {data.hasOverride ? " · แก้แล้ว" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toast ? (
            <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-200">
              {toast}
            </span>
          ) : null}
          <Link
            href={backHref}
            className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-600 bg-slate-700/60 px-3 text-sm font-semibold text-slate-100"
          >
            ✕ ปิด
          </Link>
          <a
            href={data.fileHref}
            download={data.fileName}
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
          >
            ดาวน์โหลดต้นฉบับ
          </a>
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            onClick={() => printContent()}
          >
            พิมพ์
          </button>
          {data.fileKind === "docx" ? (
            <button
              type="button"
              className={cn(
                smartPoliceOutlineButtonClass,
                "border-slate-500 bg-slate-700/50 text-slate-100",
                editMode && "bg-white text-[#4d47b6]",
              )}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "ดูตัวอย่าง" : "แก้ไข"}
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                smartPoliceOutlineButtonClass,
                "border-slate-500 bg-slate-700/50 text-slate-100",
                editMode && "bg-white text-[#4d47b6]",
              )}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "ดูฟอร์ม" : "แก้ไขชื่อ/หมายเหตุ"}
            </button>
          )}
          {editMode ? (
            <>
              {data.fileKind === "docx" && data.hasOverride ? (
                <button
                  type="button"
                  className={cn(smartPoliceOutlineButtonClass, "border-amber-400/60 text-amber-100")}
                  disabled={saving}
                  onClick={() => void resetContent()}
                >
                  คืนต้นฉบับ
                </button>
              ) : null}
              <button
                type="button"
                className={smartPolicePrimaryButtonClass}
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? "…" : "บันทึก"}
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-600/90 p-3 sm:p-6">
        {editMode ? (
          <div className="mx-auto flex max-w-[210mm] flex-col gap-3 rounded-xl bg-white p-4 text-[#1e1b4b] shadow-xl sm:p-6">
            <label className={smartPoliceLabelClass}>
              ชื่อแม่แบบ
              <input
                className={cn(smartPoliceFieldClass, "mt-1")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            {data.fileKind === "docx" ? (
              <div className="space-y-1">
                <p className={smartPoliceLabelClass}>เนื้อหาแบบฟอร์ม (คลิกแก้ข้อความได้)</p>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[22rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] leading-relaxed text-[#1e1b4b] outline-none ring-[#5b61ff]/30 focus:ring-2"
                  dangerouslySetInnerHTML={{ __html: contentHtml || "<p></p>" }}
                  onBlur={(e) => setContentHtml(e.currentTarget.innerHTML)}
                />
                <p className={smartPoliceMutedTextClass}>แก้ข้อความบนหน้ากระดาษแล้วกดบันทึก — คืนต้นฉบับได้ทุกเมื่อ</p>
              </div>
            ) : (
              <p className={smartPoliceMutedTextClass}>
                ไฟล์ PDF แก้เนื้อหาในตัวเอกสารไม่ได้ในเบราว์เซอร์ — ดาวน์โหลดต้นฉบับไปแก้ในโปรแกรม PDF
                หรือใส่หมายเหตุสถานีด้านล่าง
              </p>
            )}
            <label className={smartPoliceLabelClass}>
              หมายเหตุสถานี
              <textarea
                className={cn(smartPoliceTextareaClass, "mt-1 min-h-[5rem]")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ข้อความกำกับ / จุดที่ต้องกรอก / แนวทางใช้ฟอร์มนี้"
              />
            </label>
          </div>
        ) : data.fileKind === "pdf" ? (
          <div className="mx-auto flex h-full min-h-[70vh] max-w-5xl flex-col gap-3">
            <iframe
              title={data.title}
              src={data.fileHref}
              className="min-h-[70vh] w-full flex-1 rounded-xl border border-slate-500/40 bg-white shadow-xl"
            />
            {notes.trim() ? (
              <div className="rounded-xl bg-white/95 p-4 text-sm text-[#1e1b4b] shadow">
                <p className="text-[10px] font-bold text-[#4d47b6]">หมายเหตุสถานี</p>
                <p className="mt-1 whitespace-pre-wrap">{notes}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <article className="mx-auto mb-6 max-w-[210mm] rounded-xl bg-white p-5 text-[#1e1b4b] shadow-xl sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#4d47b6]">{data.category}</p>
            <h1 className="mt-1 text-lg font-black tracking-tight">{data.title}</h1>
            <div
              className="prose prose-sm mt-4 max-w-none text-[14px] leading-relaxed [&_p]:mb-2 [&_table]:w-full [&_td]:border [&_td]:border-slate-200 [&_td]:p-1"
              dangerouslySetInnerHTML={{ __html: contentHtml || "<p>ไม่มีเนื้อหาพรีวิว</p>" }}
            />
            {notes.trim() ? (
              <div className="mt-6 border-t border-slate-200 pt-3 text-sm">
                <p className="text-[10px] font-bold text-[#4d47b6]">หมายเหตุสถานี</p>
                <p className="mt-1 whitespace-pre-wrap text-[#66638c]">{notes}</p>
              </div>
            ) : null}
          </article>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
