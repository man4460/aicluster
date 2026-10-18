"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { SMART_POLICE_DOCUMENT_KIND_LABEL } from "@/lib/smart-police/types";
import type { SmartPoliceTemplateDto } from "@/lib/smart-police/types";
import type { SmartPoliceDocumentKind } from "@/generated/prisma/enums";
import {
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  SMART_POLICE_ENTRY_MODAL_SIZE,
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceModalFormClass,
  smartPoliceSelectClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceLabelClass,
  smartPoliceListRowAccentClass,
  smartPoliceMutedTextClass,
  smartPoliceFillPanelClass,
  smartPoliceFillScrollBodyClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPoliceRowIconButtonClass,
  smartPoliceRowRemoveIconButtonClass,
  smartPoliceScrollListClass,
  smartPoliceTextareaClass,
} from "@/systems/smart-police/lib/ui-tokens";

type AccentTone = "indigo" | "violet" | "amber" | "sky" | "emerald" | "rose";

function templateTone(kind: SmartPoliceDocumentKind, isActive: boolean): AccentTone {
  if (!isActive) return "amber";
  switch (kind) {
    case "NARRATIVE":
      return "indigo";
    case "STATEMENT":
      return "violet";
    case "WARRANT":
      return "rose";
    case "REPORT":
    case "INVESTIGATION_REPORT":
      return "amber";
    case "MEMO":
      return "sky";
    case "PROPERTY_LIST":
      return "emerald";
    default:
      return "indigo";
  }
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function SmartPoliceTemplatesClient() {
  const [templates, setTemplates] = useState<SmartPoliceTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(true);
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

  const kindsInList = useMemo(() => {
    const set = new Set(templates.map((t) => t.kind));
    return (Object.keys(SMART_POLICE_DOCUMENT_KIND_LABEL) as SmartPoliceDocumentKind[]).filter((k) =>
      set.has(k),
    );
  }, [templates]);

  const filtered = useMemo(() => {
    if (!kindFilter) return templates;
    return templates.filter((t) => t.kind === kindFilter);
  }, [templates, kindFilter]);

  const filtersActive = Boolean(kindFilter);

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

  async function remove(t: SmartPoliceTemplateDto) {
    if (t.isBuiltin) return;
    if (!window.confirm(`ลบแม่แบบ «${t.name}»?`)) return;
    const res = await fetch(`/api/smart-police/templates/${t.id}`, { method: "DELETE" });
    if (!res.ok) return;
    await load();
  }

  function openAdd() {
    setEditingId(null);
    setForm({ kind: "NARRATIVE", name: "", content: "" });
    setModalOpen(true);
  }

  return (
    <div className={smartPolicePageStackClass}>
      <section
        className={cn(
          smartPolicePanelClass,
          smartPolicePanelSectionClass,
          smartPoliceFillPanelClass,
        )}
      >
        <div className={cn(smartPoliceCardHeaderRowClass, "shrink-0")}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>แม่แบบ</h2>
            {!loading ? (
              <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
                {filtered.length}
                {filtersActive ? `/${templates.length}` : ""}
              </span>
            ) : null}
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="sp-templates-filter-panel"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              className={cn(
                smartPoliceOutlineButtonClass,
                "relative border-transparent bg-transparent shadow-none",
                filterOpen && "bg-white text-[#4d47b6] shadow-sm",
                filtersActive && !filterOpen && "bg-amber-50 text-amber-800",
              )}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500"
                  aria-hidden
                />
              ) : null}
            </button>
            <button
              type="button"
              className={cn(smartPolicePrimaryButtonClass, "min-w-[40px] sm:min-w-0")}
              aria-label="เพิ่มแม่แบบ"
              onClick={openAdd}
            >
              <IconPlus className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">+ แม่แบบ</span>
            </button>
          </div>
        </div>

        <div
          id="sp-templates-filter-panel"
          className={cn("mt-2 shrink-0", filterOpen ? "block" : "hidden")}
        >
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="กรองประเภทแม่แบบ">
            <button
              type="button"
              role="tab"
              aria-selected={!kindFilter}
              className={smartPoliceFilterTextClass(!kindFilter)}
              onClick={() => setKindFilter("")}
            >
              ทั้งหมด
            </button>
            {kindsInList.map((k) => (
              <span key={k} className="inline-flex items-center gap-x-2">
                <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
                <button
                  type="button"
                  role="tab"
                  aria-selected={kindFilter === k}
                  className={smartPoliceFilterTextClass(kindFilter === k)}
                  onClick={() => setKindFilter(k)}
                >
                  {SMART_POLICE_DOCUMENT_KIND_LABEL[k]}
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className={cn(smartPoliceFillScrollBodyClass, "mt-2")}>
          {loading ? (
            <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
          ) : filtered.length === 0 ? (
            <AppEmptyState tone="violet">
              {filtersActive ? "ไม่พบแม่แบบที่ตรงเงื่อนไข" : "ไม่มีแม่แบบ"}
            </AppEmptyState>
          ) : (
            <ul className={cn(smartPoliceScrollListClass, "space-y-2")}>
              {filtered.map((t) => (
                <li key={t.id} className={smartPoliceListRowAccentClass(templateTone(t.kind, t.isActive))}>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] font-bold text-[#4d47b6]">
                      {SMART_POLICE_DOCUMENT_KIND_LABEL[t.kind]}
                      {t.isBuiltin ? " · ระบบ" : " · สถานี"}
                      {!t.isActive ? " · ปิด" : ""}
                    </p>
                    <p className="text-[13px] font-semibold text-[#1e1b4b]">{t.name}</p>
                    {t.content.trim() ? (
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#66638c]">
                        {t.content.trim()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={cn(
                        smartPoliceOutlineButtonClass,
                        "px-2 text-[10px]",
                        t.isActive ? "text-emerald-700" : "text-amber-800",
                      )}
                      aria-label={t.isActive ? `ปิดใช้งาน ${t.name}` : `เปิดใช้งาน ${t.name}`}
                      title={t.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      onClick={() => void toggleActive(t)}
                    >
                      {t.isActive ? "เปิด" : "ปิด"}
                    </button>
                    <button
                      type="button"
                      className={smartPoliceRowIconButtonClass}
                      aria-label={`แก้ไข ${t.name}`}
                      title="แก้ไข"
                      onClick={() => {
                        setEditingId(t.id);
                        setForm({ kind: t.kind, name: t.name, content: t.content });
                        setModalOpen(true);
                      }}
                    >
                      <IconRowEdit className="h-4 w-4" aria-hidden />
                    </button>
                    {!t.isBuiltin ? (
                      <button
                        type="button"
                        className={smartPoliceRowRemoveIconButtonClass}
                        aria-label={`ลบ ${t.name}`}
                        title="ลบ"
                        onClick={() => void remove(t)}
                      >
                        <IconRowRemove className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "แก้แม่แบบ" : "แม่แบบใหม่"}
        size={SMART_POLICE_ENTRY_MODAL_SIZE}
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void save()}
            loading={saving}
            submitLabel="บันทึก"
            submitDisabled={!form.name.trim()}
          />
        }
      >
        <div className={smartPoliceModalFormClass}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={smartPoliceLabelClass}>
              ประเภท
              <select
                className={cn(smartPoliceSelectClass, "mt-1")}
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kind: e.target.value as SmartPoliceDocumentKind }))
                }
              >
                {(Object.keys(SMART_POLICE_DOCUMENT_KIND_LABEL) as SmartPoliceDocumentKind[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {SMART_POLICE_DOCUMENT_KIND_LABEL[k]}
                    </option>
                  ),
                )}
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
            <label className={cn(smartPoliceLabelClass, "sm:col-span-2")}>
              เนื้อหา
              <textarea
                className={cn(smartPoliceTextareaClass, "mt-1 min-h-[13.75rem] font-mono text-sm")}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}
