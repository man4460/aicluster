"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { openPrintableHtml } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  createEmptyPage,
  createEmptyQa,
  isStatementDocumentV2,
  parseStatementDocumentContent,
  serializeStatementDocument,
  statementDocumentToPlainText,
  statementFormDocumentCss,
  type StatementDocumentContent,
  type StatementDocumentContentV1,
  type StatementDocumentContentV2,
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
  const bodyRef = useRef<HTMLDivElement>(null);

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
      setError("เอกสารนี้ยังไม่ใช่แม่แบบคำให้การ — สร้างใหม่จากปุ่ม «คำให้การ» ในเมนูบุคคล");
      return;
    }
    setDocTitle(doc.title);
    if (bodyRef.current) delete bodyRef.current.dataset.hydrated;
    setContent(parsed);
    setPageIndex(0);
    setDirty(false);
  }, [caseId, documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** ใส่ HTML แบบฟอร์มครั้งเดียวหลังโหลด — ห้ามผูก dangerouslySetInnerHTML ค้าง ไม่งั้นพิมพ์แล้วโดนรีเซ็ต */
  useEffect(() => {
    if (!content || !isStatementDocumentV2(content) || !bodyRef.current) return;
    if (bodyRef.current.dataset.hydrated === "1") return;
    bodyRef.current.innerHTML = content.bodyHtml;
    bodyRef.current.dataset.hydrated = "1";
  }, [content]);

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

  function syncBodyHtmlFromDom() {
    if (!content || !isStatementDocumentV2(content) || !bodyRef.current) return content;
    const html = bodyRef.current.innerHTML;
    const next: StatementDocumentContentV2 = { ...content, bodyHtml: html };
    setContent(next);
    return next;
  }

  function markBodyDirty() {
    setDirty(true);
  }

  // —— v1 helpers (legacy Q&A) ——
  function updateQa(pageIdx: number, qaIdx: number, field: "question" | "answer", value: string) {
    setContent((c) => {
      if (!c || isStatementDocumentV2(c)) return c;
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
      if (!c || isStatementDocumentV2(c)) return c;
      const pages = c.pages.map((p, pi) =>
        pi === pageIndex ? { ...p, qa: [...p.qa, createEmptyQa()] } : p,
      );
      return { ...c, pages };
    });
    setDirty(true);
  }

  function removeQa(qaIdx: number) {
    setContent((c) => {
      if (!c || isStatementDocumentV2(c)) return c;
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
      if (!c || isStatementDocumentV2(c)) return c;
      return { ...c, pages: [...c.pages, createEmptyPage([""])] };
    });
    setPageIndex((i) => i + 1);
    setDirty(true);
  }

  function removePage() {
    if (!content || isStatementDocumentV2(content) || content.pages.length <= 1) return;
    if (!window.confirm("ลบหน้านี้?")) return;
    const nextPages = content.pages.filter((_, i) => i !== pageIndex);
    setContent({ ...content, pages: nextPages });
    setPageIndex((i) => Math.max(0, Math.min(i, nextPages.length - 1)));
    setDirty(true);
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    let toSave = content;
    if (isStatementDocumentV2(content) && bodyRef.current) {
      toSave = { ...content, bodyHtml: bodyRef.current.innerHTML };
      setContent(toSave);
    }
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: docTitle,
        content: serializeStatementDocument(toSave),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      showToast("บันทึกไม่สำเร็จ");
      return;
    }
    setDirty(false);
    showToast("บันทึกไว้ในสำนวนแล้ว");
  }

  async function printDoc() {
    if (!content) return;
    if (dirty) await save();
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}/print`, {
      method: "POST",
    });
    if (res.ok) {
      const { html } = (await res.json()) as { html: string };
      openPrintableHtml(html);
      return;
    }
    if (isStatementDocumentV2(content)) {
      const body = bodyRef.current?.innerHTML ?? content.bodyHtml;
      openPrintableHtml(`<!doctype html><html lang="th"><head><meta charset="utf-8"/>
<title>${escapeHtml(docTitle)}</title>
<style>@page{size:A4;margin:14mm}${statementFormDocumentCss()}
body{margin:0;background:#fff}.sheet{max-width:210mm;margin:0 auto;padding:8mm}</style></head>
<body><div class="sheet">${body}</div>
<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>
</body></html>`);
      return;
    }
    openPrintableHtml(
      `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(docTitle)}</title>
<style>body{font-family:Tahoma,Sarabun,sans-serif;white-space:pre-wrap;padding:24px}</style></head>
<body>${escapeHtml(statementDocumentToPlainText(content))}</body></html>`,
    );
  }

  const backHref = `/dashboard/smart-police/cases/${caseId}?tab=parties`;
  const previewHref = `/dashboard/smart-police/cases/${caseId}/documents/${documentId}`;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-800 text-slate-200">
        กำลังเปิดแบบฟอร์มคำให้การ…
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-slate-800 text-slate-100">
        <p className="max-w-md px-4 text-center text-sm">{error ?? "ไม่พบข้อมูล"}</p>
        <Link href={backHref} className="underline">
          กลับเมนูบุคคล
        </Link>
      </div>
    );
  }

  const meta = getStatementTemplateMeta(content.templateSlug);
  const h = content.header;
  const isV2 = isStatementDocumentV2(content);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-700 text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-600/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">{meta.title}</p>
          <p className="truncate text-xs text-slate-400">
            {isV2 ? `แบบฟอร์ม: ${content.blankFormTitle}` : "รูปแบบถาม–ตอบ (เดิม)"}
            {" · "}
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
            ดูก่อนพิมพ์
          </Link>
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            onClick={() => void printDoc()}
          >
            พิมพ์ลงลายเซ็น
          </button>
          <button
            type="button"
            className={smartPolicePrimaryButtonClass}
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            {saving ? "…" : "บันทึกเข้าสำนวน"}
          </button>
        </div>
      </header>

      {!isV2 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-600/60 bg-slate-900/40 px-3 py-2 sm:px-5">
          <span className="text-[11px] font-semibold text-slate-400">หน้า</span>
          {(content as StatementDocumentContentV1).pages.map((_, i) => (
            <button
              key={(content as StatementDocumentContentV1).pages[i]!.id}
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
          <button type="button" className={cn(smartPoliceOutlineButtonClass, "border-slate-500 text-slate-100")} onClick={addPage}>
            + เพิ่มหน้า
          </button>
          {(content as StatementDocumentContentV1).pages.length > 1 ? (
            <button type="button" className={cn(smartPoliceOutlineButtonClass, "border-rose-400/50 text-rose-100")} onClick={removePage}>
              ลบหน้านี้
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#5c6570] p-3 sm:p-6">
        {isV2 ? (
          <div className="mx-auto mb-8 w-full max-w-[210mm]">
            <p className="mb-2 text-center text-[11px] text-slate-200">
              คลิกในแบบฟอร์มแล้วพิมพ์ได้เหมือน Word — ช่องว่าง/ตารางแก้ได้ · กดบันทึกเมื่อเสร็จ · พิมพ์ให้ลงลายเซ็น
            </p>
            <div
              ref={bodyRef}
              className="min-h-[297mm] bg-white px-[12mm] py-[14mm] text-[#111] shadow-2xl outline-none ring-offset-2 focus-within:ring-2 focus-within:ring-sky-300/60"
              contentEditable
              suppressContentEditableWarning
              onInput={markBodyDirty}
              onBlur={() => {
                syncBodyHtmlFromDom();
              }}
            />
            <p className={cn(smartPoliceMutedTextClass, "mt-3 text-center text-slate-200")}>
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
        ) : (
          <LegacyQaEditor
            content={content as StatementDocumentContentV1}
            pageIndex={pageIndex}
            metaTitle={meta.title}
            docTitle={docTitle}
            setDocTitle={(t) => {
              setDocTitle(t);
              setDirty(true);
            }}
            patchHeader={patchHeader}
            updateQa={updateQa}
            addQa={addQa}
            removeQa={removeQa}
          />
        )}
      </div>
    </div>
  );
}

function LegacyQaEditor({
  content,
  pageIndex,
  metaTitle,
  docTitle,
  setDocTitle,
  patchHeader,
  updateQa,
  addQa,
  removeQa,
}: {
  content: StatementDocumentContentV1;
  pageIndex: number;
  metaTitle: string;
  docTitle: string;
  setDocTitle: (t: string) => void;
  patchHeader: <K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) => void;
  updateQa: (pageIdx: number, qaIdx: number, field: "question" | "answer", value: string) => void;
  addQa: () => void;
  removeQa: (qaIdx: number) => void;
}) {
  const h = content.header;
  const page = content.pages[pageIndex];
  if (!page) return null;
  const addr = [h.stationAddress, h.province].filter(Boolean).join(" ");

  return (
    <article className="mx-auto mb-8 w-full max-w-[210mm] bg-white px-[14mm] py-[16mm] text-[#111] shadow-xl">
      <header className="text-center">
        <h1 className="text-lg font-bold">{h.stationName}</h1>
        {addr ? <p className="text-[13px] text-slate-600">{addr}</p> : null}
        <h2 className="mt-3 text-xl font-bold">{metaTitle}</h2>
        <p className="text-[14px] text-slate-600">
          เลขที่คดี {h.caseNumber} · เรื่อง {h.caseTitle}
        </p>
      </header>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <HeaderField label="ชื่อ-สกุล" value={h.partyName} onChange={(v) => patchHeader("partyName", v)} />
        <HeaderField label="ข้อหา" value={h.chargeText} onChange={(v) => patchHeader("chargeText", v)} className="sm:col-span-2" />
      </div>
      <div className="mt-4 space-y-3">
        {page.qa.map((qa, qi) => (
          <div key={qa.id} className="overflow-hidden rounded-lg border border-slate-300">
            <div className="flex gap-2 bg-sky-50 px-2 py-2">
              <span className="pt-1.5 text-[12px] font-bold">ถาม {qi + 1}</span>
              <textarea
                className={cn(smartPoliceTextareaClass, "min-h-[2.5rem] flex-1")}
                value={qa.question}
                onChange={(e) => updateQa(pageIndex, qi, "question", e.target.value)}
              />
              {page.qa.length > 1 ? (
                <button type="button" className="text-[11px] font-bold text-rose-600" onClick={() => removeQa(qi)}>
                  ลบ
                </button>
              ) : null}
            </div>
            <div className="flex gap-2 px-2 py-2">
              <span className="pt-1.5 text-[12px] font-bold">ตอบ</span>
              <textarea
                className={cn(smartPoliceTextareaClass, "min-h-[4.5rem] flex-1")}
                value={qa.answer}
                onChange={(e) => updateQa(pageIndex, qi, "answer", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className={cn(smartPoliceOutlineButtonClass, "mt-3")} onClick={addQa}>
        + เพิ่มถาม–ตอบ
      </button>
      <p className="mt-4 text-center text-sm text-slate-500">
        ชื่อเอกสาร:{" "}
        <input className="rounded border px-2 py-1" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
      </p>
    </article>
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
