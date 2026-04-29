"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppPickGalleryImageButton,
  AppSectionHeader,
  AppTakePhotoButton,
  useAppImageLightbox,
} from "@/components/app-templates";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import { PopupIconButton, popupIconBtnDanger } from "@/systems/car-wash/car-wash-popup-icon-buttons";
import {
  uploadCarWashSessionImage,
  type CarWashRepository,
  type CostCategory,
  type CostEntry,
} from "@/systems/car-wash/car-wash-service";

function isoToDatetimeLocalInput(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tz);
  return local.toISOString().slice(0, 16);
}

function datetimeLocalToIso(localValue: string): string {
  if (!localValue.trim()) return new Date().toISOString();
  const d = new Date(localValue);
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

function CostSlipAttachmentZone({
  slipUrl,
  onSlipUrlChange,
  photoBusy,
  previewUrl,
  galleryInputRef,
  onFileInputChange,
  onOpenModalCamera,
  cameraOpen,
  onCloseCamera,
  onCameraCapture,
  onRequestLegacyPicker,
  disabled,
}: {
  slipUrl: string;
  onSlipUrlChange: (url: string) => void;
  photoBusy: boolean;
  previewUrl: string | null;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenModalCamera: () => void;
  cameraOpen: boolean;
  onCloseCamera: () => void;
  onCameraCapture: (file: File) => void;
  onRequestLegacyPicker: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-[#faf8ff] via-white to-rose-50/40 p-4 shadow-sm ring-1 ring-violet-100/60">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800/90">แนบสลิป / บิล (ไม่บังคับ)</p>
          <p className="mt-0.5 text-xs text-slate-600">อัปโหลดหรือถ่ายรูป — สไตล์เดียวกับสลิป POS</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <AppPickGalleryImageButton
            type="button"
            disabled={disabled || photoBusy}
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
            disabled={disabled || photoBusy}
            onClick={onOpenModalCamera}
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

      {slipUrl.trim() && previewUrl ?
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="สลิปแนบ" className="h-20 w-auto max-w-[min(100%,12rem)] rounded-lg object-cover object-center ring-1 ring-slate-200" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700">แนบแล้ว</p>
            <p className="truncate text-[11px] text-slate-500">{slipUrl.slice(0, 80)}{slipUrl.length > 80 ? "…" : ""}</p>
          </div>
          <button
            type="button"
            disabled={disabled || photoBusy}
            onClick={() => onSlipUrlChange("")}
            className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            ลบรูป
          </button>
        </div>
      : null}

      <AppCameraCaptureModal
        open={cameraOpen}
        onClose={onCloseCamera}
        onCapture={(file) => onCameraCapture(file)}
        onRequestLegacyPicker={onRequestLegacyPicker}
      />
    </div>
  );
}

export function CarWashCostPanel({
  repo,
  baseUrl,
  categories,
  entries,
  onRefresh,
}: {
  repo: CarWashRepository;
  baseUrl: string;
  categories: CostCategory[];
  entries: CostEntry[];
  onRefresh: () => Promise<void>;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [editCat, setEditCat] = useState<CostCategory | null>(null);

  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryCategoryId, setEntryCategoryId] = useState("");
  const [entrySpentLocal, setEntrySpentLocal] = useState(() => isoToDatetimeLocalInput(new Date().toISOString()));
  const [entryAmount, setEntryAmount] = useState("");
  const [entryItemLabel, setEntryItemLabel] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entrySlipUrl, setEntrySlipUrl] = useState("");

  const [editEntry, setEditEntry] = useState<CostEntry | null>(null);
  const [editEntryForm, setEditEntryForm] = useState<{
    category_id: string;
    spent_at_local: string;
    amount: string;
    item_label: string;
    note: string;
    slip_photo_url: string;
  } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [entryCameraOpen, setEntryCameraOpen] = useState(false);
  const [entryPhotoBusy, setEntryPhotoBusy] = useState(false);

  const lightbox = useAppImageLightbox();

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime()),
    [entries],
  );
  const totalCostAmount = useMemo(
    () => sortedEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [sortedEntries],
  );

  const openManageCategories = useCallback(() => {
    setCatName("");
    setEditCat(null);
    setManageCategoriesOpen(true);
  }, []);

  const openEditCategoryForm = useCallback((c: CostCategory) => {
    setEditCat(c);
    setCatName(c.name);
  }, []);

  const cancelCategoryForm = useCallback(() => {
    setCatName("");
    setEditCat(null);
  }, []);

  const submitCategory = useCallback(async () => {
    const n = catName.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    try {
      if (editCat) await repo.updateCostCategory(editCat.id, { name: n });
      else await repo.createCostCategory(n);
      cancelCategoryForm();
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [catName, cancelCategoryForm, editCat, onRefresh, repo]);

  const removeCategory = useCallback(
    async (c: CostCategory) => {
      if (!confirm(`ลบหมวด «${c.name}» และรายการต้นทุนที่ผูกไว้ทั้งหมด?`)) return;
      setBusy(true);
      setErr(null);
      try {
        await repo.deleteCostCategory(c.id);
        await onRefresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [onRefresh, repo],
  );

  const resetAddEntryForm = useCallback(() => {
    setEntryCategoryId("");
    setEntrySpentLocal(isoToDatetimeLocalInput(new Date().toISOString()));
    setEntryAmount("");
    setEntryItemLabel("");
    setEntryNote("");
    setEntrySlipUrl("");
  }, []);

  const openAddEntry = useCallback(() => {
    resetAddEntryForm();
    setShowAddEntryModal(true);
  }, [resetAddEntryForm]);

  const finalizeSlipFile = useCallback(async (file: File, target: "add" | "edit") => {
    setEntryPhotoBusy(true);
    setErr(null);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadCarWashSessionImage(prepared);
      if (target === "add") setEntrySlipUrl(url);
      else setEditEntryForm((s) => (s ? { ...s, slip_photo_url: url } : s));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setEntryPhotoBusy(false);
    }
  }, []);

  const onSlipFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>, target: "add" | "edit") => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await finalizeSlipFile(file, target);
    },
    [finalizeSlipFile],
  );

  const onModalCameraCapture = useCallback(
    async (file: File) => {
      setEntryCameraOpen(false);
      const target = editEntry != null && editEntryForm != null ? "edit" : "add";
      await finalizeSlipFile(file, target);
    },
    [editEntry, editEntryForm, finalizeSlipFile],
  );

  const submitEntry = useCallback(async () => {
    const cid = entryCategoryId ? Number(entryCategoryId) : NaN;
    const amt = Number(entryAmount.replace(/,/g, ""));
    if (!Number.isFinite(cid) || cid < 1) {
      setErr("เลือกหมวด");
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setErr("จำนวนเงินไม่ถูกต้อง");
      return;
    }
    const item = entryItemLabel.trim();
    if (!item) {
      setErr("ระบุรายการค่าใช้จ่าย");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await repo.createCostEntry({
        category_id: cid,
        spent_at: datetimeLocalToIso(entrySpentLocal),
        amount: Math.round(amt),
        item_label: item,
        note: entryNote.trim(),
        ...(entrySlipUrl.trim() ? { slip_photo_url: entrySlipUrl.trim() } : {}),
      });
      setShowAddEntryModal(false);
      resetAddEntryForm();
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [entryAmount, entryCategoryId, entryItemLabel, entryNote, entrySlipUrl, entrySpentLocal, onRefresh, repo, resetAddEntryForm]);

  const openEditEntry = useCallback((e: CostEntry) => {
    setEditEntry(e);
    setEditEntryForm({
      category_id: String(e.category_id),
      spent_at_local: isoToDatetimeLocalInput(e.spent_at),
      amount: String(e.amount),
      item_label: e.item_label ?? "",
      note: e.note,
      slip_photo_url: e.slip_photo_url ?? "",
    });
  }, []);

  const submitEditEntry = useCallback(async () => {
    if (!editEntry || !editEntryForm) return;
    const cid = Number(editEntryForm.category_id);
    const amt = Number(editEntryForm.amount.replace(/,/g, ""));
    if (!Number.isFinite(cid) || cid < 1) return;
    if (!Number.isFinite(amt) || amt < 0) return;
    const item = editEntryForm.item_label.trim();
    if (!item) {
      setErr("ระบุรายการค่าใช้จ่าย");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await repo.updateCostEntry(editEntry.id, {
        category_id: cid,
        spent_at: datetimeLocalToIso(editEntryForm.spent_at_local),
        amount: Math.round(amt),
        item_label: item,
        note: editEntryForm.note.trim(),
        slip_photo_url: editEntryForm.slip_photo_url.trim(),
      });
      setEditEntry(null);
      setEditEntryForm(null);
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [editEntry, editEntryForm, onRefresh, repo]);

  const removeEntry = useCallback(
    async (e: CostEntry) => {
      if (!confirm("ลบรายการต้นทุนนี้?")) return;
      setBusy(true);
      setErr(null);
      try {
        await repo.deleteCostEntry(e.id);
        await onRefresh();
      } catch (er) {
        setErr(er instanceof Error ? er.message : "ลบไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [onRefresh, repo],
  );

  const addSlipPreview = entrySlipUrl.trim() ? resolveAssetUrl(entrySlipUrl, baseUrl) : null;
  const editSlipPreview =
    editEntryForm?.slip_photo_url?.trim() ? resolveAssetUrl(editEntryForm.slip_photo_url, baseUrl) : null;

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
        <div className="min-w-0 text-xs text-slate-500">
          <p className="text-sm font-semibold text-slate-900">ต้นทุน</p>
          <p className="mt-0.5 text-xs font-semibold tabular-nums text-rose-700">
            รวมทั้งสิ้น ฿{totalCostAmount.toLocaleString("en-US")}
          </p>
          {categories.length === 0 ?
            <p className="mt-1 font-medium text-amber-800">สร้างหมวดก่อนจึงจะบันทึกรายการได้</p>
          : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={openManageCategories}
            className="app-btn-primary inline-flex h-9 w-9 items-center justify-center rounded-xl p-0 text-sm font-semibold disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
            aria-label="จัดการหมวด"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="hidden sm:inline">จัดการหมวด</span>
          </button>
          <button
            type="button"
            disabled={busy || categories.length === 0}
            onClick={openAddEntry}
            className="app-btn-primary inline-flex h-9 w-9 items-center justify-center rounded-xl p-0 text-sm font-semibold disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
            aria-label="บันทึกรายการ"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">บันทึกรายการ</span>
          </button>
        </div>
      </div>

      <div>
        {sortedEntries.length === 0 ?
          <AppEmptyState>ยังไม่มีรายการต้นทุน</AppEmptyState>
        : <div className="max-h-[min(60vh,32rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white lg:border-0 lg:bg-transparent">
            <ul className="divide-y divide-slate-100 p-1 lg:grid lg:grid-cols-4 lg:gap-3 lg:divide-y-0 lg:p-2">
              {sortedEntries.map((e) => {
                const slipResolved = e.slip_photo_url?.trim() ? resolveAssetUrl(e.slip_photo_url, baseUrl) : null;
                return (
                  <li
                    key={e.id}
                    className="relative overflow-hidden flex flex-col gap-2 px-3 py-2.5 sm:px-4 lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:px-3 lg:py-3 lg:shadow-sm"
                  >
                    <span
                      aria-hidden
                      className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-[#5b61ff] via-[#8d64ff] to-[#f06dc8]"
                    />
                    <div className="flex min-w-0 items-start gap-3">
                      <AppImageThumb
                        src={slipResolved}
                        alt="สลิป"
                        onOpen={() => slipResolved && lightbox.open(slipResolved)}
                        className="h-14 w-14 rounded-lg lg:h-16 lg:w-16"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs tabular-nums text-slate-500">
                          {new Date(e.spent_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                        </p>
                        <p className="font-semibold text-slate-900">
                          {e.item_label?.trim() || "—"}
                          <span className="ml-1.5 font-normal text-slate-500">({e.category_name})</span>
                        </p>
                        <p className="text-lg font-bold tabular-nums text-rose-700">฿{e.amount.toLocaleString()}</p>
                        {e.note?.trim() ? <p className="text-xs text-slate-600">{e.note}</p> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 justify-end gap-1 border-t border-slate-100 pt-2">
                      <PopupIconButton label="แก้ไขรายการ" disabled={busy} onClick={() => openEditEntry(e)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </PopupIconButton>
                      <PopupIconButton
                        label="ลบรายการ"
                        disabled={busy}
                        className={popupIconBtnDanger}
                        onClick={() => void removeEntry(e)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </PopupIconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        }
      </div>

      <FormModal
        open={manageCategoriesOpen}
        onClose={() => {
          setManageCategoriesOpen(false);
          cancelCategoryForm();
        }}
        title="หมวดค่าใช้จ่ายต้นทุน"
        description="สร้างหรือลบหมวดหมู่สำหรับรายจ่าย"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setManageCategoriesOpen(false);
              cancelCategoryForm();
            }}
            onSubmit={() => setManageCategoriesOpen(false)}
            submitLabel="เสร็จสิ้น"
          />
        }
      >
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCategory();
            }}
            className="flex items-end gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {editCat ? "แก้ไขชื่อหมวด" : "ชื่อหมวดใหม่"}
              </label>
              <input
                className="w-full rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm font-bold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                placeholder="เช่น ค่าไฟ, ค่าน้ำ"
                value={catName}
                onChange={(ev) => setCatName(ev.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={busy || !catName.trim()}
              className="flex h-[42px] shrink-0 items-center justify-center rounded-xl bg-[#5b61ff] px-6 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-[#4d47b6] active:scale-95 disabled:opacity-50"
            >
              {editCat ? "บันทึก" : "เพิ่ม"}
            </button>
            {editCat && (
              <button
                type="button"
                className="flex h-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 hover:bg-slate-50 active:scale-95"
                onClick={cancelCategoryForm}
              >
                ยกเลิก
              </button>
            )}
          </form>

          <div className="space-y-3">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              หมวดที่มีอยู่ ({categories.length})
            </p>
            <div className="grid grid-cols-1 gap-2">
              {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 py-8 text-slate-400">
                  <svg viewBox="0 0 24 24" className="mb-2 h-8 w-8 opacity-20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3h18v18H3zM9 9h6M9 13h6M9 17h3" />
                  </svg>
                  <p className="text-xs font-medium">ยังไม่มีหมวดหมู่</p>
                </div>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[#5b61ff]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#5b61ff]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <span className="truncate text-sm font-black text-[#1e1b4b]">{c.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-indigo-50 hover:text-[#5b61ff]"
                        onClick={() => openEditCategoryForm(c)}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => void removeCategory(c)}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={showAddEntryModal}
        onClose={() => {
          setEntryCameraOpen(false);
          setShowAddEntryModal(false);
          resetAddEntryForm();
        }}
        title="บันทึกรายการค่าใช้จ่าย"
        description="กรอกข้อมูลรายจ่ายและเลือกหมวดหมู่ — รูปภาพสลิปจะถูกอัปโหลดทันที"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setEntryCameraOpen(false);
              setShowAddEntryModal(false);
              resetAddEntryForm();
            }}
            submitLabel="บันทึกรายการ"
            loading={busy}
            onSubmit={() => void submitEntry()}
          />
        }
      >
        <div className="space-y-6">
          <CostSlipAttachmentZone
            slipUrl={entrySlipUrl}
            onSlipUrlChange={setEntrySlipUrl}
            photoBusy={entryPhotoBusy}
            previewUrl={addSlipPreview}
            galleryInputRef={galleryInputRef}
            onFileInputChange={(ev) => void onSlipFileChange(ev, "add")}
            onOpenModalCamera={() => setEntryCameraOpen(true)}
            cameraOpen={entryCameraOpen}
            onCloseCamera={() => setEntryCameraOpen(false)}
            onCameraCapture={(file) => void onModalCameraCapture(file)}
            onRequestLegacyPicker={() => {
              setEntryCameraOpen(false);
              requestAnimationFrame(() => galleryInputRef.current?.click());
            }}
            disabled={busy}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หมวดหมู่</label>
              <select
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-[#5b61ff]"
                value={entryCategoryId}
                onChange={(ev) => setEntryCategoryId(ev.target.value)}
              >
                <option value="">เลือกหมวด…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">วันที่และเวลา</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-[#5b61ff]"
                value={entrySpentLocal}
                onChange={(ev) => setEntrySpentLocal(ev.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">รายการ / ชื่อค่าใช้จ่าย</label>
              <input
                className="w-full rounded-xl border-slate-200 bg-white text-sm font-semibold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                placeholder="เช่น น้ำยาล้างรถ 5 ลิตร, ค่าไฟเดือนมีนา…"
                value={entryItemLabel}
                onChange={(ev) => setEntryItemLabel(ev.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">จำนวนเงิน (บาท)</label>
              <div className="relative">
                {!entryAmount && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-500">฿</span>
                )}
                <input
                  type="text"
                  inputMode="decimal"
                  className={cn(
                    "w-full rounded-xl border-slate-200 bg-white pr-4 py-2.5 text-lg font-black tabular-nums text-rose-600 focus:ring-rose-500 transition-all",
                    entryAmount ? "pl-4" : "pl-10"
                  )}
                  placeholder="0.00"
                  value={entryAmount}
                  onChange={(ev) => setEntryAmount(ev.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หมายเหตุ</label>
            <textarea
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium placeholder:text-slate-300 focus:ring-[#5b61ff]"
              rows={2}
              placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)…"
              value={entryNote}
              onChange={(ev) => setEntryNote(ev.target.value)}
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        open={editEntry != null && editEntryForm != null}
        onClose={() => {
          setEntryCameraOpen(false);
          setEditEntry(null);
          setEditEntryForm(null);
        }}
        title={editEntry ? `แก้ไขรายการต้นทุน #${editEntry.id}` : "แก้ไข"}
        description="อัปเดตข้อมูลรายจ่าย"
        size="md"
        footer={
          editEntryForm ? (
            <FormModalFooterActions
              onCancel={() => {
                setEntryCameraOpen(false);
                setEditEntry(null);
                setEditEntryForm(null);
              }}
              submitLabel="บันทึกการแก้ไข"
              loading={busy}
              onSubmit={() => void submitEditEntry()}
            />
          ) : null
        }
      >
        {editEntry && editEntryForm ? (
          <div className="space-y-6">
            <CostSlipAttachmentZone
              slipUrl={editEntryForm.slip_photo_url}
              onSlipUrlChange={(url) => setEditEntryForm((s) => (s ? { ...s, slip_photo_url: url } : s))}
              photoBusy={entryPhotoBusy}
              previewUrl={editSlipPreview}
              galleryInputRef={galleryInputRef}
              onFileInputChange={(ev) => void onSlipFileChange(ev, "edit")}
              onOpenModalCamera={() => setEntryCameraOpen(true)}
              cameraOpen={entryCameraOpen}
              onCloseCamera={() => setEntryCameraOpen(false)}
              onCameraCapture={(file) => void onModalCameraCapture(file)}
              onRequestLegacyPicker={() => {
                setEntryCameraOpen(false);
                requestAnimationFrame(() => galleryInputRef.current?.click());
              }}
              disabled={busy}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หมวดหมู่</label>
                <select
                  className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-[#5b61ff]"
                  value={editEntryForm.category_id}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, category_id: ev.target.value } : s))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">วันที่และเวลา</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-semibold focus:ring-[#5b61ff]"
                  value={editEntryForm.spent_at_local}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, spent_at_local: ev.target.value } : s))}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">รายการ / ชื่อค่าใช้จ่าย</label>
                <input
                  className="w-full rounded-xl border-slate-200 bg-white text-sm font-semibold placeholder:text-slate-300 focus:ring-[#5b61ff]"
                  placeholder="เช่น น้ำยาล้างรถ 5 ลิตร…"
                  value={editEntryForm.item_label}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, item_label: ev.target.value } : s))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">จำนวนเงิน (บาท)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-500">฿</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-xl border-slate-200 bg-white pl-10 pr-4 py-2.5 text-lg font-black tabular-nums text-rose-600 focus:ring-rose-500"
                    placeholder="0.00"
                    value={editEntryForm.amount}
                    onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, amount: ev.target.value } : s))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หมายเหตุ</label>
              <textarea
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium placeholder:text-slate-300 focus:ring-[#5b61ff]"
                rows={2}
                placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)…"
                value={editEntryForm.note}
                onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, note: ev.target.value } : s))}
              />
            </div>
          </div>
        ) : null}
      </FormModal>

      <AppImageLightbox src={lightbox.src} alt="สลิปต้นทุน" onClose={lightbox.close} />
    </div>
  );
}
