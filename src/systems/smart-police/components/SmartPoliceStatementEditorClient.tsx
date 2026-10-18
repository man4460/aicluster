"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { openPrintableHtml } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  createEmptyPage,
  createEmptyQa,
  parseStatementDocumentContent,
  serializeStatementDocument,
  statementDocumentToPlainText,
  type StatementDocumentContent,
  type StatementHeaderFields,
} from "@/lib/smart-police/form-templates";
import { getStatementTemplateMeta } from "@/lib/smart-police/form-templates";
import type { SmartPoliceCaseDetail } from "@/lib/smart-police/types";
import {
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";

const dotted =
  "border-b border-dotted border-slate-400 pb-0.5 min-h-[1.35em] w-full bg-transparent text-[#1e293b] outline-none focus:border-[#5b61ff]";

function HeaderField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("min-w-0", className)}>
      <span className="block text-[13px] font-semibold text-slate-800">{label}</span>
      <input className={cn("mt-0.5 text-[15px]", dotted)} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SmartPoliceStatementEditorClient({
  caseId,
  documentId,
}: {
  caseId: string;
  documentId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [content, setContent] = useState<StatementDocumentContent | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/smart-police/cases/${caseId}`, { cache: "no-store" });
    setLoading(false);
    if (!res.ok) {
      setError("โหลดคดีไม่สำเร็จ");
      return;
    }
    const json = (await res.json()) as { case: SmartPoliceCaseDetail };
    const doc = json.case.documents.find((d) => d.id === documentId);
    if (!doc) {
      setError("ไม่พบเอกสารคำให้การ");
      return;
    }
    const parsed = parseStatementDocumentContent(doc.content);
    if (!parsed) {
      setError("เอกสารนี้ยังไม่ใช่แม่แบบ HTML คำให้การ — สร้างคำให้การใหม่จากปุ่มในคดี");
      return;
    }
    setDocTitle(doc.title);
    setContent(parsed);
    setPageIndex(0);
    setDirty(false);
  }, [caseId, documentId]);

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

  function patchHeader<K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) {
    setContent((c) => {
      if (!c) return c;
      return { ...c, header: { ...c.header, [key]: value } };
    });
    setDirty(true);
  }

  function updateQa(pageIdx: number, qaIdx: number, field: "question" | "answer", value: string) {
    setContent((c) => {
      if (!c) return c;
      const pages = c.pages.map((p, pi) => {
        if (pi !== pageIdx) return p;
        return {
          ...p,
          qa: p.qa.map((q, qi) => (qi === qaIdx ? { ...q, [field]: value } : q)),
        };
      });
      return { ...c, pages };
    });
    setDirty(true);
  }

  function addQa() {
    setContent((c) => {
      if (!c) return c;
      const pages = c.pages.map((p, pi) =>
        pi === pageIndex ? { ...p, qa: [...p.qa, createEmptyQa()] } : p,
      );
      return { ...c, pages };
    });
    setDirty(true);
  }

  function removeQa(qaIdx: number) {
    setContent((c) => {
      if (!c) return c;
      const pages = c.pages.map((p, pi) => {
        if (pi !== pageIndex) return p;
        if (p.qa.length <= 1) return p;
        return { ...p, qa: p.qa.filter((_, i) => i !== qaIdx) };
      });
      return { ...c, pages };
    });
    setDirty(true);
  }

  function addPage() {
    setContent((c) => {
      if (!c) return c;
      return { ...c, pages: [...c.pages, createEmptyPage([""])] };
    });
    setPageIndex((i) => i + 1);
    setDirty(true);
  }

  function removePage() {
    if (!content || content.pages.length <= 1) return;
    if (!window.confirm("ลบหน้านี้?")) return;
    const nextPages = content.pages.filter((_, i) => i !== pageIndex);
    setContent({ ...content, pages: nextPages });
    setPageIndex((i) => Math.max(0, Math.min(i, nextPages.length - 1)));
    setDirty(true);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: docTitle,
        content: serializeStatementDocument(content),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      showToast("บันทึกไม่สำเร็จ");
      return;
    }
    setDirty(false);
    showToast("บันทึกแล้ว");
  }

  async function printDoc() {
    if (!content) return;
    if (dirty) await save();
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}/print`, {
      method: "POST",
    });
    if (!res.ok) {
      // fallback local print from plain text sheet via openPrintableHtml built client-side
      const plain = statementDocumentToPlainText(content);
      openPrintableHtml(
        `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(docTitle)}</title>
<style>body{font-family:Tahoma,Sarabun,sans-serif;white-space:pre-wrap;padding:24px;line-height:1.5}</style></head>
<body>${escapeHtml(plain)}</body></html>`,
      );
      return;
    }
    const { html } = (await res.json()) as { html: string };
    openPrintableHtml(html);
  }

  const meta = useMemo(
    () => (content ? getStatementTemplateMeta(content.templateSlug) : null),
    [content],
  );
  const page = content?.pages[pageIndex] ?? null;
  const backHref = `/dashboard/smart-police/cases/${caseId}?tab=docs`;
  const previewHref = `/dashboard/smart-police/cases/${caseId}/documents/${documentId}`;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-800 text-slate-200">
        กำลังโหลดคำให้การ…
      </div>
    );
  }

  if (error || !content || !page) {
    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-slate-800 text-slate-100">
        <p className="max-w-md px-4 text-center text-sm">{error ?? "ไม่พบข้อมูล"}</p>
        <Link href={backHref} className="underline">
          กลับคดี
        </Link>
      </div>
    );
  }

  const h = content.header;
  const addr = [h.stationAddress, h.province].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-800 text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">{meta?.title ?? "คำให้การ"}</p>
          <p className="truncate text-xs text-slate-400">
            {h.caseNumber} · {h.partyName}
            {dirty ? " · ยังไม่บันทึก" : ""}
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
            className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-600 bg-slate-700/60 px-3 text-sm font-semibold"
          >
            ✕ ปิด
          </Link>
          <Link
            href={previewHref}
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
          >
            ดู A4
          </Link>
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            onClick={() => void printDoc()}
          >
            พิมพ์
          </button>
          <button
            type="button"
            className={smartPolicePrimaryButtonClass}
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            {saving ? "…" : "บันทึก"}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-700/60 bg-slate-900/40 px-3 py-2 sm:px-5">
        <span className="text-[11px] font-semibold text-slate-400">หน้า</span>
        {content.pages.map((_, i) => (
          <button
            key={content.pages[i]!.id}
            type="button"
            className={cn(
              "min-h-8 min-w-8 rounded-lg px-2 text-xs font-bold",
              i === pageIndex ? "bg-white text-[#4d47b6]" : "bg-slate-700 text-slate-200",
            )}
            onClick={() => setPageIndex(i)}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
          onClick={addPage}
        >
          + เพิ่มหน้า
        </button>
        {content.pages.length > 1 ? (
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-rose-400/50 text-rose-100")}
            onClick={removePage}
          >
            ลบหน้านี้
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-600/90 p-3 sm:p-6">
        <article className="mx-auto mb-8 w-full max-w-[210mm] bg-white px-[14mm] py-[16mm] text-[#111] shadow-xl">
          <header className="grid grid-cols-[64px_1fr_120px] items-start gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-400 text-center text-[11px] text-slate-500"
              aria-hidden
            >
              โลโก้
            </div>
            <div className="text-center">
              <input
                className="w-full border-0 bg-transparent text-center text-lg font-bold tracking-tight text-slate-900 outline-none sm:text-xl"
                value={h.stationName}
                onChange={(e) => patchHeader("stationName", e.target.value)}
              />
              {addr || true ? (
                <p className="mt-0.5 text-[13px] text-slate-600">
                  <input
                    className="w-full border-0 bg-transparent text-center outline-none"
                    placeholder="ที่อยู่สถานี"
                    value={h.stationAddress}
                    onChange={(e) => patchHeader("stationAddress", e.target.value)}
                  />
                </p>
              ) : null}
              <input
                className="w-full border-0 bg-transparent text-center text-[13px] text-slate-600 outline-none"
                placeholder="ผู้บังคับบัญชา"
                value={h.commanderLine}
                onChange={(e) => patchHeader("commanderLine", e.target.value)}
              />
            </div>
            <div className="text-right text-[12px] text-slate-600">
              เลขที่คดี
              <br />
              <strong className="text-slate-800">{h.caseNumber}</strong>
            </div>
          </header>

          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {meta?.title ?? "คำให้การ"}
            </h2>
            <p className="mt-1 text-[14px] text-slate-600">
              เลขที่คดี {h.caseNumber} · {h.caseType}
            </p>
            <p className="text-[14px] text-slate-600">
              เรื่อง{" "}
              <input
                className="inline-block min-w-[12rem] border-b border-dotted border-slate-400 bg-transparent text-center outline-none"
                value={h.caseTitle}
                onChange={(e) => patchHeader("caseTitle", e.target.value)}
              />
            </p>
            {content.pages.length > 1 ? (
              <p className="mt-1 text-[12px] font-semibold text-[#4d47b6]">
                หน้า {pageIndex + 1} / {content.pages.length}
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
            <HeaderField label="ชื่อ-สกุล" value={h.partyName} onChange={(v) => patchHeader("partyName", v)} />
            <HeaderField label="บทบาท" value={h.partyRoleLabel} onChange={(v) => patchHeader("partyRoleLabel", v)} />
            <HeaderField label="อายุ" value={h.partyAge} onChange={(v) => patchHeader("partyAge", v)} />
            <HeaderField
              label="สัญชาติ"
              value={h.partyNationality}
              onChange={(v) => patchHeader("partyNationality", v)}
            />
            <HeaderField
              label="เลขบัตรประชาชน"
              value={h.partyIdCard}
              onChange={(v) => patchHeader("partyIdCard", v)}
            />
            <HeaderField label="โทรศัพท์" value={h.partyPhone} onChange={(v) => patchHeader("partyPhone", v)} />
            <HeaderField
              label="ที่อยู่"
              value={h.partyAddress}
              onChange={(v) => patchHeader("partyAddress", v)}
              className="sm:col-span-2"
            />
            <HeaderField label="ข้อหา" value={h.chargeText} onChange={(v) => patchHeader("chargeText", v)} className="sm:col-span-2" />
            <HeaderField
              label="กฎหมายที่อ้าง"
              value={h.lawRefs}
              onChange={(v) => patchHeader("lawRefs", v)}
              className="sm:col-span-2"
            />
            <HeaderField
              label="พนักงานสอบสวน"
              value={h.investigator}
              onChange={(v) => patchHeader("investigator", v)}
            />
            <HeaderField label="วันที่" value={h.todayThai} onChange={(v) => patchHeader("todayThai", v)} />
          </div>

          <hr className="my-4 border-slate-300" />
          <p className="text-center text-[13px] text-slate-500">ข้าพเจ้าขอให้การต่อพนักงานสอบสวนว่า</p>

          <div className="mt-3 space-y-3">
            {page.qa.map((qa, qi) => (
              <div key={qa.id} className="rounded-lg border border-slate-300 overflow-hidden">
                <div className="flex items-start gap-2 bg-sky-50 px-2 py-2">
                  <span className="shrink-0 pt-1.5 text-[12px] font-bold text-slate-700">ถาม {qi + 1}</span>
                  <textarea
                    className={cn(smartPoliceTextareaClass, "min-h-[2.5rem] flex-1 border-sky-200 bg-white text-[14px]")}
                    placeholder="คำถามพนักงานสอบสวน"
                    value={qa.question}
                    onChange={(e) => updateQa(pageIndex, qi, "question", e.target.value)}
                  />
                  {page.qa.length > 1 ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                      aria-label={`ลบคำถาม ${qi + 1}`}
                      onClick={() => removeQa(qi)}
                    >
                      ลบ
                    </button>
                  ) : null}
                </div>
                <div className="flex items-start gap-2 bg-white px-2 py-2">
                  <span className="shrink-0 pt-1.5 text-[12px] font-bold text-slate-700">ตอบ</span>
                  <textarea
                    className={cn(smartPoliceTextareaClass, "min-h-[4.5rem] flex-1 text-[14px]")}
                    placeholder="คำตอบผู้ให้การ"
                    value={qa.answer}
                    onChange={(e) => updateQa(pageIndex, qi, "answer", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={smartPoliceOutlineButtonClass} onClick={addQa}>
              + เพิ่มถาม–ตอบ
            </button>
          </div>

          <p className="mt-6 text-justify text-[15px]">
            ข้าพเจ้าได้อ่านคำให้การนี้แล้ว ยืนยันว่าเป็นความจริงทุกประการ
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p>ลงชื่อผู้ให้การ</p>
              <div className="mt-2 border-b border-dotted border-slate-400" aria-hidden />
              <p className="mt-1 text-center">({h.partyName || "……………………………………"})</p>
            </div>
            <div>
              <p>ลงชื่อพนักงานสอบสวน</p>
              <div className="mt-2 border-b border-dotted border-slate-400" aria-hidden />
              <p className="mt-1 text-center">({h.investigator || "……………………………………"})</p>
            </div>
          </div>
          <p className="mt-6 text-center">วันที่ {h.todayThai}</p>
        </article>

        <p className={cn(smartPoliceMutedTextClass, "mx-auto mb-4 max-w-[210mm] text-center text-slate-200")}>
          ชื่อเอกสาร:{" "}
          <input
            className="rounded border border-slate-400 bg-white/90 px-2 py-1 text-sm text-[#1e1b4b]"
            value={docTitle}
            onChange={(e) => {
              setDocTitle(e.target.value);
              setDirty(true);
            }}
          />
        </p>
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
