"use client";

import { useCallback, useEffect, useState } from "react";
import { AppDashboardSection, AppEmptyState, AppSectionHeader } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  SMART_POLICE_DOCUMENT_KIND_LABEL,
} from "@/lib/smart-police/types";
import type { SmartPoliceTemplateDto } from "@/lib/smart-police/types";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";

export function SmartPoliceTemplatesClient() {
  const [templates, setTemplates] = useState<SmartPoliceTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    kind: "NARRATIVE" as SmartPoliceDocumentKind,
    name: "",
    content: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/smart-police/templates", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { templates: SmartPoliceTemplateDto[] };
    setTemplates(data.templates);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = editingId ? `/api/smart-police/templates/${editingId}` : "/api/smart-police/templates";
    await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setModalOpen(false);
    setEditingId(null);
    await load();
  }

  async function toggleActive(t: SmartPoliceTemplateDto) {
    await fetch(`/api/smart-police/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    await load();
  }

  return (
    <>
      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start"
          title="แม่แบบเอกสาร"
          description="สำนวน คำให้การ หมายเรียก — มีแม่แบบระบบให้แล้ว · ใช้ตัวแปร {{caseNumber}} {{partyName}}"
          action={
            <button
              type="button"
              className="app-btn-primary min-h-[40px] rounded-xl px-4"
              onClick={() => {
                setEditingId(null);
                setForm({ kind: "NARRATIVE", name: "", content: "" });
                setModalOpen(true);
              }}
            >
              + แม่แบบ
            </button>
          }
        />
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : templates.length === 0 ? (
          <AppEmptyState>ไม่มีแม่แบบ</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/55 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#1e1b4b]">
                    {t.name}
                    {t.isBuiltin ? (
                      <span className="ml-2 rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4d47b6]">
                        ระบบ
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[#66638c]">
                    {SMART_POLICE_DOCUMENT_KIND_LABEL[t.kind]}
                    {!t.isActive ? " · ปิดใช้งาน" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="app-btn-soft min-h-[40px] rounded-xl px-3 text-sm"
                    onClick={() => void toggleActive(t)}
                  >
                    {t.isActive ? "ปิด" : "เปิด"}
                  </button>
                  <button
                    type="button"
                    className="app-btn-primary min-h-[40px] rounded-xl px-3 text-sm"
                    onClick={() => {
                      setEditingId(t.id);
                      setForm({ kind: t.kind, name: t.name, content: t.content });
                      setModalOpen(true);
                    }}
                  >
                    แก้ไข
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "แก้แม่แบบ" : "แม่แบบใหม่"}>
        <div className="space-y-3 text-left">
          <label className="block text-sm">
            ประเภท
            <select
              className="app-input mt-1 w-full rounded-xl"
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as SmartPoliceDocumentKind }))}
            >
              {(Object.keys(SMART_POLICE_DOCUMENT_KIND_LABEL) as SmartPoliceDocumentKind[]).map((k) => (
                <option key={k} value={k}>
                  {SMART_POLICE_DOCUMENT_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            ชื่อ *
            <input className="app-input mt-1 w-full rounded-xl" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="block text-sm">
            เนื้อหา
            <textarea
              className="app-input mt-1 min-h-[220px] w-full rounded-xl font-mono text-sm"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
        </div>
        <FormModalFooterActions onCancel={() => setModalOpen(false)} onSubmit={() => void save()} loading={saving} submitLabel="บันทึก" />
      </FormModal>
    </>
  );
}
