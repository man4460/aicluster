"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { openPrintableHtml } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  createEmptyPage,
  createEmptyQa,
  getStatementTemplateMeta,
  isStatementDocumentV2,
  parseStatementDocumentContent,
  serializeStatementDocument,
  type StatementDocumentContentV1,
  type StatementHeaderFields,
} from "@/lib/smart-police/form-templates";
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
  const [content, setContent] = useState<StatementDocumentContentV1 | null>(null);
  const [legacyHtml, setLegacyHtml] = useState<string | null>(null);
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
      setError("เอกสารนี้ยังไม่ใช่แม่แบบคำให้การ — สร้างใหม่จากปุ่ม «คำให้การ» ในเมนูบุคคล");
      return;
    }
    setDocTitle(doc.title);
    if (isStatementDocumentV2(parsed)) {
      setLegacyHtml(parsed.bodyHtml);
      setContent({
        templateSlug: parsed.templateSlug,
        version: 1,
        header: parsed.header,
        pages: [
          createEmptyPage([
            "ขอทราบรายละเอียดเหตุการณ์ตามที่ทราบ",
            "มีพยานหรือหลักฐานเกี่ยวข้องอย่างไร",
          ]),
        ],
      });
    } else {
      setLegacyHtml(null);
      setContent(parsed);
    }
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
    setContent((c) => (c ? { ...c, header: { ...c.header, [key]: value } } : c));
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
    setLegacyHtml(null);
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
    openPrintableHtml(
      `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(docTitle)}</title>
<style>body{font-family:"TH Sarabun New",Sarabun,Tahoma,sans-serif;padding:24px;line-height:1.5}
.q{background:#e0f2fe;border:1px solid #334155;padding:8px;margin-top:12px;font-weight:600}
.a{border:1px solid #334155;border-top:0;padding:8px;min-height:2.5em;white-space:pre-wrap}</style></head>
<body><h1>${escapeHtml(getStatementTemplateMeta(content.templateSlug).title)}</h1>
<p>เลขที่คดี ${escapeHtml(content.header.caseNumber)} · ${escapeHtml(content.header.partyName)}</p>
${content.pages
  .flatMap((p) => p.qa)
  .map(
    (qa, i) =>
      `<div class="q">ถาม ${i + 1}. ${escapeHtml(qa.question || "…")}</div><div class="a">ตอบ ${escapeHtml(qa.answer || "…")}</div>`,
  )
  .join("")}
<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>
</body></html>`,
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
  const page = content.pages[pageIndex];
  const addr = [h.stationAddress, h.province].filter(Boolean).join(" ");
  let qaOffset = 0;
  for (let i = 0; i < pageIndex; i++) qaOffset += content.pages[i]?.qa.length ?? 0;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-700 text-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-600/80 bg-slate-800 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:text-base">{meta.title}</p>
          <p className="truncate text-xs text-slate-400">
            แบบจำลองฟอร์ม · เติมจากคดีแล้ว · พิมพ์ถาม–ตอบได้
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#5c6570] p-3 sm:p-6">
        {legacyHtml ? (
          <p className="mx-auto mb-3 max-w-[210mm] rounded-lg bg-amber-50 px-3 py-2 text-center text-[12px] text-amber-900">
            เอกสารเก่าเป็น HTML จาก Word — ใช้แบบจำลองถาม–ตอบด้านล่างแทน แล้วกดบันทึกเพื่ออัปเดตสำนวน
          </p>
        ) : null}

        <article className="mx-auto mb-8 w-full max-w-[210mm] bg-white px-[14mm] py-[16mm] text-[#111] shadow-xl">
          <header className="grid grid-cols-[56px_1fr_100px] items-start gap-2">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-400 text-center text-[10px] text-slate-500"
              aria-hidden
            >
              ตรา
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold sm:text-xl">{h.stationName}</h1>
              {addr ? <p className="text-[13px] text-slate-600">{addr}</p> : null}
              {h.commanderLine ? <p className="text-[13px] text-slate-600">{h.commanderLine}</p> : null}
            </div>
            <div className="text-right text-[11px] text-slate-600">
              เลขที่คดี
              <br />
              <strong className="text-slate-800">{h.caseNumber}</strong>
            </div>
          </header>

          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold sm:text-2xl">บันทึกคำให้การ</h2>
            <p className="mt-0.5 text-[15px] font-semibold text-slate-700">{meta.title}</p>
            <p className="text-[14px] text-slate-600">เรื่อง {h.caseTitle}</p>
            <p className="text-[13px] text-slate-500">
              {h.caseType}
              {h.chargeText ? ` · ข้อหา ${h.chargeText}` : ""}
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <p className="mb-2 text-[12px] font-bold text-[#4d47b6]">ข้อมูลผู้ให้การ (ดึงจากคดี — แก้ได้)</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <HeaderField label="คำให้การของ" value={h.partyName} onChange={(v) => patchHeader("partyName", v)} />
              <HeaderField label="เป็น" value={h.partyRoleLabel} readOnly />
              <HeaderField label="อายุ" value={h.partyAge} onChange={(v) => patchHeader("partyAge", v)} />
              <HeaderField
                label="สัญชาติ"
                value={h.partyNationality}
                onChange={(v) => patchHeader("partyNationality", v)}
              />
              <HeaderField
                label="หมายเลขโทรศัพท์"
                value={h.partyPhone}
                onChange={(v) => patchHeader("partyPhone", v)}
              />
              <HeaderField
                label="บัตรประจำตัวประชาชน"
                value={h.partyIdCard}
                onChange={(v) => patchHeader("partyIdCard", v)}
              />
              <HeaderField
                label="อาชีพ"
                value={h.partyOccupation}
                onChange={(v) => patchHeader("partyOccupation", v)}
              />
              <HeaderField
                label="สถานที่ทำงาน"
                value={h.partyWorkplace}
                onChange={(v) => patchHeader("partyWorkplace", v)}
              />
              <HeaderField
                label="ที่อยู่"
                value={h.partyAddress}
                onChange={(v) => patchHeader("partyAddress", v)}
                className="sm:col-span-2"
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

          <hr className="my-4 border-slate-300" />

          <p className="mb-2 text-center text-[13px] font-semibold text-slate-600">
            บันทึกการสอบปากคำ (ถาม / ตอบ) — พิมพ์หรือแก้ได้เลย
          </p>

          {!page ? null : (
            <div className="space-y-3">
              {page.qa.map((qa, qi) => {
                const no = qaOffset + qi + 1;
                return (
                  <div key={qa.id} className="overflow-hidden rounded-lg border border-slate-700">
                    <div className="flex gap-2 bg-sky-50 px-2 py-2">
                      <span className="shrink-0 pt-2 text-[13px] font-bold text-slate-800">ถาม {no}.</span>
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
                      <span className="shrink-0 pt-2 text-[13px] font-bold text-slate-800">ตอบ</span>
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

          <div className="mt-8 grid grid-cols-2 gap-6 text-center text-[13px] text-slate-600">
            <div>
              <p>ลงชื่อผู้ให้การ</p>
              <p className="mt-6 border-b border-dotted border-slate-400" />
              <p className="mt-1">({h.partyName || "………………"})</p>
            </div>
            <div>
              <p>ลงชื่อพนักงานสอบสวน</p>
              <p className="mt-6 border-b border-dotted border-slate-400" />
              <p className="mt-1">({h.investigator || "………………"})</p>
            </div>
          </div>

          <p className={cn(smartPoliceMutedTextClass, "mt-6 text-center")}>
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
