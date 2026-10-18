"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { openPrintableHtml } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  createEmptyPage,
  createEmptyQa,
  ensureStatementPagesDoc,
  getStatementTemplateMeta,
  isStatementDocumentV3,
  parseStatementDocumentContent,
  serializeStatementDocument,
  statementDocumentHasPages,
  type StatementDocumentContentV1,
  type StatementDocumentContentV3,
  type StatementHeaderFields,
  type StatementQaItem,
} from "@/lib/smart-police/form-templates";
import type { SmartPoliceCaseDetail, SmartPoliceDocumentDto } from "@/lib/smart-police/types";
import { OfficialStatementFormSheet } from "@/systems/smart-police/components/OfficialStatementFormSheet";
import {
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
} from "@/systems/smart-police/lib/ui-tokens";

type EditableDoc = StatementDocumentContentV1 | StatementDocumentContentV3;

function formTitleForSlug(slug: string): string {
  if (slug === "statement-suspect") return "บันทึกคำให้การของผู้ต้องหา";
  return "บันทึกคำให้การของผู้ร้องทุกข์ ผู้กล่าวโทษ หรือพยาน";
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
  const [content, setContent] = useState<EditableDoc | null>(null);
  const [wordFileUrl, setWordFileUrl] = useState<string | null>(null);
  const [wordFileName, setWordFileName] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

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
    const doc = json.case.documents.find((d) => d.id === documentId) as SmartPoliceDocumentDto | undefined;
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
    setWordFileUrl(doc.wordFileUrl);
    setWordFileName(doc.wordFileName);
    setContent(ensureStatementPagesDoc(parsed));
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
    window.setTimeout(() => setToast(null), 2500);
  }

  function patchHeader<K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) {
    setContent((c) => (c ? { ...c, header: { ...c.header, [key]: value } } : c));
    setDirty(true);
  }

  function updateQa(pageIdx: number, qaIdx: number, field: keyof StatementQaItem, value: string) {
    setContent((c) => {
      if (!c || !statementDocumentHasPages(c)) return c;
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
      if (!c || !statementDocumentHasPages(c)) return c;
      const pages = c.pages.map((p, pi) =>
        pi === pageIndex ? { ...p, qa: [...p.qa, createEmptyQa()] } : p,
      );
      return { ...c, pages };
    });
    setDirty(true);
  }

  function removeQa(qaIdx: number) {
    setContent((c) => {
      if (!c || !statementDocumentHasPages(c)) return c;
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
      if (!c || !statementDocumentHasPages(c)) return c;
      return { ...c, pages: [...c.pages, createEmptyPage([""])] };
    });
    setPageIndex((i) => i + 1);
    setDirty(true);
  }

  function removePage() {
    if (!content || !statementDocumentHasPages(content) || content.pages.length <= 1) return;
    if (!window.confirm("ลบหน้านี้?")) return;
    const nextPages = content.pages.filter((_, i) => i !== pageIndex);
    setContent({ ...content, pages: nextPages });
    setPageIndex((i) => Math.max(0, Math.min(i, nextPages.length - 1)));
    setDirty(true);
  }

  async function regenerateWord() {
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}/word`, {
      method: "POST",
    });
    if (!res.ok) {
      showToast("สร้างไฟล์ Word ไม่สำเร็จ");
      return null;
    }
    const json = (await res.json()) as {
      document: { wordFileUrl: string; wordFileName: string };
    };
    setWordFileUrl(json.document.wordFileUrl);
    setWordFileName(json.document.wordFileName);
    return json.document;
  }

  async function save() {
    if (!content) return;
    setSaving(true);

    let toSave: EditableDoc = content;
    if (isStatementDocumentV3(content)) {
      const { buildOfficialStatementFormHtml } = await import(
        "@/lib/smart-police/form-templates/official-statement-form-html"
      );
      toSave = {
        ...content,
        formHtml: buildOfficialStatementFormHtml({
          header: content.header,
          pages: content.pages,
          formTitle: formTitleForSlug(content.templateSlug),
        }),
      };
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
    if (!res.ok) {
      setSaving(false);
      showToast("บันทึกไม่สำเร็จ");
      return;
    }
    setDirty(false);
    await regenerateWord();
    setSaving(false);
    showToast("บันทึกแบบฟอร์มราชการเข้าสำนวนแล้ว");
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
    const { buildOfficialStatementFormHtml, wrapOfficialStatementPrintHtml } = await import(
      "@/lib/smart-police/form-templates/official-statement-form-html"
    );
    const body = buildOfficialStatementFormHtml({
      header: content.header,
      pages: content.pages,
      formTitle: formTitleForSlug(content.templateSlug),
    });
    openPrintableHtml(wrapOfficialStatementPrintHtml({ title: docTitle, bodyHtml: body }));
  }

  async function onUploadWord(file: File | null) {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}/upload-word`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      showToast("อัปโหลด Word ไม่สำเร็จ");
      return;
    }
    const json = (await res.json()) as {
      document: { wordFileUrl: string; wordFileName: string };
    };
    setWordFileUrl(json.document.wordFileUrl);
    setWordFileName(json.document.wordFileName);
    showToast("อัปโหลด Word เข้าสำนวนแล้ว");
  }

  const backHref = `/dashboard/smart-police/cases/${caseId}?tab=parties`;
  const previewHref = `/dashboard/smart-police/cases/${caseId}/documents/${documentId}`;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-800 text-slate-200">
        กำลังเปิดแบบฟอร์มราชการ…
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
  const isV3 = isStatementDocumentV3(content);
  const blankHref = isV3 ? content.blankFormHref : null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[#6b7280] text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-600/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">แบบฟอร์มราชการ · {meta.title}</p>
          <p className="truncate text-xs text-slate-400">
            สำนักงานตำรวจแห่งชาติ · {h.caseNumber} · {h.partyName}
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
          {blankHref ? (
            <a
              href={blankHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            >
              ไฟล์ Word ต้นฉบับ
            </a>
          ) : null}
          {wordFileUrl ? (
            <a
              href={wordFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(smartPoliceOutlineButtonClass, "border-emerald-500/50 bg-emerald-900/40 text-emerald-100")}
              title={wordFileName ?? "Word"}
            >
              Word ในสำนวน
            </a>
          ) : null}
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            onClick={() => uploadRef.current?.click()}
          >
            อัปโหลด Word
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              void onUploadWord(f);
            }}
          />
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

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-600/60 bg-slate-900/40 px-3 py-2 sm:px-5">
        <span className="text-[11px] font-semibold text-slate-400">หน้า</span>
        {content.pages.map((p, i) => (
          <button
            key={p.id}
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
          className={cn(smartPoliceOutlineButtonClass, "border-slate-500 text-slate-100")}
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
        <p className="ml-auto hidden text-[11px] text-slate-300 sm:block">
          กรอกช่องจุดไข่ปลาและถาม–ตอบบนแบบฟอร์ม · บันทึกเข้าสำนวน · พิมพ์ลงลายเซ็น
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#9ca3af] p-3 sm:p-6">
        <OfficialStatementFormSheet
          header={content.header}
          pages={content.pages}
          pageIndex={pageIndex}
          formTitle={formTitleForSlug(content.templateSlug)}
          onHeaderChange={patchHeader}
          onQaChange={updateQa}
          onAddQa={addQa}
          onRemoveQa={removeQa}
          className="mb-8"
        />
        <p className="mx-auto mb-6 max-w-[210mm] text-center text-[12px] text-slate-100">
          ชื่อเอกสาร:{" "}
          <input
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-[#1e1b4b]"
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
