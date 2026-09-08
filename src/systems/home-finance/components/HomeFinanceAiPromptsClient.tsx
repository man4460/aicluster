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

const PROMPT_TYPE_OPTIONS = ["ทั่วไป", "วิเคราะห์", "สรุป", "เขียน", "แปล", "โค้ด", "อื่นๆ"] as const;

type PromptRow = {
  id: number;
  title: string;
  content: string;
  promptType: string;
  createdAt: string;
  updatedAt: string;
};

export function HomeFinanceAiPromptsClient() {
  const notice = useAppNoticePopup();
  const [items, setItems] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", promptType: "ทั่วไป" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  }, [load]);

  const typeOptions = useMemo(() => {
    const fromData = new Set<string>(PROMPT_TYPE_OPTIONS);
    for (const it of items) {
      if (it.promptType.trim()) fromData.add(it.promptType.trim());
    }
    return Array.from(fromData);
  }, [items]);

  const filtersActive = search.trim().length > 0 || typeFilter.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter && p.promptType !== typeFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.promptType.toLowerCase().includes(q)
      );
    });
  }, [items, search, typeFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm({ title: "", content: "", promptType: "ทั่วไป" });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: PromptRow) => {
    setEditId(row.id);
    setForm({ title: row.title, content: row.content, promptType: row.promptType || "ทั่วไป" });
    setFormError(null);
    setModalOpen(true);
  };

  const submitForm = async () => {
    const title = form.title.trim();
    const content = form.content.trim();
    const promptType = form.promptType.trim() || "ทั่วไป";
    if (!title) {
      setFormError("กรอกหัวข้อ");
      return;
    }
    if (!content) {
      setFormError("กรอกรายละเอียด prompt");
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
          body: JSON.stringify({ title, content, promptType }),
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
      await notice.success("คัดลอก Prompt แล้ว");
    } catch {
      await notice.error("คัดลอกไม่สำเร็จ");
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
              placeholder="หัวข้อ · รายละเอียด · ประเภท…"
              aria-label="ค้นหา Prompt"
            />
          </label>
          {typeOptions.length > 0 ? (
            <div className={cn(homeFinanceFilterChipShellClass, "overflow-x-auto")} role="group" aria-label="กรองประเภท">
              <div className="flex w-max gap-2">
                <button
                  type="button"
                  aria-pressed={!typeFilter}
                  className={homeFinanceFilterChipClass(!typeFilter)}
                  onClick={() => setTypeFilter("")}
                >
                  ทั้งหมด
                </button>
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={typeFilter === t}
                    className={homeFinanceFilterChipClass(typeFilter === t)}
                    onClick={() => setTypeFilter(t)}
                  >
                    {t}
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
                setTypeFilter("");
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
          <ul className="space-y-2">
            {filtered.map((row) => (
              <li key={row.id} className={cn(homeFinanceTonedRowCardClass("violet"), "p-3 sm:p-4")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#1e1b4b]">{row.title}</p>
                      <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                        {row.promptType}
                      </span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-xs text-[#66638c]">{row.content}</p>
                    <p className="text-[10px] font-medium text-slate-400">
                      อัปเดต {formatBangkokDigestDateTimeLabel(row.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <button
                      type="button"
                      className={cn(homeFinanceOutlineButtonClass, "min-h-7 px-2 text-[10px]")}
                      onClick={() => void copyContent(row.content)}
                      aria-label={`คัดลอก ${row.title}`}
                      title="คัดลอก"
                    >
                      คัดลอก
                    </button>
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
                <span className="text-xs font-semibold text-[#66638c]">ประเภท</span>
                <select
                  value={form.promptType}
                  onChange={(e) => setForm((s) => ({ ...s, promptType: e.target.value }))}
                  className={homeFinanceFieldClass}
                  disabled={saving}
                >
                  {PROMPT_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
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
    </HomeFinanceOverviewSubNav>
  );
}
