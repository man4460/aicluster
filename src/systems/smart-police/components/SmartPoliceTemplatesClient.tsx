"use client";

import { useCallback, useEffect, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_DOCUMENT_KIND_LABEL,
} from "@/lib/smart-police/types";
import type { SmartPoliceTemplateDto } from "@/lib/smart-police/types";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceLabelClass,
  smartPoliceListRowClass,
  smartPoliceMutedTextClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";

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
    <div className={smartPolicePageStackClass}>
      <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
        <div className={smartPoliceCardHeaderRowClass}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>แม่แบบ</h2>
            {!loading ? (
              <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
                {templates.length}
              </span>
            ) : null}
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <button
              type="button"
              className={smartPolicePrimaryButtonClass}
              onClick={() => {
                setEditingId(null);
                setForm({ kind: "NARRATIVE", name: "", content: "" });
                setModalOpen(true);
              }}
            >
              + แม่แบบ
            </button>
          </div>
        </div>

        <div className="mt-1.5">
          {loading ? (
            <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
          ) : templates.length === 0 ? (
            <AppEmptyState>ไม่มีแม่แบบ</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {templates.map((t) => (
                <li key={t.id} className={smartPoliceListRowClass}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1e1b4b]">
                      {t.name}
                      {t.isBuiltin ? (
                        <span className="ml-2 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#4d47b6]">
                          ระบบ
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[#66638c]">
                      {SMART_POLICE_DOCUMENT_KIND_LABEL[t.kind]}
                      {!t.isActive ? " · ปิดใช้งาน" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className={smartPoliceOutlineButtonClass}
                      onClick={() => void toggleActive(t)}
                    >
                      {t.isActive ? "ปิด" : "เปิด"}
                    </button>
                    <button
                      type="button"
                      className={smartPolicePrimaryButtonClass}
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
        </div>
      </section>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "แก้แม่แบบ" : "แม่แบบใหม่"}>
        <div className="space-y-3 text-left">
          <label className={smartPoliceLabelClass}>
            ประเภท
            <select
              className={cn(smartPoliceFieldClass, "mt-1")}
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
          <label className={smartPoliceLabelClass}>
            ชื่อ *
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            เนื้อหา
            <textarea
              className={cn(smartPoliceTextareaClass, "mt-1 min-h-[13.75rem] font-mono text-sm")}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
        </div>
        <FormModalFooterActions onCancel={() => setModalOpen(false)} onSubmit={() => void save()} loading={saving} submitLabel="บันทึก" />
      </FormModal>
    </div>
  );
}
