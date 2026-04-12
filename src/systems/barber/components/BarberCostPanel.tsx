"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppDashboardSection,
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
import {
  bangkokDatetimeLocalToIso,
  isoToBangkokDatetimeLocal,
} from "@/lib/barber/booking-datetime";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import { PopupIconButton, popupIconBtnDanger } from "@/systems/car-wash/car-wash-popup-icon-buttons";
import {
  createBarberCostCategory,
  createBarberCostEntry,
  deleteBarberCostCategory,
  deleteBarberCostEntry,
  updateBarberCostCategory,
  updateBarberCostEntry,
  uploadBarberCostSlip,
  type BarberCostCategory,
  type BarberCostEntry,
} from "@/systems/barber/barber-cost-client";
import type { ModuleCostPanelOps } from "@/systems/barber/module-cost-panel-ops";

const defaultBarberCostPanelOps: ModuleCostPanelOps = {
  createCategory: createBarberCostCategory,
  updateCategory: updateBarberCostCategory,
  deleteCategory: deleteBarberCostCategory,
  createEntry: createBarberCostEntry,
  updateEntry: updateBarberCostEntry,
  deleteEntry: deleteBarberCostEntry,
  uploadSlip: uploadBarberCostSlip,
};

export type BarberCostToolbarApi = {
  openRecordExpense: () => void;
  openManageCategories: () => void;
};

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
          <p className="mt-0.5 text-xs text-slate-600">อัปโหลดหรือถ่ายรูป</p>
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

export function BarberCostPanel({
  baseUrl,
  categories,
  entries,
  onRefresh,
  listLoading,
  fetchError,
  onToolbarReady,
  costPanelOps,
  formAriaIdPrefix = "barber-cost",
}: {
  baseUrl: string;
  categories: BarberCostCategory[];
  entries: BarberCostEntry[];
  onRefresh: () => Promise<void>;
  /** โหลดรายการจาก API ครั้งแรก / รีเฟรช */
  listLoading?: boolean;
  /** ข้อความเมื่อดึงหมวด/รายการจาก API ไม่สำเร็จ */
  fetchError?: string | null;
  /** ให้ parent แสดงปุ่มในหัวข้อหน้า (เช่น PageHeader) */
  onToolbarReady?: (api: BarberCostToolbarApi | null) => void;
  /** หอพัก: ส่ง API client จาก dorm-cost-client */
  costPanelOps?: ModuleCostPanelOps;
  /** prefix id สำหรับ aria (กันซ้ำเมื่อมีหลายแผงในหน้า) */
  formAriaIdPrefix?: string;
}) {
  const ops = costPanelOps ?? defaultBarberCostPanelOps;
  const recordExpenseHeadingId = `${formAriaIdPrefix}-record-expense-details-heading`;
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [editCat, setEditCat] = useState<BarberCostCategory | null>(null);

  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [entryCategoryId, setEntryCategoryId] = useState("");
  const [entrySpentLocal, setEntrySpentLocal] = useState(() => isoToBangkokDatetimeLocal(new Date().toISOString()));
  const [entryAmount, setEntryAmount] = useState("");
  const [entryItemLabel, setEntryItemLabel] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [entrySlipUrl, setEntrySlipUrl] = useState("");

  const [editEntry, setEditEntry] = useState<BarberCostEntry | null>(null);
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

  const openManageCategories = useCallback(() => {
    setShowRecordExpenseModal(false);
    setEntryCameraOpen(false);
    setCatName("");
    setEditCat(null);
    setManageCategoriesOpen(true);
  }, []);

  const openEditCategoryForm = useCallback((c: BarberCostCategory) => {
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
      if (editCat) await ops.updateCategory(editCat.id, n);
      else await ops.createCategory(n);
      cancelCategoryForm();
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [catName, cancelCategoryForm, editCat, onRefresh, ops]);

  const removeCategory = useCallback(
    async (c: BarberCostCategory) => {
      if (!confirm(`ลบหมวด «${c.name}» และรายการต้นทุนที่ผูกไว้ทั้งหมด?`)) return;
      setBusy(true);
      setErr(null);
      try {
        await ops.deleteCategory(c.id);
        await onRefresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [onRefresh, ops],
  );

  const resetAddEntryForm = useCallback(() => {
    setEntryCategoryId("");
    setEntrySpentLocal(isoToBangkokDatetimeLocal(new Date().toISOString()));
    setEntryAmount("");
    setEntryItemLabel("");
    setEntryNote("");
    setEntrySlipUrl("");
  }, []);

  const openRecordExpense = useCallback(() => {
    setManageCategoriesOpen(false);
    cancelCategoryForm();
    resetAddEntryForm();
    setEntryCameraOpen(false);
    setShowRecordExpenseModal(true);
  }, [cancelCategoryForm, resetAddEntryForm]);

  useEffect(() => {
    if (!onToolbarReady) return;
    const api: BarberCostToolbarApi = { openRecordExpense, openManageCategories };
    onToolbarReady(api);
    return () => onToolbarReady(null);
  }, [onToolbarReady, openRecordExpense, openManageCategories]);

  const finalizeSlipFile = useCallback(async (file: File, target: "record" | "edit") => {
    setEntryPhotoBusy(true);
    setErr(null);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await ops.uploadSlip(prepared);
      if (target === "record") setEntrySlipUrl(url);
      else setEditEntryForm((s) => (s ? { ...s, slip_photo_url: url } : s));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setEntryPhotoBusy(false);
    }
  }, [ops]);

  const onSlipFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>, target: "record" | "edit") => {
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
      const target = editEntry != null && editEntryForm != null ? "edit" : "record";
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
      await ops.createEntry({
        category_id: cid,
        spent_at: bangkokDatetimeLocalToIso(entrySpentLocal),
        amount: Math.round(amt),
        item_label: item,
        note: entryNote.trim(),
        ...(entrySlipUrl.trim() ? { slip_photo_url: entrySlipUrl.trim() } : {}),
      });
      setShowRecordExpenseModal(false);
      cancelCategoryForm();
      resetAddEntryForm();
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [
    cancelCategoryForm,
    entryAmount,
    entryCategoryId,
    entryItemLabel,
    entryNote,
    entrySlipUrl,
    entrySpentLocal,
    onRefresh,
    resetAddEntryForm,
    ops,
  ]);

  const openEditEntry = useCallback((e: BarberCostEntry) => {
    setEditEntry(e);
    setEditEntryForm({
      category_id: String(e.category_id),
      spent_at_local: isoToBangkokDatetimeLocal(e.spent_at),
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
      await ops.updateEntry(editEntry.id, {
        category_id: cid,
        spent_at: bangkokDatetimeLocalToIso(editEntryForm.spent_at_local),
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
  }, [editEntry, editEntryForm, onRefresh, ops]);

  const removeEntry = useCallback(
    async (e: BarberCostEntry) => {
      if (!confirm("ลบรายการต้นทุนนี้?")) return;
      setBusy(true);
      setErr(null);
      try {
        await ops.deleteEntry(e.id);
        await onRefresh();
      } catch (er) {
        setErr(er instanceof Error ? er.message : "ลบไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [onRefresh, ops],
  );

  const addSlipPreview = entrySlipUrl.trim() ? resolveAssetUrl(entrySlipUrl, baseUrl) : null;
  const editSlipPreview =
    editEntryForm?.slip_photo_url?.trim() ? resolveAssetUrl(editEntryForm.slip_photo_url, baseUrl) : null;

  const categoryManagerSection = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
        <label className="min-w-0 flex-1 text-xs font-medium text-slate-600">
          {editCat ? "ชื่อหมวด" : "ชื่อหมวดใหม่"}
          <input
            className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
            value={catName}
            onChange={(ev) => setCatName(ev.target.value)}
            placeholder="เช่น ค่าสีย้อม ค่าไฟ อุปกรณ์"
          />
        </label>
        <div className="flex shrink-0 flex-wrap gap-2">
          {editCat ?
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitCategory()}
                className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                บันทึก
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={cancelCategoryForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            </>
          : <button
              type="button"
              disabled={busy || !catName.trim()}
              onClick={() => void submitCategory()}
              className="app-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              เพิ่มหมวด
            </button>
          }
        </div>
      </div>

      {categories.length === 0 ?
        <AppEmptyState>ยังไม่มีหมวด — กด «เพิ่มหมวด» ด้านบน</AppEmptyState>
      : <ul className="max-h-[min(40vh,14rem)] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
              <span className="min-w-0 truncate font-medium text-slate-900">{c.name}</span>
              <div className="flex shrink-0 items-center gap-1">
                <PopupIconButton
                  label="แก้ไขหมวด"
                  disabled={busy || editCat != null}
                  onClick={() => openEditCategoryForm(c)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </PopupIconButton>
                <PopupIconButton
                  label="ลบหมวด"
                  disabled={busy || editCat != null}
                  className={popupIconBtnDanger}
                  onClick={() => void removeCategory(c)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </PopupIconButton>
              </div>
            </li>
          ))}
        </ul>
      }
    </div>
  );

  return (
    <div className="space-y-6">
      {fetchError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          โหลดข้อมูลไม่สำเร็จ: {fetchError}
        </p>
      ) : null}
      {err && err.trim() !== fetchError?.trim() ? <p className="text-sm text-red-600">{err}</p> : null}

      <AppDashboardSection tone="slate">
        <AppSectionHeader tone="slate" title="รายการต้นทุนทั้งหมด" description={`${entries.length} รายการ`} />
        {listLoading ?
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
            กำลังโหลดรายการ…
          </p>
        : sortedEntries.length === 0 ?
          <AppEmptyState>ยังไม่มีรายการต้นทุน</AppEmptyState>
        : <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {sortedEntries.map((e) => {
                const slipResolved = e.slip_photo_url?.trim() ? resolveAssetUrl(e.slip_photo_url, baseUrl) : null;
                return (
                  <li
                    key={e.id}
                    className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      {slipResolved ?
                        <AppImageThumb
                          src={slipResolved}
                          alt="สลิป"
                          onOpen={() => lightbox.open(slipResolved)}
                          className="h-14 w-14 rounded-lg"
                        />
                      : null}
                      <div className="min-w-0">
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
                    <div className="flex shrink-0 gap-1">
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
      </AppDashboardSection>

      <FormModal
        open={manageCategoriesOpen}
        onClose={() => {
          setManageCategoriesOpen(false);
          cancelCategoryForm();
        }}
        title="หมวดต้นทุน"
        size="lg"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setManageCategoriesOpen(false);
                cancelCategoryForm();
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ปิด
            </button>
          </div>
        }
      >
        {categoryManagerSection}
      </FormModal>

      <FormModal
        open={showRecordExpenseModal}
        onClose={() => {
          setEntryCameraOpen(false);
          setShowRecordExpenseModal(false);
          cancelCategoryForm();
          resetAddEntryForm();
        }}
        title="บันทึกรายจ่าย"
        ariaDescribedBy={recordExpenseHeadingId}
        size="lg"
        footer={
          <FormModalFooterActions
            cancelLabel="ปิด"
            onCancel={() => {
              setEntryCameraOpen(false);
              setShowRecordExpenseModal(false);
              cancelCategoryForm();
              resetAddEntryForm();
            }}
            submitLabel="บันทึกรายจ่าย"
            submitDisabled={categories.length === 0}
            loading={busy}
            onSubmit={() => void submitEntry()}
          />
        }
      >
        <div className="space-y-4">
          <AppSectionHeader
            tone="slate"
            title="รายละเอียดรายจ่าย"
            titleId={recordExpenseHeadingId}
          />
          <div
            className="space-y-4"
            role="group"
            aria-labelledby={recordExpenseHeadingId}
          >
            <CostSlipAttachmentZone
              slipUrl={entrySlipUrl}
              onSlipUrlChange={setEntrySlipUrl}
              photoBusy={entryPhotoBusy}
              previewUrl={addSlipPreview}
              galleryInputRef={galleryInputRef}
              onFileInputChange={(ev) => void onSlipFileChange(ev, "record")}
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

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                รายการค่าใช้จ่าย
                <input
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น สีย้อม ค่าไฟเดือนมีนา…"
                  value={entryItemLabel}
                  onChange={(ev) => setEntryItemLabel(ev.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                หมวด
                <select
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  value={entryCategoryId}
                  onChange={(ev) => setEntryCategoryId(ev.target.value)}
                  disabled={categories.length === 0}
                >
                  <option value="">— เลือก —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                วันที่ / เวลาจ่าย
                <span className="mt-0.5 block text-[11px] font-normal text-slate-500">ตามเวลาไทย (Asia/Bangkok)</span>
                <input
                  type="datetime-local"
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  value={entrySpentLocal}
                  onChange={(ev) => setEntrySpentLocal(ev.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                จำนวนเงิน (บาท)
                <input
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  inputMode="decimal"
                  placeholder="0"
                  value={entryAmount}
                  onChange={(ev) => setEntryAmount(ev.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                หมายเหตุ
                <input
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น บิลเลขที่…"
                  value={entryNote}
                  onChange={(ev) => setEntryNote(ev.target.value)}
                />
              </label>
            </div>
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
        title={editEntry ? `แก้ไขรายการ #${editEntry.id}` : "แก้ไข"}
        size="lg"
        footer={
          editEntryForm ?
            <FormModalFooterActions
              cancelLabel="ปิด"
              onCancel={() => {
                setEntryCameraOpen(false);
                setEditEntry(null);
                setEditEntryForm(null);
              }}
              submitLabel="บันทึก"
              loading={busy}
              onSubmit={() => void submitEditEntry()}
            />
          : null
        }
      >
        {editEntry && editEntryForm ?
          <div className="space-y-4">
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
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                รายการค่าใช้จ่าย
                <input
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น สีย้อม อุปกรณ์…"
                  value={editEntryForm.item_label}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, item_label: ev.target.value } : s))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                หมวด
                <select
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  value={editEntryForm.category_id}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, category_id: ev.target.value } : s))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                วันที่ / เวลา
                <span className="mt-0.5 block text-[11px] font-normal text-slate-500">ตามเวลาไทย (Asia/Bangkok)</span>
                <input
                  type="datetime-local"
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  value={editEntryForm.spent_at_local}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, spent_at_local: ev.target.value } : s))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                จำนวนเงิน (บาท)
                <input
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  value={editEntryForm.amount}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, amount: ev.target.value } : s))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                หมายเหตุ
                <input
                  className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                  value={editEntryForm.note}
                  onChange={(ev) => setEditEntryForm((s) => (s ? { ...s, note: ev.target.value } : s))}
                />
              </label>
            </div>
          </div>
        : null}
      </FormModal>

      <AppImageLightbox src={lightbox.src} alt="สลิปต้นทุน" onClose={lightbox.close} />
    </div>
  );
}
