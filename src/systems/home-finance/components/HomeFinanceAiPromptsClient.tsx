"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDigestDateTimeLabel } from "@/lib/reminders/bangkok-calendar";
import { HomeFinanceOverviewSubNav } from "@/systems/home-finance/components/HomeFinancePageSubNav";
import {
  HomeFinanceCardHeaderActions,
  HomeFinanceCardIconFilterButton,
  HomeFinanceCardIconRefreshButton,
} from "@/systems/home-finance/components/HomeFinanceCardHeaderActions";
import {
  HomeFinanceModalActionBar,
  HomeFinanceModalBackdrop,
  HomeFinanceModalPanel,
  HomeFinancePrimaryButton,
  HomeFinanceRowActionIconButton,
  HomeFinanceRowIconCopy,
  HomeFinanceRowIconEdit,
  HomeFinanceRowIconTrash,
  HomeFinanceSecondaryButton,
} from "@/systems/home-finance/components/HomeFinanceUi";
import { homeFinanceTonedRowCardClass } from "@/systems/home-finance/lib/card-tones";
import {
  homeFinanceFieldClass,
  homeFinanceFilterChipClass,
  homeFinanceFilterChipShellClass,
  homeFinanceOffersEmptyStateClass,
  homeFinanceOutlineButtonClass,
  homeFinancePrimaryButtonClass,
  homeFinanceTextareaClass,
} from "@/systems/home-finance/lib/ui-tokens";

type PromptCategory = {
  id: number;
  name: string;
  sortOrder: number;
};

type PromptRow = {
  id: number;
  title: string;
  content: string;
  promptType: string;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
};

export function HomeFinanceAiPromptsClient() {
  const notice = useAppNoticePopup();
  const [items, setItems] = useState<PromptRow[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCatId, setFilterCatId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", categoryId: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catMode, setCatMode] = useState<"list" | "form">("list");
  const [catEditId, setCatEditId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({ name: "", sortOrder: "100" });
  const [catError, setCatError] = useState<string | null>(null);
  const [catBusy, setCatBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/home-finance/ai-prompt-categories", { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { categories?: PromptCategory[]; error?: string };
      if (!res.ok) return;
      setCategories(j.categories ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/home-finance/ai-prompts?_=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as { items?: PromptRow[]; error?: string };
      if (!res.ok) {
        setError(j.error ?? "โหลด Prompt ไม่สำเร็จ");
        setItems([]);
        return;
      }
      setItems(j.items ?? []);
    } catch {
      setError("เครือข่ายมีปัญหา");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadCategories();
  }, [load, loadCategories]);

  const filtersActive = search.trim().length > 0 || filterCatId != null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filterCatId != null && p.categoryId !== filterCatId) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.promptType.toLowerCase().includes(q)
      );
    });
  }, [items, search, filterCatId]);

  const openCreate = () => {
    setEditId(null);
    setForm({
      title: "",
      content: "",
      categoryId: categories[0] ? String(categories[0].id) : "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: PromptRow) => {
    setEditId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      categoryId: row.categoryId != null ? String(row.categoryId) : "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openCatManage = () => {
    setCatMode("list");
    setCatEditId(null);
    setCatForm({ name: "", sortOrder: "100" });
    setCatError(null);
    setCatModalOpen(true);
  };

  const openCatCreate = () => {
    setCatEditId(null);
    setCatForm({ name: "", sortOrder: "100" });
    setCatError(null);
    setCatMode("form");
  };

  const openCatEdit = (c: PromptCategory) => {
    setCatEditId(c.id);
    setCatForm({ name: c.name, sortOrder: String(c.sortOrder) });
    setCatError(null);
    setCatMode("form");
  };

  const submitCategory = async () => {
    const name = catForm.name.trim();
    if (!name) {
      setCatError("กรอกชื่อหมวด");
      return;
    }
    const order = Number(catForm.sortOrder.trim() || "100");
    if (!Number.isInteger(order) || order < 1 || order > 999) {
      setCatError("ลำดับต้องเป็นจำนวนเต็ม 1–999");
      return;
    }
    setCatBusy(true);
    setCatError(null);
    try {
      const isEdit = catEditId != null;
      const res = await fetch(
        isEdit
          ? `/api/home-finance/ai-prompt-categories/${catEditId}`
          : "/api/home-finance/ai-prompt-categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, sortOrder: order }),
        },
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCatError(j.error ?? "บันทึกหมวดไม่สำเร็จ");
        return;
      }
      await loadCategories();
      await load();
      setCatMode("list");
      setCatEditId(null);
    } catch {
      setCatError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setCatBusy(false);
    }
  };

  const removeCategory = async (c: PromptCategory) => {
    const ok = await notice.confirm(`ลบหมวด «${c.name}»?`);
    if (!ok) return;
    setCatBusy(true);
    setCatError(null);
    try {
      const res = await fetch(`/api/home-finance/ai-prompt-categories/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCatError(j.error ?? "ลบหมวดไม่สำเร็จ");
        return;
      }
      if (filterCatId === c.id) setFilterCatId(null);
      await loadCategories();
    } catch {
      setCatError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setCatBusy(false);
    }
  };

  const submitForm = async () => {
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
      setFormError("กรอกหัวข้อ");
      return;
    }
    if (!content) {
      setFormError("กรอกรายละเอียด prompt");
      return;
    }
    if (!form.categoryId.trim()) {
      setFormError("เลือกหมวดหมู่ — หรือกด «หมวดหมู่» เพื่อเพิ่มก่อน");
      return;
    }
    const categoryId = Number(form.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setFormError("หมวดหมู่ไม่ถูกต้อง");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(
        editId != null ? `/api/home-finance/ai-prompts/${editId}` : "/api/home-finance/ai-prompts",
        {
          method: editId != null ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, categoryId }),
        },
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      await load();
    } catch {
      setFormError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const removePrompt = async (row: PromptRow) => {
    const ok = await notice.confirm(`ลบ Prompt «${row.title}»?`);
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`/api/home-finance/ai-prompts/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "ลบไม่สำเร็จ");
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== row.id));
    } catch {
      setError("ลบไม่สำเร็จ");
    }
  };

  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      notice.success("คัดลอก Prompt แล้ว");
    } catch {
      notice.error("คัดลอกไม่สำเร็จ");
    }
  };

  return (
    <HomeFinanceOverviewSubNav
      action={
        <HomeFinanceCardHeaderActions>
          <HomeFinanceCardIconFilterButton
            expanded={filterOpen}
            filtersActive={filtersActive}
            controls="home-finance-prompts-filter-panel"
            onClick={() => setFilterOpen((o) => !o)}
          />
          <HomeFinanceCardIconRefreshButton
            label="รีเฟรชรายการ Prompt"
            onClick={() => void load()}
            disabled={loading || saving}
            busy={loading}
          />
          <button
            type="button"
            onClick={openCatManage}
            className={cn(homeFinanceOutlineButtonClass, "min-w-[40px] sm:min-w-0")}
            aria-label="จัดการหมวดหมู่ Prompt"
            title="หมวดหมู่"
          >
            <span className="sm:hidden" aria-hidden>
              หมวด
            </span>
            <span className="hidden sm:inline">หมวดหมู่</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            className={cn(homeFinancePrimaryButtonClass, "min-w-[40px] sm:min-w-0")}
            aria-label="เพิ่ม Prompt AI"
          >
            <span className="sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่ม</span>
          </button>
        </HomeFinanceCardHeaderActions>
      }
    >
      {notice.popup}
      <div className="space-y-3">
        <div id="home-finance-prompts-filter-panel" className={cn(filterOpen ? "block space-y-3" : "hidden")}>
          <label className="block text-xs font-medium text-slate-600">
            ค้นหา
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(homeFinanceFieldClass, "mt-1")}
              placeholder="หัวข้อ · รายละเอียด · หมวด…"
              aria-label="ค้นหา Prompt"
            />
          </label>
          {categories.length > 0 ? (
            <div
              className={cn(homeFinanceFilterChipShellClass, "overflow-x-auto")}
              role="group"
              aria-label="กรองตามหมวดหมู่"
            >
              <div className="flex w-max gap-2">
                <button
                  type="button"
                  aria-pressed={filterCatId == null}
                  className={homeFinanceFilterChipClass(filterCatId == null)}
                  onClick={() => setFilterCatId(null)}
                >
                  ทั้งหมด
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={filterCatId === c.id}
                    className={homeFinanceFilterChipClass(filterCatId === c.id)}
                    onClick={() => setFilterCatId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {filtersActive ? (
            <button
              type="button"
              className={homeFinanceOutlineButtonClass}
              onClick={() => {
                setSearch("");
                setFilterCatId(null);
              }}
            >
              ล้างกรอง
            </button>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <p className="text-xs font-medium text-[#66638c]">
          {loading
            ? "กำลังโหลด…"
            : filtersActive
              ? `แสดง ${filtered.length}/${items.length} รายการ`
              : `${items.length} รายการ`}
        </p>

        {loading && !items.length ? (
          <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : !filtered.length ? (
          <div className={homeFinanceOffersEmptyStateClass}>
            {items.length === 0 ? "ยังไม่มี Prompt — กด «+ เพิ่ม»" : "ไม่พบรายการตามเงื่อนไขกรอง"}
          </div>
        ) : (
          <ul className="w-full space-y-2" aria-label="รายการ Prompt AI">
            {filtered.map((row) => (
              <li
                key={row.id}
                className={cn(homeFinanceTonedRowCardClass("violet"), "w-full items-start p-3 sm:p-4")}
              >
                <div className="min-w-0 flex-1 space-y-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1e1b4b]">{row.title}</p>
                    {row.promptType ? (
                      <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                        {row.promptType}
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-3 whitespace-pre-wrap text-xs text-[#66638c]">{row.content}</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    อัปเดต {formatBangkokDigestDateTimeLabel(row.updatedAt)}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1 self-start">
                  <HomeFinanceRowActionIconButton
                    variant="muted"
                    title="คัดลอก"
                    aria-label={`คัดลอก ${row.title}`}
                    onClick={() => void copyContent(row.content)}
                  >
                    <HomeFinanceRowIconCopy />
                  </HomeFinanceRowActionIconButton>
                  <HomeFinanceRowActionIconButton
                    variant="primary"
                    title="แก้ไข"
                    aria-label={`แก้ไข ${row.title}`}
                    onClick={() => openEdit(row)}
                  >
                    <HomeFinanceRowIconEdit />
                  </HomeFinanceRowActionIconButton>
                  <HomeFinanceRowActionIconButton
                    variant="danger"
                    title="ลบ"
                    aria-label={`ลบ ${row.title}`}
                    onClick={() => void removePrompt(row)}
                  >
                    <HomeFinanceRowIconTrash />
                  </HomeFinanceRowActionIconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => !saving && setModalOpen(false)}>
          <HomeFinanceModalPanel
            title={editId == null ? "เพิ่ม Prompt AI" : "แก้ไข Prompt AI"}
            titleId="hf-ai-prompt-form-title"
            onClose={() => !saving && setModalOpen(false)}
            error={formError}
            maxWidthClassName="max-w-lg"
          >
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submitForm();
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#66638c]">หัวข้อ</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className={homeFinanceFieldClass}
                  placeholder="เช่น สรุปสลิปธนาคาร"
                  maxLength={160}
                  required
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#66638c]">หมวดหมู่</span>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
                  className={homeFinanceFieldClass}
                  disabled={saving}
                  required
                >
                  <option value="">— เลือกหมวด —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 ? (
                  <p className="mt-1 text-[11px] text-[#66638c]">ยังไม่มีหมวด — กดปุ่ม «หมวดหมู่» เพื่อเพิ่มก่อน</p>
                ) : null}
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#66638c]">รายละเอียด Prompt</span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  rows={8}
                  className={homeFinanceTextareaClass}
                  placeholder="วางข้อความ prompt ที่ต้องการใช้ซ้ำ…"
                  maxLength={20000}
                  required
                  disabled={saving}
                />
              </label>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton type="button" disabled={saving} onClick={() => setModalOpen(false)}>
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก…" : "บันทึก"}
                </HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      {catModalOpen ? (
        <HomeFinanceModalBackdrop
          onBackdropClick={() => {
            if (!catBusy) setCatModalOpen(false);
          }}
        >
          <HomeFinanceModalPanel
            title={catMode === "list" ? "หมวดหมู่ Prompt" : catEditId == null ? "เพิ่มหมวด" : "แก้ไขหมวด"}
            titleId="hf-ai-prompt-cat-title"
            onClose={() => {
              if (!catBusy) setCatModalOpen(false);
            }}
            error={catError}
            maxWidthClassName="max-w-md"
          >
            {catMode === "list" ? (
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    ยังไม่มีหมวด — กดเพิ่มด้านล่าง
                  </p>
                ) : (
                  <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                    {categories.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-slate-50/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#1e1b4b]">{c.name}</p>
                          <p className="text-[10px] text-slate-400">ลำดับ {c.sortOrder}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <HomeFinanceRowActionIconButton
                            variant="primary"
                            title="แก้ไข"
                            aria-label={`แก้ไขหมวด ${c.name}`}
                            disabled={catBusy}
                            onClick={() => openCatEdit(c)}
                          >
                            <HomeFinanceRowIconEdit />
                          </HomeFinanceRowActionIconButton>
                          <HomeFinanceRowActionIconButton
                            variant="danger"
                            title="ลบ"
                            aria-label={`ลบหมวด ${c.name}`}
                            disabled={catBusy}
                            onClick={() => void removeCategory(c)}
                          >
                            <HomeFinanceRowIconTrash />
                          </HomeFinanceRowActionIconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <HomeFinanceModalActionBar>
                  <HomeFinanceSecondaryButton type="button" onClick={() => setCatModalOpen(false)} disabled={catBusy}>
                    ปิด
                  </HomeFinanceSecondaryButton>
                  <HomeFinancePrimaryButton type="button" onClick={openCatCreate} disabled={catBusy}>
                    + เพิ่มหมวด
                  </HomeFinancePrimaryButton>
                </HomeFinanceModalActionBar>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitCategory();
                }}
              >
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-[#66638c]">ชื่อหมวด</span>
                  <input
                    value={catForm.name}
                    onChange={(e) => setCatForm((s) => ({ ...s, name: e.target.value }))}
                    className={homeFinanceFieldClass}
                    placeholder="เช่น ทั่วไป / วิเคราะห์ / สรุป"
                    maxLength={80}
                    required
                    disabled={catBusy}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-[#66638c]">ลำดับ</span>
                  <input
                    value={catForm.sortOrder}
                    onChange={(e) => setCatForm((s) => ({ ...s, sortOrder: e.target.value }))}
                    className={homeFinanceFieldClass}
                    inputMode="numeric"
                    maxLength={3}
                    disabled={catBusy}
                  />
                </label>
                <HomeFinanceModalActionBar>
                  <HomeFinanceSecondaryButton
                    type="button"
                    disabled={catBusy}
                    onClick={() => {
                      setCatMode("list");
                      setCatError(null);
                    }}
                  >
                    กลับ
                  </HomeFinanceSecondaryButton>
                  <HomeFinancePrimaryButton type="submit" disabled={catBusy}>
                    {catBusy ? "กำลังบันทึก…" : "บันทึก"}
                  </HomeFinancePrimaryButton>
                </HomeFinanceModalActionBar>
              </form>
            )}
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}
    </HomeFinanceOverviewSubNav>
  );
}
