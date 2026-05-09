"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type PromptRow = {
  id: string;
  title: string;
  content: string;
  description: string | null;
  categoryId: string | null;
  tags: string;
  language: string;
  modelHint: string | null;
  temperature: number;
  isFavorite: boolean;
  usageCount: number;
  category: { id: string; name: string; icon: string; color: string } | null;
  updatedAt: string;
};

const emptyForm = {
  title: "",
  content: "",
  description: "",
  categoryId: "" as string,
  tags: "",
  language: "th",
  modelHint: "",
  temperature: 0.7,
  isFavorite: false,
  changeNote: "",
};

export function PromptLibraryPromptsClient() {
  const [items, setItems] = useState<PromptRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [catDraft, setCatDraft] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favDraft, setFavDraft] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const importRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (favoriteOnly) params.set("favorite", "1");
    const res = await fetch(`/api/prompt-library/prompts?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: PromptRow[] };
    setItems(data.items);
  }, [q, categoryId, favoriteOnly]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/prompt-library/categories", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: CategoryRow[] };
    setCategories(data.items);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row: PromptRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      description: row.description ?? "",
      categoryId: row.categoryId ?? "",
      tags: row.tags,
      language: row.language,
      modelHint: row.modelHint ?? "",
      temperature: row.temperature,
      isFavorite: row.isFavorite,
      changeNote: "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast("กรุณากรอกชื่อและเนื้อหาคำสั่ง");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/prompt-library/prompts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content,
            description: form.description.trim() || null,
            categoryId: form.categoryId || null,
            tags: form.tags,
            language: form.language,
            modelHint: form.modelHint.trim() || null,
            temperature: form.temperature,
            isFavorite: form.isFavorite,
            changeNote: form.changeNote.trim() || null,
          }),
        });
        if (!res.ok) {
          showToast("บันทึกไม่สำเร็จ");
          return;
        }
        showToast("บันทึกแล้ว");
      } else {
        const res = await fetch("/api/prompt-library/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content,
            description: form.description.trim() || null,
            categoryId: form.categoryId || null,
            tags: form.tags,
            language: form.language,
            modelHint: form.modelHint.trim() || null,
            temperature: form.temperature,
            isFavorite: form.isFavorite,
          }),
        });
        if (!res.ok) {
          showToast("สร้างไม่สำเร็จ");
          return;
        }
        showToast("สร้างคำสั่งแล้ว");
      }
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: PromptRow) => {
    if (!window.confirm(`เก็บถังขยะ (ซ่อน) คำสั่ง «${row.title}» ?`)) return;
    const res = await fetch(`/api/prompt-library/prompts/${row.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("เก็บเข้าถังแล้ว");
      await refresh();
    }
  };

  const duplicate = async (row: PromptRow) => {
    const res = await fetch(`/api/prompt-library/prompts/${row.id}/duplicate`, { method: "POST" });
    if (res.ok) {
      showToast("คัดลอกแล้ว");
      await refresh();
    }
  };

  const markUse = async (row: PromptRow) => {
    const res = await fetch(`/api/prompt-library/prompts/${row.id}/use`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { item: PromptRow };
      setItems((prev) => prev.map((p) => (p.id === row.id ? { ...p, usageCount: data.item.usageCount } : p)));
    }
  };

  const copyContent = async (row: PromptRow) => {
    try {
      await navigator.clipboard.writeText(row.content);
      showToast("คัดลอกเนื้อหาแล้ว");
    } catch {
      showToast("คัดลอกไม่ได้ — ลองอีกครั้ง");
    }
  };

  const exportJson = async () => {
    const res = await fetch("/api/prompt-library/export", { cache: "no-store" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-library-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("ดาวน์โหลดไฟล์แล้ว");
  };

  const onPickImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { items?: unknown };
      if (!parsed.items || !Array.isArray(parsed.items)) {
        showToast("รูปแบบไฟล์ไม่ถูกต้อง");
        return;
      }
      const res = await fetch("/api/prompt-library/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed.items }),
      });
      if (!res.ok) {
        showToast("นำเข้าไม่สำเร็จ");
        return;
      }
      const data = (await res.json()) as { created: number };
      showToast(`นำเข้า ${data.created} รายการ`);
      await refresh();
    } catch {
      showToast("อ่านไฟล์ไม่ได้");
    }
  };

  const applyFilters = () => {
    setQ(qDraft);
    setCategoryId(catDraft);
    setFavoriteOnly(favDraft);
    setFilterOpen(false);
  };

  const hasActiveFilter = Boolean(q.trim() || categoryId || favoriteOnly);

  return (
    <div className="space-y-4">
      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={onPickImport} />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[80] max-w-sm -translate-x-1/2 rounded-2xl border border-white/60 bg-[#1e1b4b]/92 px-4 py-2 text-center text-sm text-white shadow-lg sm:bottom-6"
        >
          {toast}
        </div>
      ) : null}

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="คลังคำสั่ง"
          description="ค้นหา แก้ไข คัดลอกไปใช้กับเลขาส่วนตัวหรือ AI อื่น"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "hidden sm:inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs font-semibold sm:text-sm",
                )}
                onClick={() => importRef.current?.click()}
                aria-label="นำเข้า JSON"
              >
                นำเข้า
              </button>
              <button
                type="button"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "hidden sm:inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs font-semibold sm:text-sm",
                )}
                onClick={() => void exportJson()}
                aria-label="ส่งออก JSON"
              >
                ส่งออก
              </button>
              <button
                type="button"
                className="relative sm:hidden min-h-[40px] min-w-[40px] rounded-xl border border-white/60 bg-white/85 p-2 text-[#4d47b6]"
                onClick={() => setFilterOpen(true)}
                aria-label="เปิดตัวกรอง"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
                {hasActiveFilter ? (
                  <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                ) : null}
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-2 sm:min-w-0 sm:px-4"
                aria-label="เพิ่มคำสั่ง"
              >
                <span className="sm:hidden text-lg" aria-hidden>
                  +
                </span>
                <span className="hidden sm:inline">+ เพิ่มคำสั่ง</span>
              </button>
            </div>
          }
        />

        <div className="mt-3 hidden gap-2 sm:flex sm:flex-wrap">
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="ค้นหา..."
            className="min-h-[40px] min-w-[200px] flex-1 rounded-xl border border-white/60 bg-white/80 px-3 text-sm"
            aria-label="ค้นหาคำสั่ง"
          />
          <select
            value={catDraft}
            onChange={(e) => setCatDraft(e.target.value)}
            className="min-h-[40px] rounded-xl border border-white/60 bg-white/80 px-3 text-sm"
            aria-label="กรองหมวด"
          >
            <option value="">ทุกหมวด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <label className="flex min-h-[40px] items-center gap-2 text-sm text-[#66638c]">
            <input type="checkbox" checked={favDraft} onChange={(e) => setFavDraft(e.target.checked)} />
            เฉพาะโปรด
          </label>
          <button
            type="button"
            onClick={applyFilters}
            className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-4 text-sm font-semibold")}
          >
            ใช้ตัวกรอง
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] py-8 text-center text-sm text-[#66638c]">
            ยังไม่มีคำสั่งที่ตรงเงื่อนไข
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-[1.25rem] border border-white/55 bg-white/75 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copyContent(row)}
                      className="text-left text-sm font-bold text-[#1e1b4b] hover:underline"
                    >
                      {row.title}
                    </button>
                    {row.isFavorite ? <span aria-hidden>⭐</span> : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#66638c]">
                    {row.category ? (
                      <span
                        className="rounded-lg px-2 py-0.5 font-semibold text-white"
                        style={{ backgroundColor: row.category.color }}
                      >
                        {row.category.icon} {row.category.name}
                      </span>
                    ) : null}
                    <span>ใช้แล้ว {row.usageCount} ครั้ง</span>
                    <span>{row.language}</span>
                  </div>
                  {row.tags ? <p className="mt-1 truncate text-xs text-[#5f5a8a]">#{row.tags.replace(/,/g, " #")}</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void markUse(row)}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "min-h-[40px] rounded-xl px-2.5 text-xs font-semibold sm:px-3",
                    )}
                    aria-label={`นับการใช้งาน ${row.title}`}
                    title="นับการใช้งาน"
                  >
                    ใช้งาน
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyContent(row)}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "min-h-[40px] rounded-xl px-2.5 text-xs font-semibold sm:px-3",
                    )}
                    aria-label={`คัดลอกเนื้อหา ${row.title}`}
                  >
                    คัดลอก
                  </button>
                  <button
                    type="button"
                    onClick={() => void duplicate(row)}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "min-h-[40px] rounded-xl px-2.5 text-xs font-semibold sm:px-3",
                    )}
                    aria-label={`คัดลอกรายการ ${row.title}`}
                  >
                    ซ้ำ
                  </button>
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${row.title}`}
                    title="แก้ไข"
                    onClick={() => openEdit(row)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ซ่อน ${row.title}`}
                    title="ซ่อน"
                    onClick={() => void remove(row)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      {filterOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="ตัวกรอง"
        >
          <div className="w-full max-w-md rounded-t-[2rem] border border-white/60 bg-white p-5 shadow-xl sm:rounded-[2rem]">
            <h2 className="text-lg font-bold text-[#1e1b4b]">ตัวกรอง</h2>
            <div className="mt-3 space-y-3">
              <input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="คำค้น..."
              />
              <select
                value={catDraft}
                onChange={(e) => setCatDraft(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="">ทุกหมวด</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={favDraft} onChange={(e) => setFavDraft(e.target.checked)} />
                เฉพาะโปรด
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={appTemplateOutlineButtonClass} onClick={() => setFilterOpen(false)}>
                ยกเลิก
              </button>
              <button type="button" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold" onClick={applyFilters}>
                ใช้
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "แก้ไขคำสั่ง" : "สร้างคำสั่งใหม่"}
        description="เก็บ prompt สำหรับนำไปวางในเครื่องมือ AI"
        size="xl"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={save}
            submitLabel={editingId ? "บันทึก" : "สร้าง"}
            loading={saving}
          />
        }
      >
        <div className="space-y-3 px-1 py-1">
          <div>
            <label className="text-xs font-semibold text-[#66638c]">ชื่อคำสั่ง *</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={form.title}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#66638c]">หมวด</label>
              <select
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#66638c]">ภาษา</label>
              <select
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              >
                <option value="th">ไทย</option>
                <option value="en">English</option>
                <option value="mixed">ผสม</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#66638c]">คำอธิบายสั้น</label>
            <input
              className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={form.description}
              maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#66638c]">
              <span>เนื้อหาคำสั่ง *</span>
              <span>{form.content.length} / 20,000</span>
            </div>
            <textarea
              className="mt-1 min-h-[200px] w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
              maxLength={20000}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="ใส่ prompt ที่นี่..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#66638c]">แท็ก (คั่นด้วยจุลภาค สูงสุด 10 คำ)</label>
            <input
              className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#66638c]">โมเดลแนะนำ</label>
              <input
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.modelHint}
                onChange={(e) => setForm((f) => ({ ...f, modelHint: e.target.value }))}
                placeholder="เช่น GPT-4, Claude"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#66638c]">
                Temperature: <strong className="text-[#4d47b6]">{form.temperature}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                className="mt-2 w-full accent-[#4d47b6]"
                value={form.temperature}
                onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#66638c]">
            <input
              type="checkbox"
              checked={form.isFavorite}
              onChange={(e) => setForm((f) => ({ ...f, isFavorite: e.target.checked }))}
            />
            เพิ่มเป็นรายการโปรด
          </label>
          {editingId ? (
            <div>
              <label className="text-xs font-semibold text-[#66638c]">บันทึกการเปลี่ยนแปลง (ถ้าแก้เนื้อหา — เก็บเป็นประวัติ)</label>
              <input
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.changeNote}
                onChange={(e) => setForm((f) => ({ ...f, changeNote: e.target.value }))}
                placeholder="เช่น ปรับให้กระชับขึ้น"
              />
            </div>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}
