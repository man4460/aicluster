"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  openPrintableHtml,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_CASE_STATUS_LABEL,
  SMART_POLICE_CASE_TYPES,
  SMART_POLICE_DOCUMENT_KIND_LABEL,
  SMART_POLICE_PARTY_ROLE_LABEL,
} from "@/lib/smart-police/types";
import type { SmartPoliceCaseDetail } from "@/lib/smart-police/types";
import { IconSpPrint } from "@/systems/smart-police/components/SmartPoliceIcons";
import { smartPoliceInnerCardClass } from "@/systems/smart-police/smart-police-tokens";
import type { SmartPoliceCaseStatus, SmartPoliceDocumentKind, SmartPolicePartyRole } from "@/generated/prisma/enums";

function documentPreviewHref(caseId: string, docId: string) {
  return `/dashboard/smart-police/cases/${caseId}/documents/${docId}`;
}

export function SmartPoliceCaseDetailClient({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [data, setData] = useState<SmartPoliceCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [partyModal, setPartyModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [partyForm, setPartyForm] = useState({
    role: "COMPLAINANT" as SmartPolicePartyRole,
    fullName: "",
    age: "",
    idCard: "",
    address: "",
  });
  const [docForm, setDocForm] = useState({
    kind: "NARRATIVE" as SmartPoliceDocumentKind,
    title: "",
    content: "",
  });
  const [templateOptions, setTemplateOptions] = useState<
    { id: string; name: string; kind: SmartPoliceDocumentKind; content: string }[]
  >([]);
  const [toast, setToast] = useState<string | null>(null);
  const [statementBusyPartyId, setStatementBusyPartyId] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/smart-police/cases/${caseId}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { case: SmartPoliceCaseDetail };
    setData(json.case);
  }, [caseId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/smart-police/templates", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as {
        templates: { id: string; name: string; kind: SmartPoliceDocumentKind; content: string; isActive: boolean }[];
      };
      setTemplateOptions(json.templates.filter((t) => t.isActive));
    })();
  }, []);

  async function patchCase(patch: Record<string, unknown>) {
    await fetch(`/api/smart-police/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  }

  async function saveParty() {
    if (!partyForm.fullName.trim()) return;
    setSaving(true);
    await fetch(`/api/smart-police/cases/${caseId}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...partyForm,
        age: partyForm.age ? Number(partyForm.age) : null,
      }),
    });
    setSaving(false);
    setPartyModal(false);
    setPartyForm({ role: "COMPLAINANT", fullName: "", age: "", idCard: "", address: "" });
    await load();
  }

  async function saveDoc() {
    if (!docForm.title.trim()) return;
    setSaving(true);
    const url = editingDocId
      ? `/api/smart-police/cases/${caseId}/documents/${editingDocId}`
      : `/api/smart-police/cases/${caseId}/documents`;
    await fetch(url, {
      method: editingDocId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docForm),
    });
    setSaving(false);
    setDocModal(false);
    setEditingDocId(null);
    setDocForm({ kind: "NARRATIVE", title: "", content: "" });
    await load();
  }

  async function createStatementForParty(partyId: string) {
    setStatementBusyPartyId(partyId);
    const res = await fetch(`/api/smart-police/cases/${caseId}/statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId, generateWord: true, syncNarrative: true }),
    });
    setStatementBusyPartyId(null);
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      setToast(err.error ?? "สร้างคำให้การไม่สำเร็จ");
      return;
    }
    const json = (await res.json()) as { document?: { id: string } };
    if (json.document?.id) {
      router.push(documentPreviewHref(caseId, json.document.id));
      return;
    }
    setToast("สร้างคำให้การ + ไฟล์ Word และผูกลิงก์ในสำนวนแล้ว");
    setTimeout(() => setToast(null), 3500);
    await load();
  }

  async function syncNarrativeLinks() {
    setSyncBusy(true);
    await fetch(`/api/smart-police/cases/${caseId}/sync-narrative-links`, { method: "POST" });
    setSyncBusy(false);
    setToast("อัปเดตลิงก์ในสำนวนคดีแล้ว");
    setTimeout(() => setToast(null), 3000);
    await load();
  }

  async function exportWord(docId: string) {
    setSaving(true);
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${docId}/word`, {
      method: "POST",
    });
    setSaving(false);
    if (!res.ok) return;
    const json = (await res.json()) as { document: { wordFileUrl: string }; downloadUrl?: string };
    if (json.downloadUrl) window.open(json.downloadUrl, "_blank", "noopener,noreferrer");
    else if (json.document.wordFileUrl) window.open(json.document.wordFileUrl, "_blank", "noopener,noreferrer");
    await load();
  }

  async function printDoc(docId: string) {
    const res = await fetch(`/api/smart-police/cases/${caseId}/documents/${docId}/print`, {
      method: "POST",
    });
    if (!res.ok) return;
    const { html } = (await res.json()) as { html: string };
    openPrintableHtml(html);
    await load();
  }

  function applyTemplate(templateId: string) {
    const t = templateOptions.find((x) => x.id === templateId);
    if (!t) return;
    setDocForm({ kind: t.kind, title: t.name, content: t.content });
    setEditingDocId(null);
    setDocModal(true);
  }

  if (loading) return <p className="text-sm text-[#66638c]">กำลังโหลดคดี…</p>;
  const statementDocs = data?.documents.filter((d) => d.kind === "STATEMENT") ?? [];
  const narrativeDoc = data?.documents.find((d) => d.kind === "NARRATIVE");

  if (!data) {
    return (
      <p className="text-sm text-rose-600">
        ไม่พบคดี — <Link href="/dashboard/smart-police/cases">กลับรายการ</Link>
      </p>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          {toast}
        </p>
      ) : null}
      <div className={smartPoliceInnerCardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold text-[#4d47b6]">{data.caseNumber}</p>
            <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">{data.title}</h2>
            <p className="mt-1 text-sm text-[#66638c]">
              {data.caseType} · {SMART_POLICE_CASE_STATUS_LABEL[data.status]} · พิมพ์ {data.printCount}{" "}
              ครั้ง
            </p>
          </div>
          <Link href="/dashboard/smart-police/cases" className={cn("text-sm font-semibold text-[#5b61ff]")}>
            ← รายการคดี
          </Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-sm text-[#2e2a58]">
            สถานะ
            <select
              className="app-input mt-1 w-full rounded-xl"
              value={data.status}
              onChange={(e) => void patchCase({ status: e.target.value })}
            >
              {(Object.keys(SMART_POLICE_CASE_STATUS_LABEL) as SmartPoliceCaseStatus[]).map((k) => (
                <option key={k} value={k}>
                  {SMART_POLICE_CASE_STATUS_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#2e2a58]">
            ประเภทคดี
            <select
              className="app-input mt-1 w-full rounded-xl"
              value={data.caseType}
              onChange={(e) => void patchCase({ caseType: e.target.value })}
            >
              {SMART_POLICE_CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-2 block text-sm text-[#2e2a58]">
          สรุปเหตุ
          <textarea
            className="app-input mt-1 min-h-[72px] w-full rounded-xl"
            defaultValue={data.summary ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (data.summary ?? "")) void patchCase({ summary: e.target.value });
            }}
          />
        </label>
      </div>

      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start"
          title="บุคคลที่เกี่ยวข้อง"
          action={
            <button type="button" className="app-btn-primary min-h-[40px] rounded-xl px-4 text-sm" onClick={() => setPartyModal(true)}>
              + เพิ่ม
            </button>
          }
        />
        <ul className="space-y-2">
          {data.parties.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-xl border border-white/50 bg-white/50 px-3 py-2 text-sm text-left sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <span className="font-semibold text-[#4d47b6]">{SMART_POLICE_PARTY_ROLE_LABEL[p.role]}</span> —{" "}
                {p.fullName}
                {p.idCard ? <span className="text-[#66638c]"> · {p.idCard}</span> : null}
              </div>
              <button
                type="button"
                className="app-btn-primary shrink-0 rounded-xl px-3 py-2 text-xs sm:text-sm"
                disabled={statementBusyPartyId === p.id}
                onClick={() => void createStatementForParty(p.id)}
              >
                {statementBusyPartyId === p.id ? "กำลังสร้าง…" : "สร้างคำให้การตามแบบ + Word"}
              </button>
            </li>
          ))}
          {data.parties.length === 0 && <p className="text-sm text-[#66638c]">ยังไม่มีรายชื่อ</p>}
        </ul>
      </AppDashboardSection>

      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start"
          title="คำให้การ (Microsoft Word)"
          description="แบบฟอร์มราชการ · สร้าง .docx · ลิงก์เชื่อมโยงในสำนวนคดีอัตโนมัติ"
          action={
            <button
              type="button"
              className="app-btn-soft min-h-[40px] rounded-xl px-3 text-sm"
              disabled={syncBusy}
              onClick={() => void syncNarrativeLinks()}
            >
              {syncBusy ? "…" : "ผูกลิงก์ในสำนวน"}
            </button>
          }
        />
        {statementDocs.length === 0 ? (
          <p className="text-sm text-[#66638c]">ยังไม่มีคำให้การ — เลือกบุคคลด้านบนแล้วกด «สร้างคำให้การตามแบบ + Word»</p>
        ) : (
          <ul className="space-y-2">
            {statementDocs.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 text-left">
                  <Link
                    href={documentPreviewHref(caseId, d.id)}
                    className="font-semibold text-[#1e1b4b] underline decoration-[#5b61ff]/40 underline-offset-2 hover:text-[#5b61ff]"
                  >
                    {d.title}
                  </Link>
                  <p className="text-xs text-[#66638c]">
                    {d.wordFileUrl ? (
                      <a
                        href={d.wordFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#5b61ff] underline"
                      >
                        เปิดใน Word ({d.wordFileName ?? "ไฟล์ .docx"})
                      </a>
                    ) : (
                      "ยังไม่มีไฟล์ Word"
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={documentPreviewHref(caseId, d.id)}
                    className="app-btn-primary inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs"
                  >
                    เปิดแบบฟอร์ม A4
                  </Link>
                  {!d.wordFileUrl ? (
                    <button
                      type="button"
                      className="app-btn-soft min-h-[40px] rounded-xl px-3 text-xs"
                      onClick={() => void exportWord(d.id)}
                    >
                      สร้าง Word
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="app-btn-soft min-h-[40px] rounded-xl px-3 text-xs"
                    onClick={() => {
                      setEditingDocId(d.id);
                      setDocForm({ kind: d.kind, title: d.title, content: d.content });
                      setDocModal(true);
                    }}
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    className="app-btn-soft inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 text-xs"
                    aria-label={`พิมพ์ ${d.title}`}
                    onClick={() => void printDoc(d.id)}
                  >
                    <IconSpPrint className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">พิมพ์</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {narrativeDoc ? (
          <p className="mt-3 text-left text-xs text-[#66638c]">
            สำนวนคดี:{" "}
            <button
              type="button"
              className="font-semibold text-[#5b61ff] underline"
              onClick={() => {
                setEditingDocId(narrativeDoc.id);
                setDocForm({
                  kind: narrativeDoc.kind,
                  title: narrativeDoc.title,
                  content: narrativeDoc.content,
                });
                setDocModal(true);
              }}
            >
              เปิดดูทะเบียนลิงก์ Word
            </button>
          </p>
        ) : null}
      </AppDashboardSection>

      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 flex flex-wrap gap-2 self-start"
          title="เอกสาร / สำนวน"
          description="แก้ไขเนื้อหาแล้วกดพิมพ์ — ใช้แม่แบบจากเมนูแม่แบบได้"
          action={
            <>
              {templateOptions.length > 0 ? (
                <select
                  className="app-input min-h-[40px] max-w-[11rem] rounded-xl text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) applyTemplate(e.target.value);
                    e.target.value = "";
                  }}
                  aria-label="สร้างจากแม่แบบ"
                >
                  <option value="">+ แม่แบบ</option>
                  {templateOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                className="app-btn-primary min-h-[40px] rounded-xl px-4 text-sm"
                onClick={() => {
                  setEditingDocId(null);
                  setDocForm({ kind: "NARRATIVE", title: "", content: "" });
                  setDocModal(true);
                }}
              >
                + เอกสาร
              </button>
            </>
          }
        />
        <ul className="space-y-2">
          {data.documents.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-left">
                <Link
                  href={documentPreviewHref(caseId, d.id)}
                  className="font-semibold text-[#1e1b4b] underline decoration-[#5b61ff]/40 underline-offset-2 hover:text-[#5b61ff]"
                >
                  {d.title}
                </Link>
                <p className="text-xs text-[#66638c]">
                  {SMART_POLICE_DOCUMENT_KIND_LABEL[d.kind]} · พิมพ์ {d.printCount} ครั้ง
                  {d.wordFileUrl ? " · มีไฟล์ Word" : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={documentPreviewHref(caseId, d.id)}
                  className="app-btn-primary inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs"
                  aria-label={`เปิดแบบฟอร์ม ${d.title}`}
                >
                  เปิดแบบ
                </Link>
                <button
                  type="button"
                  className={cn("app-btn-soft min-h-[40px] min-w-[40px] rounded-xl px-3")}
                  aria-label={`แก้ไข ${d.title}`}
                  title="แก้ไข"
                  onClick={() => {
                    setEditingDocId(d.id);
                    setDocForm({ kind: d.kind, title: d.title, content: d.content });
                    setDocModal(true);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="app-btn-soft inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3"
                  aria-label={`พิมพ์ ${d.title}`}
                  onClick={() => void printDoc(d.id)}
                >
                  <IconSpPrint className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">พิมพ์</span>
                </button>
              </div>
            </li>
          ))}
          {data.documents.length === 0 && (
            <p className="text-sm text-[#66638c]">
              ยังไม่มีเอกสาร — ไปที่{" "}
              <Link href="/dashboard/smart-police/templates" className="font-semibold text-[#5b61ff]">
                แม่แบบ
              </Link>{" "}
              แล้วสร้างเอกสารใหม่
            </p>
          )}
        </ul>
      </AppDashboardSection>

      <FormModal open={partyModal} onClose={() => setPartyModal(false)} title="เพิ่มบุคคล">
        <div className="space-y-3 text-left">
          <label className="block text-sm">
            บทบาท
            <select
              className="app-input mt-1 w-full rounded-xl"
              value={partyForm.role}
              onChange={(e) => setPartyForm((f) => ({ ...f, role: e.target.value as SmartPolicePartyRole }))}
            >
              {(Object.keys(SMART_POLICE_PARTY_ROLE_LABEL) as SmartPolicePartyRole[]).map((k) => (
                <option key={k} value={k}>
                  {SMART_POLICE_PARTY_ROLE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            ชื่อ-สกุล *
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={partyForm.fullName}
              onChange={(e) => setPartyForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            อายุ
            <input
              className="app-input mt-1 w-full rounded-xl"
              inputMode="numeric"
              value={partyForm.age}
              onChange={(e) => setPartyForm((f) => ({ ...f, age: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            เลขบัตร
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={partyForm.idCard}
              onChange={(e) => setPartyForm((f) => ({ ...f, idCard: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            ที่อยู่
            <textarea
              className="app-input mt-1 w-full rounded-xl"
              value={partyForm.address}
              onChange={(e) => setPartyForm((f) => ({ ...f, address: e.target.value }))}
            />
          </label>
        </div>
        <FormModalFooterActions onCancel={() => setPartyModal(false)} onSubmit={() => void saveParty()} loading={saving} submitLabel="บันทึก" />
      </FormModal>

      <FormModal open={docModal} onClose={() => setDocModal(false)} title={editingDocId ? "แก้ไขเอกสาร" : "เอกสารใหม่"}>
        <div className="space-y-3 text-left">
          <label className="block text-sm">
            ประเภท
            <select
              className="app-input mt-1 w-full rounded-xl"
              value={docForm.kind}
              onChange={(e) => setDocForm((f) => ({ ...f, kind: e.target.value as SmartPoliceDocumentKind }))}
            >
              {(Object.keys(SMART_POLICE_DOCUMENT_KIND_LABEL) as SmartPoliceDocumentKind[]).map((k) => (
                <option key={k} value={k}>
                  {SMART_POLICE_DOCUMENT_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            ชื่อเอกสาร *
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={docForm.title}
              onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            เนื้อหา (ใช้ {"{{caseNumber}}"}, {"{{partyName}}"} ฯลฯ)
            <textarea
              className="app-input mt-1 min-h-[200px] w-full rounded-xl font-mono text-sm"
              value={docForm.content}
              onChange={(e) => setDocForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
        </div>
        <FormModalFooterActions onCancel={() => setDocModal(false)} onSubmit={() => void saveDoc()} loading={saving} submitLabel="บันทึก" />
      </FormModal>
    </div>
  );
}
