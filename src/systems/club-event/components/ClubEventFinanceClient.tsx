"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppPickGalleryImageButton,
  AppTakePhotoButton,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import type { ClubEventFinanceDto, ClubFinanceCategory } from "@/systems/club-event/lib/mappers";
import {
  DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES,
  CLUB_EVENT_FINANCE_TYPE_LABELS,
} from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventFilterChipClass,
  clubEventFilterChipShellClass,
  clubEventFinanceStatsGridClass,
  clubEventFinanceStatTailClass,
  clubEventFixedBottomActionClass,
  clubEventInlineSubNavBtnClass,
  clubEventInlineSubNavShellClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventRowCardClass,
  clubEventStatInlineClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}

function newCatId() {
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ClubEventFinanceClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [listTab, setListTab] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [filterOpen, setFilterOpen] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [rows, setRows] = useState<ClubEventFinanceDto[]>([]);
  const [categories, setCategories] = useState<ClubFinanceCategory[]>(DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [form, setForm] = useState({
    id: "",
    type: "INCOME" as "INCOME" | "EXPENSE",
    category: "",
    amountBaht: "",
    transactedAt: new Date().toISOString().slice(0, 16),
    note: "",
    slipUrl: "" as string | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, profRes] = await Promise.all([
        fetch("/api/club-event/session/finance"),
        fetch("/api/club-event/session/profile"),
      ]);
      const fin = (await finRes.json()) as {
        summary?: { income: number; expense: number; balance: number };
        transactions?: ClubEventFinanceDto[];
        error?: string;
      };
      const prof = (await profRes.json()) as {
        profile?: { financeCategories?: ClubFinanceCategory[] };
        error?: string;
      };
      if (!finRes.ok) throw new Error(fin.error ?? "โหลดไม่สำเร็จ");
      setSummary(fin.summary ?? { income: 0, expense: 0, balance: 0 });
      setRows(fin.transactions ?? []);
      if (prof.profile?.financeCategories?.length) {
        setCategories(prof.profile.financeCategories);
      }
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const catsForTab = useMemo(
    () => categories.filter((c) => c.type === listTab),
    [categories, listTab],
  );

  const visibleRows = useMemo(
    () => rows.filter((r) => r.type === listTab),
    [rows, listTab],
  );

  const openCreate = (type: "INCOME" | "EXPENSE") => {
    const cats = categories.filter((c) => c.type === type);
    if (cats.length === 0) {
      setListTab(type);
      setCatsOpen(true);
      return;
    }
    setForm({
      id: "",
      type,
      category: cats[0]?.name ?? "",
      amountBaht: "",
      transactedAt: new Date().toISOString().slice(0, 16),
      note: "",
      slipUrl: null,
    });
    setListTab(type);
    setModalOpen(true);
  };

  const openEdit = (row: ClubEventFinanceDto) => {
    setForm({
      id: row.id,
      type: row.type,
      category: row.category,
      amountBaht: String(row.amountBaht),
      transactedAt: row.transactedAt.slice(0, 16),
      note: row.note,
      slipUrl: row.slipUrl,
    });
    setListTab(row.type);
    setModalOpen(true);
  };

  const saveCategories = async (next: ClubFinanceCategory[]) => {
    setCategories(next);
    const res = await fetch("/api/club-event/session/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeCategories: next }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "บันทึกหมวดไม่สำเร็จ");
  };

  const addCategory = async () => {
    const name = catName.trim();
    if (!name) return;
    try {
      const next = [...categories, { id: newCatId(), name: name.slice(0, 120), type: listTab }];
      await saveCategories(next);
      setCatName("");
      notice.success("เพิ่มหมวดแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    }
  };

  const removeCategory = async (id: string) => {
    const ok = await notice.confirm("ลบหมวดนี้ใช่หรือไม่?");
    if (!ok) return;
    try {
      await saveCategories(categories.filter((c) => c.id !== id));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ");
    }
  };

  const save = async () => {
    const amountBaht = Number(form.amountBaht);
    if (!form.category.trim() || !Number.isFinite(amountBaht) || amountBaht <= 0) {
      notice.error("เลือกหมวดและกรอกจำนวนเงิน");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category: form.category,
        amountBaht,
        transactedAt: new Date(form.transactedAt).toISOString(),
        note: form.note,
        slipUrl: form.slipUrl,
      };
      const res = await fetch(
        form.id ? `/api/club-event/session/finance/${form.id}` : "/api/club-event/session/finance",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setModalOpen(false);
      await load();
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await notice.confirm("ลบรายการนี้ใช่หรือไม่?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/club-event/session/finance/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const uploadSlipFile = async (file: File) => {
    setPhotoBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const formData = new FormData();
      formData.set("file", prepared);
      const res = await fetch("/api/club-event/session/images/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setForm((f) => ({ ...f, slipUrl: data.imageUrl ?? null }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setPhotoBusy(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void uploadSlipFile(f);
    e.target.value = "";
  };

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="การเงิน"
        subtitle={CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]}
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
            <nav className={clubEventInlineSubNavShellClass} role="tablist" aria-label="รายรับหรือรายจ่าย">
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "INCOME"}
                className={clubEventInlineSubNavBtnClass(listTab === "INCOME")}
                onClick={() => setListTab("INCOME")}
              >
                <span className="hidden sm:inline">รายรับ</span>
                <span className="sm:hidden" aria-hidden>
                  รับ
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "EXPENSE"}
                className={clubEventInlineSubNavBtnClass(listTab === "EXPENSE")}
                onClick={() => setListTab("EXPENSE")}
              >
                <span className="hidden sm:inline">รายจ่าย</span>
                <span className="sm:hidden" aria-hidden>
                  จ่าย
                </span>
              </button>
            </nav>
            <div className={clubEventInlineSubNavShellClass}>
              <button
                type="button"
                className={clubEventInlineSubNavBtnClass(false)}
                title={listTab === "INCOME" ? "บันทึกรายรับเพิ่ม" : "บันทึกรายจ่าย"}
                aria-label={listTab === "INCOME" ? "บันทึกรายรับเพิ่ม" : "บันทึกรายจ่าย"}
                onClick={() => openCreate(listTab)}
              >
                <IconPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{listTab === "INCOME" ? "รายรับเพิ่ม" : "รายจ่ายเพิ่ม"}</span>
              </button>
            </div>
            <span className="hidden h-5 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />
            <div className={clubEventInlineSubNavShellClass}>
              <button
                type="button"
                className={clubEventInlineSubNavBtnClass(catsOpen)}
                title="จัดการหมวดหมู่"
                aria-label="จัดการหมวดหมู่"
                onClick={() => setCatsOpen(true)}
              >
                <IconFolder className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">จัดการหมวด</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={clubEventInlineSubNavBtnClass(filterOpen)}
              >
                <IconFilter className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              </button>
            </div>
          </div>
        }
      >
        <ul className={clubEventFinanceStatsGridClass} aria-label="สรุปการเงิน">
          <li className={cn(clubEventStatInlineClass, "border-l-[3px] border-l-emerald-500")}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">รายรับ</p>
            <p className="text-lg font-black tabular-nums text-emerald-700 sm:text-xl">
              ฿{summary.income.toLocaleString("th-TH")}
            </p>
          </li>
          <li className={cn(clubEventStatInlineClass, "border-l-[3px] border-l-rose-500")}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600/80">รายจ่าย</p>
            <p className="text-lg font-black tabular-nums text-rose-600 sm:text-xl">
              ฿{summary.expense.toLocaleString("th-TH")}
            </p>
          </li>
          <li
            className={cn(
              clubEventStatInlineClass,
              clubEventFinanceStatTailClass,
              "border-l-[3px]",
              summary.balance >= 0 ? "border-l-slate-400" : "border-l-rose-500",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">คงเหลือ</p>
            <p
              className={cn(
                "text-lg font-black tabular-nums sm:text-xl",
                summary.balance >= 0 ? "text-[#1e1b4b]" : "text-rose-800",
              )}
            >
              ฿{summary.balance.toLocaleString("th-TH")}
            </p>
          </li>
        </ul>

        {filterOpen ? (
          <div className={cn(clubEventFilterChipShellClass, "mt-4")} role="tablist" aria-label="กรองหมวด">
            <button
              type="button"
              role="tab"
              aria-selected
              className={clubEventFilterChipClass(true)}
            >
              {CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]} · {visibleRows.length} รายการ
            </button>
            {catsForTab.map((c) => (
              <span key={c.id} className={clubEventFilterChipClass(false)}>
                {c.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : visibleRows.length === 0 ? (
            <AppEmptyState>ยังไม่มี{CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]} — กดปุ่มเพิ่มด้านบน</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {visibleRows.map((row) => (
                <li key={row.id} className={clubEventRowCardClass}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {row.slipUrl ? (
                      <AppImageThumb src={row.slipUrl} alt="สลิป" onOpen={() => lb.open(row.slipUrl!)} />
                    ) : (
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-400"
                        aria-hidden
                      >
                        ไม่มีสลิป
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1e1b4b]">{row.category}</p>
                      <p className="text-sm text-[#66638c]">{formatBangkokDateTimeLong(row.transactedAt)}</p>
                      {row.note ? <p className="text-xs text-[#5f5a8a]">{row.note}</p> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <p
                      className={cn(
                        "text-base font-black tabular-nums",
                        row.type === "INCOME" ? "text-emerald-700" : "text-rose-600",
                      )}
                    >
                      {row.type === "EXPENSE" ? "-" : "+"}
                      {row.amountBaht.toLocaleString("th-TH")} ฿
                    </p>
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${row.category}`}
                      onClick={() => openEdit(row)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${row.category}`}
                      onClick={() => void remove(row.id)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ClubEventPageSubNav>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? `แก้ไข${CLUB_EVENT_FINANCE_TYPE_LABELS[form.type]}` : `เพิ่ม${CLUB_EVENT_FINANCE_TYPE_LABELS[form.type]}`}
        mobileCentered
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button
              type="button"
              className={cn(clubEventPrimaryButtonClass, "w-full sm:w-auto sm:px-6")}
              disabled={saving}
              onClick={() => void save()}
            >
              บันทึก
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">หมวดหมู่</span>
            <select
              className={clubEventFieldClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">เลือกหมวด</option>
              {categories
                .filter((c) => c.type === form.type)
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">จำนวนเงิน (บาท)</span>
            <input
              className={clubEventFieldClass}
              inputMode="numeric"
              value={form.amountBaht}
              onChange={(e) => setForm({ ...form, amountBaht: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">วันเวลา</span>
            <input
              type="datetime-local"
              className={clubEventFieldClass}
              value={form.transactedAt}
              onChange={(e) => setForm({ ...form, transactedAt: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">หมายเหตุ</span>
            <textarea
              className={clubEventTextareaClass}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>

          <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-[#faf8ff] via-white to-emerald-50/40 p-4 shadow-sm ring-1 ring-violet-100/60">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/90">
                  แนบสลิป / บิล (ไม่บังคับ)
                </p>
                <p className="mt-0.5 text-xs text-slate-600">อัปโหลดหรือถ่ายรูป</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <AppPickGalleryImageButton
                  type="button"
                  disabled={photoBusy}
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex h-9 w-9 min-h-0 items-center justify-center !p-0"
                  aria-label="อัปโหลดรูปสลิป"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </AppPickGalleryImageButton>
                <AppTakePhotoButton
                  type="button"
                  disabled={photoBusy}
                  onClick={() => setCameraOpen(true)}
                  className="inline-flex h-9 w-9 min-h-0 items-center justify-center !p-0"
                  aria-label="ถ่ายรูปสลิป"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </AppTakePhotoButton>
              </div>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={onFileInputChange}
            />
            {photoBusy ? <p className="mt-2 text-xs font-medium text-violet-700">กำลังอัปโหลดรูป…</p> : null}
            {form.slipUrl ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3">
                <AppImageThumb src={form.slipUrl} alt="สลิปแนบ" onOpen={() => lb.open(form.slipUrl!)} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700">แนบแล้ว</p>
                </div>
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => setForm((f) => ({ ...f, slipUrl: null }))}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  ลบรูป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={catsOpen}
        onClose={() => setCatsOpen(false)}
        title={`จัดการหมวด · ${CLUB_EVENT_FINANCE_TYPE_LABELS[listTab]}`}
        mobileCentered
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              className={clubEventFieldClass}
              placeholder="ชื่อหมวดใหม่"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button type="button" className={clubEventPrimaryButtonClass} onClick={() => void addCategory()}>
              เพิ่ม
            </button>
          </div>
          {catsForTab.length === 0 ? (
            <AppEmptyState>ยังไม่มีหมวด — เพิ่มก่อนบันทึกรายการ</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {catsForTab.map((c) => (
                <li key={c.id} className={cn(clubEventRowCardClass, "sm:items-center")}>
                  <p className="font-bold text-[#1e1b4b]">{c.name}</p>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    onClick={() => void removeCategory(c.id)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={cn(clubEventOutlineButtonClass, "w-full")}
            onClick={() => {
              setCatsOpen(false);
              openCreate(listTab);
            }}
          >
            ปิดแล้วเพิ่มรายการ
          </button>
        </div>
      </FormModal>

      <AppCameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          setCameraOpen(false);
          void uploadSlipFile(file);
        }}
        onRequestLegacyPicker={() => galleryInputRef.current?.click()}
      />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}
