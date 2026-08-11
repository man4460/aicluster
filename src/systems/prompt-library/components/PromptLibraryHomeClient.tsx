"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";

import {
  PromptLibraryCard,
  type PromptLibraryCardRow,
} from "@/systems/prompt-library/components/PromptLibraryCard";
import {
  IconPromptFilter,
  IconPromptFolder,
  IconPromptPlus,
  IconPromptSearch,
  IconPromptSpark,
} from "@/systems/prompt-library/components/PromptLibraryIcons";
import {
  promptCategoryChipActiveClass,
  promptCategoryChipClass,
  promptHeroShellClass,
  promptPromptGridClass,
  promptStatCardClass,
} from "@/systems/prompt-library/prompt-library-tokens";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder?: number;
};

const UNCATEGORIZED_KEY = "__none__";

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

export function PromptLibraryHomeClient() {
  const [items, setItems] = useState<PromptLibraryCardRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [categoryId, setCategoryId] = useState("");
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
    const data = (await res.json()) as { items: PromptLibraryCardRow[] };
    setItems(data.items);
  }, [q, categoryId, favoriteOnly]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/prompt-library/categories", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: CategoryRow[] };
    setCategories([...data.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
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

  const stats = useMemo(() => {
    const favorites = items.filter((i) => i.isFavorite).length;
    const usage = items.reduce((a, i) => a + i.usageCount, 0);
    return { total: items.length, favorites, usage };
  }, [items]);

  const groupedSections = useMemo(() => {
    const sections: { key: string; title: string; icon: string; color: string; items: PromptLibraryCardRow[] }[] =
      [];
    const byKey = new Map<string, PromptLibraryCardRow[]>();

    for (const row of items) {
      const key = row.category?.id ?? UNCATEGORIZED_KEY;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(row);
    }

    for (const cat of categories) {
      const list = byKey.get(cat.id);
      if (!list?.length) continue;
      sections.push({
        key: cat.id,
        title: cat.name,
        icon: cat.icon,
        color: cat.color,
        items: list,
      });
    }

    const uncategorized = byKey.get(UNCATEGORIZED_KEY);
    if (uncategorized?.length) {
      sections.push({
        key: UNCATEGORIZED_KEY,
        title: "ไม่ระบุหมวด",
        icon: "📎",
        color: "#64748b",
        items: uncategorized,
      });
    }

    return sections;
  }, [items, categories]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categoryId || "" });
    setModalOpen(true);
  };

  const openEdit = (row: PromptLibraryCardRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      description: row.description ?? "",
      categoryId: row.categoryId ?? row.category?.id ?? "",
      tags: row.tags,
      language: row.language,
      modelHint: row.modelHint ?? "",
      temperature: row.temperature ?? 0.7,
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

  const remove = async (row: PromptLibraryCardRow) => {
    if (!window.confirm(`เก็บถังขยะ (ซ่อน) คำสั่ง «${row.title}» ?`)) return;
    const res = await fetch(`/api/prompt-library/prompts/${row.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("เก็บเข้าถังแล้ว");
      await refresh();
    }
  };

  const markUse = async (row: PromptLibraryCardRow) => {
    const res = await fetch(`/api/prompt-library/prompts/${row.id}/use`, { method: "POST" });
    if (res.ok) {
      const data = (await res.json()) as { item: { usageCount: number } };
      setItems((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, usageCount: data.item.usageCount } : p)),
      );
      showToast("บันทึกการใช้งานแล้ว");
    }
  };

  const copyContent = async (row: PromptLibraryCardRow) => {
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
      await loadCategories();
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

  const selectCategoryChip = (id: string) => {
    setCategoryId(id);
    setCatDraft(id);
  };

  const hasActiveFilter = Boolean(q.trim() || categoryId || favoriteOnly);

  const searchApply = () => {
    setQ(qDraft.trim());
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={onPickImport} />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[80] max-w-sm -translate-x-1/2 rounded-2xl border border-white/60 bg-[#1e1b4b]/92 px-4 py-2 text-center text-sm text-white shadow-lg sm:bottom-6"
        >
          {toast}
        </div>
      ) : null}

      <section className={promptHeroShellClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-white shadow-lg shadow-indigo-200/80"
              aria-hidden
            >
              <IconPromptSpark className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
              <h2 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                คลังคำสั่ง AI
              </h2>
            </div>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(
                appTemplateOutlineButtonClass,
                "hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold sm:text-sm",
              )}
              onClick={() => importRef.current?.click()}
              aria-label="นำเข้า JSON"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              นำเข้า
            </button>
            <button
              type="button"
              className={cn(
                appTemplateOutlineButtonClass,
                "hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold sm:text-sm",
              )}
              onClick={() => void exportJson()}
              aria-label="ส่งออก JSON"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ส่งออก
            </button>
            <Link
              href="/dashboard/prompt-library/categories"
              aria-label="จัดการหมวดหมู่"
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-0 sm:min-w-0 sm:px-4",
              )}
            >
              <IconPromptFolder className="h-5 w-5" aria-hidden />
              <span className="hidden sm:inline">หมวด</span>
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className={cn(
                appDashboardBrandCtaPillButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-0 sm:min-w-0 sm:rounded-full sm:px-5",
              )}
              aria-label="สร้างคำสั่งใหม่"
            >
              <IconPromptSpark className="h-5 w-5" aria-hidden />
              <span className="hidden sm:inline">สร้างใหม่</span>
            </button>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <li>
            <div className={cn(promptStatCardClass, "relative overflow-hidden")}>
              <div aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100/60 via-indigo-200/30 to-transparent blur-xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">คำสั่งทั้งหมด</p>
                <p className="mt-1 bg-gradient-to-br from-[#4338ca] via-[#5b61ff] to-[#6366f1] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
                  {loading ? "…" : stats.total}
                </p>
              </div>
            </div>
          </li>
          <li>
            <div className={cn(promptStatCardClass, "relative overflow-hidden")}>
              <div aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-violet-300/40 via-fuchsia-200/30 to-transparent blur-xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">หมวดหมู่</p>
                <p className="mt-1 bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#c026d3] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
                  {loading ? "…" : categories.length}
                </p>
              </div>
            </div>
          </li>
          <li>
            <div className={cn(promptStatCardClass, "relative overflow-hidden")}>
              <div aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-300/45 via-teal-200/30 to-transparent blur-xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">ใช้แล้ว</p>
                <p className="mt-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-[#0d9488] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
                  {loading ? "…" : stats.usage}
                </p>
              </div>
            </div>
          </li>
          <li>
            <div className={cn(promptStatCardClass, "relative overflow-hidden")}>
              <div aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-300/45 via-orange-200/30 to-transparent blur-xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">ความนิยม</p>
                <p className="mt-1 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
                  {loading ? "…" : stats.favorites}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ค้นหาคำสั่ง"
          description="พิมพ์คำค้น · เลือกหมวด · กรองโปรด"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              className="relative sm:hidden min-h-[40px] min-w-[40px] rounded-xl border border-white/60 bg-white/85 p-2 text-[#4d47b6]"
              onClick={() => {
                setQDraft(q);
                setCatDraft(categoryId);
                setFavDraft(favoriteOnly);
                setFilterOpen(true);
              }}
              aria-label="เปิดตัวกรอง"
            >
              <IconPromptFilter className="mx-auto h-5 w-5" />
              {hasActiveFilter ? (
                <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              ) : null}
            </button>
          }
        />

        <div className="mt-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <IconPromptSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b87b8]" />
            <input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchApply()}
              placeholder="ค้นหาชื่อ แท็ก หรือเนื้อหา…"
              className="min-h-[44px] w-full rounded-2xl border border-white/60 bg-white/80 py-2 pl-10 pr-3 text-sm font-medium text-[#1e1b4b] shadow-sm outline-none ring-[#5b61ff]/15 focus:border-[#5b61ff]/40 focus:ring-2"
              aria-label="ค้นหาคำสั่ง"
            />
          </div>
          <button
            type="button"
            onClick={searchApply}
            className="app-btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-bold"
          >
            <IconPromptSearch className="h-4 w-4" aria-hidden />
            ค้นหา
          </button>
        </div>

        <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
          <select
            value={catDraft}
            onChange={(e) => {
              setCatDraft(e.target.value);
              setCategoryId(e.target.value);
            }}
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
          <label className="flex min-h-[40px] items-center gap-2 rounded-xl border border-white/55 bg-white/60 px-3 text-sm font-semibold text-[#66638c]">
            <input
              type="checkbox"
              checked={favDraft}
              onChange={(e) => {
                setFavDraft(e.target.checked);
                setFavoriteOnly(e.target.checked);
              }}
            />
            เฉพาะโปรด
          </label>
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
          role="tablist"
          aria-label="กรองตามหมวด"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!categoryId}
            className={cn(promptCategoryChipClass, !categoryId && promptCategoryChipActiveClass)}
            onClick={() => selectCategoryChip("")}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={favoriteOnly}
            className={cn(promptCategoryChipClass, favoriteOnly && promptCategoryChipActiveClass)}
            onClick={() => {
              setFavoriteOnly((v) => !v);
              setFavDraft((v) => !v);
            }}
          >
            ⭐ โปรด
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={categoryId === c.id}
              className={cn(
                promptCategoryChipClass,
                categoryId === c.id && promptCategoryChipActiveClass,
              )}
              onClick={() => selectCategoryChip(c.id)}
            >
              <span aria-hidden>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      </AppDashboardSection>

      {loading ? (
        <p className="text-center text-sm font-medium text-[#66638c]">กำลังโหลดคำสั่ง…</p>
      ) : items.length === 0 ? (
        <AppDashboardSection tone="violet">
          <AppEmptyState tone="violet">
            {hasActiveFilter
              ? "ไม่พบคำสั่งที่ตรงเงื่อนไข — ลองเปลี่ยนคำค้นหรือหมวด"
              : "ยังไม่มีคำสั่ง — กด «เพิ่มคำสั่ง» เพื่อเริ่มสร้างคลังของคุณ"}
          </AppEmptyState>
        </AppDashboardSection>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {groupedSections.map((section) => (
            <AppDashboardSection key={section.key} tone="violet">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg text-white shadow-sm"
                  style={{ backgroundColor: section.color }}
                  aria-hidden
                >
                  {section.icon}
                </span>
                <AppSectionHeader
                  tone="violet"
                  className="min-w-0 flex-1 !mt-0"
                  title={section.title}
                  description={`${section.items.length.toLocaleString("th-TH")} คำสั่งในหมวดนี้`}
                />
              </div>
              <ul className={cn(promptPromptGridClass, "mt-4")}>
                {section.items.map((row) => (
                  <li key={row.id} className="min-w-0">
                    <PromptLibraryCard
                      row={row}
                      onCopy={(r) => void copyContent(r)}
                      onUse={(r) => void markUse(r)}
                      onEdit={openEdit}
                      onRemove={(r) => void remove(r)}
                    />
                  </li>
                ))}
              </ul>
            </AppDashboardSection>
          ))}
        </div>
      )}

      <FormModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="ตัวกรอง"
        description="ค้นหาและจำกัดหมวด / รายการโปรด"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setFilterOpen(false)}
            onSubmit={applyFilters}
            submitLabel="ใช้ตัวกรอง"
          />
        }
      >
        <div className="space-y-3 px-1 py-1">
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
          <label className="flex items-center gap-2 text-sm font-medium text-[#66638c]">
            <input type="checkbox" checked={favDraft} onChange={(e) => setFavDraft(e.target.checked)} />
            เฉพาะโปรด
          </label>
        </div>
      </FormModal>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "แก้ไขคำสั่ง" : "สร้างคำสั่งใหม่"}
        description="เก็บ prompt สำหรับนำไปวางในเครื่องมือ AI"
        size="xl"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void save()}
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
            <label className="text-xs font-semibold text-[#66638c]">แท็ก (คั่นด้วยจุลภาค)</label>
            <input
              className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
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
              <label className="text-xs font-semibold text-[#66638c]">บันทึกการเปลี่ยนแปลง (ประวัติเวอร์ชัน)</label>
              <input
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.changeNote}
                onChange={(e) => setForm((f) => ({ ...f, changeNote: e.target.value }))}
              />
            </div>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}
