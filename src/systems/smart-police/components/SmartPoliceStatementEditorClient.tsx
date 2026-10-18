"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  createEmptyPage,
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
import { smartPolicePrimaryButtonClass } from "@/systems/smart-police/lib/ui-tokens";

/**
 * ฟอร์มเว็บกรอกข้อมูล → Backend เติมแท็กในแม่แบบ .docx ราชการ (docxtemplater)
 * ไม่ใช้พรีวิว HTML วาดเลียนแบบกระดาษ (เพี้ยน) — เปิดไฟล์ Word จริงถึงจะเหมือน 100%
 */

const toolbarBtnClass =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-500 bg-slate-700 px-3 text-sm font-semibold text-white hover:bg-slate-600";
const toolbarBtnEmeraldClass =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-900/70 px-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800/80";

type EditableDoc = StatementDocumentContentV1 | StatementDocumentContentV3;

const fieldClass =
  "min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#1e1b4b] outline-none focus:border-[#4d47b6] focus:ring-2 focus:ring-[#4d47b6]/20";
const labelClass = "mb-1 block text-xs font-bold text-slate-600";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={labelClass}>{label}</span>
      {children}
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
    window.setTimeout(() => setToast(null), 3500);
  }

  function patchHeader<K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) {
    setContent((c) => (c ? { ...c, header: { ...c.header, [key]: value } } : c));
    setDirty(true);
  }

  function setBodyText(text: string) {
    setContent((c) => {
      if (!c || !statementDocumentHasPages(c)) return c;
      if (!c.pages.length) return { ...c, pages: [{ ...createEmptyPage(), text, qa: [] }] };
      return {
        ...c,
        pages: c.pages.map((p, i) => (i === 0 ? { ...p, text, qa: [] } : p)),
      };
    });
    setDirty(true);
  }

  async function regenerateWord() {
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${documentId}/word`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      showToast(err?.error || "สร้างไฟล์ Word ไม่สำเร็จ");
      return null;
    }
    const json = (await res.json()) as {
      document: { wordFileUrl: string; wordFileName: string };
    };
    setWordFileUrl(json.document.wordFileUrl);
    setWordFileName(json.document.wordFileName);
    return json.document;
  }

  async function saveAndOpenWord(openAfter = true) {
    if (!content) return;
    setSaving(true);

    let toSave: EditableDoc = content;
    if (isStatementDocumentV3(content) && statementDocumentHasPages(content)) {
      toSave = {
        ...content,
        formHtml: content.formHtml || "",
      };
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
    const word = await regenerateWord();
    setSaving(false);
    if (word?.wordFileUrl) {
      showToast("สร้างไฟล์ Word ตามแบบราชการแล้ว");
      if (openAfter) {
        window.open(word.wordFileUrl, "_blank", "noopener,noreferrer");
      }
    }
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-100 text-slate-600">
        กำลังโหลดฟอร์มคำให้การ…
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-slate-100 text-slate-800">
        <p className="max-w-md px-4 text-center text-sm">{error ?? "ไม่พบข้อมูล"}</p>
        <Link href={backHref} className="underline">
          กลับเมนูบุคคล
        </Link>
      </div>
    );
  }

  const meta = getStatementTemplateMeta(content.templateSlug);
  const h = content.header;
  const bodyText = statementDocumentHasPages(content) ? (content.pages[0]?.text ?? "") : "";
  const blankHref = isStatementDocumentV3(content) ? content.blankFormHref : null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-100 text-slate-900">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#1e1b4b] sm:text-base">
            คำให้การ · กรอกข้อมูล → สร้างไฟล์ Word ราชการ
          </p>
          <p className="truncate text-xs text-slate-500">
            {meta.title} · {h.caseNumber} · {h.partyName}
            {dirty ? " · ยังไม่บันทึก" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toast ? (
            <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              {toast}
            </span>
          ) : null}
          <Link href={backHref} className={toolbarBtnClass}>
            ✕ ปิด
          </Link>
          {blankHref ? (
            <a href={blankHref} target="_blank" rel="noopener noreferrer" className={toolbarBtnClass}>
              แม่แบบเปล่า
            </a>
          ) : null}
          {wordFileUrl ? (
            <a
              href={wordFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={toolbarBtnEmeraldClass}
              title={wordFileName ?? "Word"}
            >
              เปิด Word ที่สร้างแล้ว
            </a>
          ) : null}
          <button type="button" className={toolbarBtnClass} onClick={() => uploadRef.current?.click()}>
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
          <button
            type="button"
            className={smartPolicePrimaryButtonClass}
            disabled={saving}
            onClick={() => void saveAndOpenWord(true)}
          >
            {saving ? "กำลังสร้าง Word…" : "บันทึก + เปิดไฟล์ Word"}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
        <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold">วิธีใช้ (เหมือนระบบธุรกิจทั่วไป)</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[13px] leading-relaxed">
            <li>แก้ข้อมูลในฟอร์มด้านล่าง (ดึงจากคดีมาให้แล้ว)</li>
            <li>พิมพ์ข้อความคำให้การในช่องท้ายฟอร์ม</li>
            <li>
              กด <b>บันทึก + เปิดไฟล์ Word</b> — ระบบเอาข้อมูลไปใส่ในแม่แบบราชการจริง แล้วเปิด `.docx` ให้
            </li>
            <li>ตรวจ/พิมพ์จาก Microsoft Word ถึงจะได้สัดส่วนแบบฟอร์มเป๊ะ 100%</li>
          </ol>
        </div>

        <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <Field label="ชื่อเอกสารในสำนวน">
            <input
              className={fieldClass}
              value={docTitle}
              onChange={(e) => {
                setDocTitle(e.target.value);
                setDirty(true);
              }}
            />
          </Field>

          <p className="text-sm font-black text-[#1e1b4b]">สถานี / วันที่</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="สถานีตำรวจ">
              <input
                className={fieldClass}
                value={h.stationName}
                onChange={(e) => patchHeader("stationName", e.target.value)}
              />
            </Field>
            <Field label="เขต/อำเภอ">
              <input
                className={fieldClass}
                value={h.district}
                onChange={(e) => patchHeader("district", e.target.value)}
              />
            </Field>
            <Field label="จังหวัด">
              <input
                className={fieldClass}
                value={h.province}
                onChange={(e) => patchHeader("province", e.target.value)}
              />
            </Field>
            <Field label="วันที่">
              <input className={fieldClass} value={h.dayThai} onChange={(e) => patchHeader("dayThai", e.target.value)} />
            </Field>
            <Field label="เดือน">
              <input
                className={fieldClass}
                value={h.monthThai}
                onChange={(e) => patchHeader("monthThai", e.target.value)}
              />
            </Field>
            <Field label="พ.ศ.">
              <input
                className={fieldClass}
                value={h.yearThai}
                onChange={(e) => patchHeader("yearThai", e.target.value)}
              />
            </Field>
          </div>

          <p className="text-sm font-black text-[#1e1b4b]">คดี / พนักงานสอบสวน</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ผู้กล่าวหา (คดีระหว่าง)">
              <input
                className={fieldClass}
                value={h.complainantLine}
                onChange={(e) => patchHeader("complainantLine", e.target.value)}
              />
            </Field>
            <Field label="ผู้ต้องหา">
              <input
                className={fieldClass}
                value={h.suspectLine}
                onChange={(e) => patchHeader("suspectLine", e.target.value)}
              />
            </Field>
            <Field label="ต่อหน้า (พงส.)">
              <input
                className={fieldClass}
                value={h.investigator}
                onChange={(e) => patchHeader("investigator", e.target.value)}
              />
            </Field>
            <Field label="สอบสวนที่">
              <input
                className={fieldClass}
                value={h.interviewPlace}
                onChange={(e) => patchHeader("interviewPlace", e.target.value)}
              />
            </Field>
          </div>

          <p className="text-sm font-black text-[#1e1b4b]">ผู้ให้คำให้การ</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อ">
              <input
                className={fieldClass}
                value={h.partyName}
                onChange={(e) => patchHeader("partyName", e.target.value)}
              />
            </Field>
            <Field label="เป็น (เช่น ผู้กล่าวหา / พยาน)">
              <input
                className={fieldClass}
                value={h.partyRoleLabel}
                onChange={(e) => patchHeader("partyRoleLabel", e.target.value)}
              />
            </Field>
            <Field label="อายุ">
              <input
                className={fieldClass}
                value={h.partyAge}
                onChange={(e) => patchHeader("partyAge", e.target.value)}
              />
            </Field>
            <Field label="โทรศัพท์">
              <input
                className={fieldClass}
                value={h.partyPhone}
                onChange={(e) => patchHeader("partyPhone", e.target.value)}
              />
            </Field>
            <Field label="บัตรประชาชน">
              <input
                className={fieldClass}
                value={h.partyIdCard}
                onChange={(e) => patchHeader("partyIdCard", e.target.value)}
              />
            </Field>
            <Field label="อาชีพ">
              <input
                className={fieldClass}
                value={h.partyOccupation}
                onChange={(e) => patchHeader("partyOccupation", e.target.value)}
              />
            </Field>
            <Field label="เชื้อชาติ">
              <input
                className={fieldClass}
                value={h.ethnicity}
                onChange={(e) => patchHeader("ethnicity", e.target.value)}
              />
            </Field>
            <Field label="สัญชาติ">
              <input
                className={fieldClass}
                value={h.partyNationality}
                onChange={(e) => patchHeader("partyNationality", e.target.value)}
              />
            </Field>
            <Field label="ศาสนา">
              <input
                className={fieldClass}
                value={h.religion}
                onChange={(e) => patchHeader("religion", e.target.value)}
              />
            </Field>
            <Field label="เกี่ยวข้องกับคู่กรณี">
              <input
                className={fieldClass}
                value={h.relationshipNote}
                onChange={(e) => patchHeader("relationshipNote", e.target.value)}
              />
            </Field>
          </div>

          <p className="text-sm font-black text-[#1e1b4b]">ที่อยู่ / บิดา–มารดา</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="บ้านเลขที่">
              <input className={fieldClass} value={h.houseNo} onChange={(e) => patchHeader("houseNo", e.target.value)} />
            </Field>
            <Field label="หมู่ที่">
              <input className={fieldClass} value={h.moo} onChange={(e) => patchHeader("moo", e.target.value)} />
            </Field>
            <Field label="แขวง/ตำบล">
              <input className={fieldClass} value={h.tambon} onChange={(e) => patchHeader("tambon", e.target.value)} />
            </Field>
            <Field label="เขต/อำเภอ (ที่อยู่)">
              <input
                className={fieldClass}
                value={h.amphoe || h.district}
                onChange={(e) => patchHeader("amphoe", e.target.value)}
              />
            </Field>
            <Field label="ชื่อบิดา">
              <input
                className={fieldClass}
                value={h.fatherName}
                onChange={(e) => patchHeader("fatherName", e.target.value)}
              />
            </Field>
            <Field label="ชื่อมารดา">
              <input
                className={fieldClass}
                value={h.motherName}
                onChange={(e) => patchHeader("motherName", e.target.value)}
              />
            </Field>
            <Field label="ออกเมื่อ (บัตร)">
              <input
                className={fieldClass}
                value={h.idIssuedOn}
                onChange={(e) => patchHeader("idIssuedOn", e.target.value)}
              />
            </Field>
            <Field label="หมดอายุ">
              <input
                className={fieldClass}
                value={h.idExpiresOn}
                onChange={(e) => patchHeader("idExpiresOn", e.target.value)}
              />
            </Field>
            <Field label="ออกให้ ณ">
              <input
                className={fieldClass}
                value={h.idIssuedAt}
                onChange={(e) => patchHeader("idIssuedAt", e.target.value)}
              />
            </Field>
          </div>

          <Field label="ข้อความคำให้การ (จะถูกใส่ลงในแบบฟอร์ม Word)">
            <textarea
              className={cn(fieldClass, "min-h-[180px] resize-y font-sans leading-relaxed")}
              value={bodyText}
              placeholder="พิมพ์คำให้การที่นี่…"
              onChange={(e) => setBodyText(e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              className={smartPolicePrimaryButtonClass}
              disabled={saving}
              onClick={() => void saveAndOpenWord(true)}
            >
              {saving ? "กำลังสร้าง…" : "บันทึก + เปิดไฟล์ Word ตามแบบราชการ"}
            </button>
            {wordFileUrl ? (
              <a href={wordFileUrl} download={wordFileName ?? undefined} className={toolbarBtnEmeraldClass}>
                ดาวน์โหลด .docx
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
