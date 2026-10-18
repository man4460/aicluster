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
} from "@/lib/smart-police/form-templates";
import type { SmartPoliceCaseDetail, SmartPoliceDocumentDto } from "@/lib/smart-police/types";
import {
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePrimaryButtonClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";

const dotted =
  "border-b border-dotted border-slate-400 pb-0.5 min-h-[1.35em] w-full bg-transparent text-[#1e293b] outline-none focus:border-[#5b61ff]";

type EditableDoc = StatementDocumentContentV1 | StatementDocumentContentV3;

function HeaderField({
  label,
  value,
  onChange,
  className,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  readOnly?: boolean;
}) {
  return (
    <label className={cn("min-w-0", className)}>
      <span className="block text-[13px] font-semibold text-slate-800">{label}</span>
      {readOnly || !onChange ? (
        <span className={cn("mt-0.5 block text-[15px]", dotted, "border-b-0")}>{value || "—"}</span>
      ) : (
        <input
          className={cn("mt-0.5 text-[15px]", dotted)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
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

  function updateQa(pageIdx: number, qaIdx: number, field: "question" | "answer", value: string) {
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
      document: { wordFileUrl: string; wordFileName: string; downloadUrl?: string };
    };
    setWordFileUrl(json.document.wordFileUrl);
    setWordFileName(json.document.wordFileName);
    return json.document;
  }

  async function save(opts?: { alsoWord?: boolean }) {
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
    if (!res.ok) {
      setSaving(false);
      showToast("บันทึกไม่สำเร็จ");
      return;
    }
    setDirty(false);
    if (opts?.alsoWord !== false) {
      await regenerateWord();
      showToast("บันทึกเข้าสำนวนแล้ว · อัปเดตไฟล์ Word แล้ว");
    } else {
      showToast("บันทึกเข้าสำนวนแล้ว");
    }
    setSaving(false);
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
    showToast("พิมพ์ไม่สำเร็จ");
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
  const page = content.pages[pageIndex];
  const isV3 = isStatementDocumentV3(content);
  const blankHref = isV3 ? content.blankFormHref : null;
  const blankTitle = isV3 ? content.blankFormTitle : meta.title;
  let qaOffset = 0;
  for (let i = 0; i < pageIndex; i++) qaOffset += content.pages[i]?.qa.length ?? 0;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-700 text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-600/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">{meta.title}</p>
          <p className="truncate text-xs text-slate-400">
            ฟอร์ม Word: {blankTitle}
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
          {blankHref ? (
            <a
              href={blankHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            >
              เปิดฟอร์ม Word ต้นฉบับ
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
              ดาวน์โหลด Word ในสำนวน
            </a>
          ) : null}
          <button
            type="button"
            className={cn(smartPoliceOutlineButtonClass, "border-slate-500 bg-slate-700/50 text-slate-100")}
            onClick={() => uploadRef.current?.click()}
          >
            อัปโหลด Word กลับ
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
            onClick={() => void save({ alsoWord: true })}
          >
            {saving ? "…" : "บันทึกเข้าสำนวน + Word"}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-600/60 bg-slate-900/40 px-3 py-2 sm:px-5">
        <span className="text-[11px] font-semibold text-slate-400">หน้าถาม–ตอบ</span>
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
        <p className="ml-auto hidden text-[11px] text-slate-400 sm:block">
          พิมพ์ถาม–ตอบในระบบ → บันทึก → ได้ไฟล์ Word ในสำนวน · หรือเปิด Word ต้นฉบับแล้วอัปโหลดกลับ
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#5c6570] p-3 sm:p-6">
        <div className="mx-auto mb-8 grid w-full max-w-[1100px] gap-4 lg:grid-cols-2">
          {/* ฟอร์ม Word จริง */}
          <section className="min-w-0">
            <p className="mb-2 text-center text-[12px] font-semibold text-slate-200">
              แบบฟอร์ม Word จริง — {blankTitle}
            </p>
            <div className="overflow-auto rounded-lg bg-white p-3 shadow-xl sm:p-4">
              {isV3 && content.formHtml ? (
                <div
                  className="sp-form-preview text-[13px] text-[#111] [&_table]:w-full [&_td]:border [&_td]:border-slate-500 [&_td]:p-1 [&_th]:border [&_th]:border-slate-500 [&_th]:p-1"
                  dangerouslySetInnerHTML={{ __html: content.formHtml }}
                />
              ) : (
                <p className="p-6 text-center text-sm text-slate-500">
                  ไม่มีพรีวิวฟอร์ม — เปิดไฟล์ Word ต้นฉบับจากปุ่มด้านบน
                </p>
              )}
            </div>
          </section>

          {/* ถาม–ตอบ ในระบบ */}
          <section className="min-w-0">
            <article className="rounded-lg bg-white px-4 py-5 text-[#111] shadow-xl sm:px-5">
              <h2 className="text-center text-lg font-bold">{meta.title}</h2>
              <p className="mt-1 text-center text-[13px] text-slate-600">
                เลขที่คดี {h.caseNumber} · เรื่อง {h.caseTitle}
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <p className="mb-2 text-[12px] font-bold text-[#4d47b6]">ข้อมูลจากคดี (แก้ได้)</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <HeaderField label="คำให้การของ" value={h.partyName} onChange={(v) => patchHeader("partyName", v)} />
                  <HeaderField label="เป็น" value={h.partyRoleLabel} readOnly />
                  <HeaderField
                    label="โทรศัพท์"
                    value={h.partyPhone}
                    onChange={(v) => patchHeader("partyPhone", v)}
                  />
                  <HeaderField
                    label="บัตรประชาชน"
                    value={h.partyIdCard}
                    onChange={(v) => patchHeader("partyIdCard", v)}
                  />
                  <HeaderField
                    label="ข้อหา"
                    value={h.chargeText}
                    onChange={(v) => patchHeader("chargeText", v)}
                    className="sm:col-span-2"
                  />
                  <HeaderField
                    label="พนักงานสอบสวน"
                    value={h.investigator}
                    onChange={(v) => patchHeader("investigator", v)}
                  />
                  <HeaderField label="วันที่" value={h.todayThai} onChange={(v) => patchHeader("todayThai", v)} />
                </div>
              </div>

              <p className="mb-2 mt-4 text-center text-[13px] font-semibold text-slate-600">
                บันทึกถาม / ตอบ — พิมพ์ได้เลย
              </p>

              {!page ? null : (
                <div className="space-y-3">
                  {page.qa.map((qa, qi) => {
                    const no = qaOffset + qi + 1;
                    return (
                      <div key={qa.id} className="overflow-hidden rounded-lg border border-slate-700">
                        <div className="flex gap-2 bg-sky-50 px-2 py-2">
                          <span className="shrink-0 pt-2 text-[13px] font-bold">ถาม {no}.</span>
                          <textarea
                            className={cn(smartPoliceTextareaClass, "min-h-[2.75rem] flex-1 border-sky-200 bg-white")}
                            placeholder="พิมพ์คำถาม…"
                            value={qa.question}
                            onChange={(e) => updateQa(pageIndex, qi, "question", e.target.value)}
                          />
                          {page.qa.length > 1 ? (
                            <button
                              type="button"
                              className="shrink-0 self-start pt-2 text-[11px] font-bold text-rose-600"
                              onClick={() => removeQa(qi)}
                            >
                              ลบ
                            </button>
                          ) : null}
                        </div>
                        <div className="flex gap-2 bg-white px-2 py-2">
                          <span className="shrink-0 pt-2 text-[13px] font-bold">ตอบ</span>
                          <textarea
                            className={cn(smartPoliceTextareaClass, "min-h-[5rem] flex-1")}
                            placeholder="พิมพ์คำตอบ / คำให้การ…"
                            value={qa.answer}
                            onChange={(e) => updateQa(pageIndex, qi, "answer", e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button type="button" className={cn(smartPoliceOutlineButtonClass, "mt-3")} onClick={addQa}>
                + เพิ่มถาม–ตอบ
              </button>

              <p className={cn(smartPoliceMutedTextClass, "mt-4 text-center text-[12px]")}>
                ชื่อเอกสาร:{" "}
                <input
                  className="rounded border border-slate-300 px-2 py-1 text-sm text-[#1e1b4b]"
                  value={docTitle}
                  onChange={(e) => {
                    setDocTitle(e.target.value);
                    setDirty(true);
                  }}
                />
              </p>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
