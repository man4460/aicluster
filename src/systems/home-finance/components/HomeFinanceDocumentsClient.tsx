"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  prepareUploadFile,
  useAppImageLightbox,
} from "@/components/app-templates";
import {
  encodeHomeFinancePublicAssetHref,
  isHomeFinancePdfUrl,
} from "@/lib/home-finance/attachments";
import {
  HomeFinanceEmptyState,
  HomeFinanceEntityActions,
  HomeFinanceEntityMain,
  HomeFinanceEntityRow,
  HomeFinanceList,
  HomeFinanceListHeading,
  HomeFinanceModalActionBar,
  HomeFinanceModalBackdrop,
  HomeFinanceModalPanel,
  HomeFinancePageSection,
  HomeFinancePrimaryButton,
  HomeFinanceRowActionIconButton,
  HomeFinanceRowIconEdit,
  HomeFinanceRowIconTrash,
  HomeFinanceSecondaryButton,
  HomeFinanceSectionHeader,
} from "@/systems/home-finance/components/HomeFinanceUi";

const inputClz =
  "min-h-[46px] w-full rounded-2xl border border-white/70 bg-white/78 px-3.5 py-2.5 text-sm text-[#28254a] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-[#9a98b5] focus:border-[#5a57d8]/45 focus:bg-white focus:ring-2 focus:ring-[#5a57d8]/15";

type PersonalDocument = {
  id: number;
  title: string;
  category: string | null;
  fileUrl: string;
  mimeType: string | null;
  note: string | null;
  createdAt: string;
};

const HOME_FINANCE_UPLOAD_MS = 120_000;

async function uploadHomeFinanceFile(file: File): Promise<string | null> {
  const toSend = await prepareUploadFile(file, { accept: "image-or-pdf", maxPdfBytes: 5 * 1024 * 1024 });
  const fd = new FormData();
  fd.set("file", toSend);
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), HOME_FINANCE_UPLOAD_MS);
  try {
    const res = await fetch("/api/home-finance/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
      signal: ctrl.signal,
    });
    const j = (await res.json().catch(() => ({}))) as { imageUrl?: string };
    if (!res.ok) return null;
    return j.imageUrl ?? null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(tid);
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-[#66638c]">{label}</span>
      {children}
    </label>
  );
}

export function HomeFinanceDocumentsClient() {
  const lightbox = useAppImageLightbox();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PersonalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", category: "", note: "", fileUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/home-finance/documents", { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { items?: PersonalDocument[]; error?: string };
      if (!res.ok) {
        setError(j.error ?? "โหลดเอกสารไม่สำเร็จ");
        return;
      }
      setItems(j.items ?? []);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setForm({ title: "", category: "", note: "", fileUrl: "" });
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (doc: PersonalDocument) => {
    setEditId(doc.id);
    setForm({
      title: doc.title,
      category: doc.category ?? "",
      note: doc.note ?? "",
      fileUrl: doc.fileUrl,
    });
    setError(null);
    setModalOpen(true);
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadHomeFinanceFile(file);
      if (!url) {
        setError("อัปโหลดไม่สำเร็จ — ใช้ JPG/PNG/WebP/GIF/PDF ตามขนาดที่กำหนด");
        return;
      }
      setForm((s) => ({
        ...s,
        fileUrl: url,
        // ชื่อเอกสารให้ผู้ใช้ตั้งเอง — ไม่ดึงจากชื่อไฟล์ OS
      }));
    } finally {
      setUploading(false);
    }
  };

  const submitForm = async () => {
    if (!form.title.trim()) {
      setError("กรุณากรอกชื่อเอกสาร");
      return;
    }
    if (!form.fileUrl.trim()) {
      setError("กรุณาแนบไฟล์");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        category: form.category.trim() || null,
        note: form.note.trim() || null,
        fileUrl: form.fileUrl,
      };
      const res = await fetch(
        editId != null ? `/api/home-finance/documents/${editId}` : "/api/home-finance/documents",
        {
          method: editId != null ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      resetForm();
      await loadItems();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const removeDoc = async (id: number) => {
    if (!window.confirm("ลบเอกสารนี้?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/home-finance/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "ลบไม่สำเร็จ");
        return;
      }
      await loadItems();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    }
  };

  return (
    <HomeFinancePageSection>
      <HomeFinanceSectionHeader
        title="เอกสารส่วนตัว"
        description="เก็บบัตรประชาชน สัญญา ใบรับรอง และไฟล์สำคัญ — แยกจากสลิปรายรับ–รายจ่าย"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            onClick={openCreate}
            aria-label="เพิ่มเอกสาร"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[#0000BF] px-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a6] sm:min-w-0 sm:px-4"
          >
            <span className="text-lg leading-none sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มเอกสาร</span>
          </button>
        }
      />

      {error && !modalOpen ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}

      <div>
        <HomeFinanceListHeading>รายการเอกสาร ({items.length})</HomeFinanceListHeading>
        {loading ? (
          <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <HomeFinanceEmptyState>ยังไม่มีเอกสาร — กด «+ เพิ่มเอกสาร»</HomeFinanceEmptyState>
        ) : (
          <HomeFinanceList as="ul" listRole="รายการเอกสารส่วนตัว">
            {items.map((doc) => {
              const abs = encodeHomeFinancePublicAssetHref(doc.fileUrl);
              const pdf = isHomeFinancePdfUrl(doc.fileUrl);
              return (
                <li key={doc.id}>
                  <HomeFinanceEntityRow>
                    <HomeFinanceEntityMain className="items-start gap-3">
                      {pdf ? (
                        <a
                          href={abs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-bold text-red-800 ring-2 ring-red-200/80"
                        >
                          PDF
                        </a>
                      ) : (
                        <AppImageThumb
                          src={abs}
                          alt={doc.title}
                          onOpen={() => lightbox.open(abs)}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                        {doc.category ? (
                          <p className="mt-0.5 text-xs text-[#4d47b6]">{doc.category}</p>
                        ) : null}
                        {doc.note ? <p className="mt-1 text-xs text-slate-600">{doc.note}</p> : null}
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </HomeFinanceEntityMain>
                    <HomeFinanceEntityActions>
                      <HomeFinanceRowActionIconButton
                        variant="primary"
                        title="แก้ไข"
                        aria-label={`แก้ไข ${doc.title}`}
                        onClick={() => openEdit(doc)}
                      >
                        <HomeFinanceRowIconEdit />
                      </HomeFinanceRowActionIconButton>
                      <HomeFinanceRowActionIconButton
                        variant="danger"
                        title="ลบ"
                        aria-label={`ลบ ${doc.title}`}
                        onClick={() => void removeDoc(doc.id)}
                      >
                        <HomeFinanceRowIconTrash />
                      </HomeFinanceRowActionIconButton>
                    </HomeFinanceEntityActions>
                  </HomeFinanceEntityRow>
                </li>
              );
            })}
          </HomeFinanceList>
        )}
      </div>

      {modalOpen ? (
        <HomeFinanceModalBackdrop onBackdropClick={() => setModalOpen(false)}>
          <HomeFinanceModalPanel
            title={editId == null ? "เพิ่มเอกสาร" : "แก้ไขเอกสาร"}
            titleId="hf-doc-form-title"
            onClose={() => setModalOpen(false)}
            error={error}
            maxWidthClassName="max-w-lg"
          >
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submitForm();
              }}
            >
              <Field label="ชื่อเอกสาร">
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น บัตรประชาชน / สัญญาเช่า"
                  maxLength={160}
                  required
                />
              </Field>
              <Field label="หมวด (ไม่บังคับ)">
                <input
                  value={form.category}
                  onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  className={inputClz}
                  placeholder="เช่น เอกสารราชการ / สัญญา"
                  maxLength={80}
                />
              </Field>
              <Field label="ไฟล์เอกสาร">
                <div className="rounded-2xl border border-dashed border-[#0000BF]/30 bg-[#f4f4ff]/60 p-4">
                  {form.fileUrl ? (
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      {!isHomeFinancePdfUrl(form.fileUrl) ? (
                        <AppImageThumb
                          src={encodeHomeFinancePublicAssetHref(form.fileUrl)}
                          onOpen={() =>
                            lightbox.open(encodeHomeFinancePublicAssetHref(form.fileUrl))
                          }
                        />
                      ) : (
                        <span className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-800 ring-1 ring-red-200">
                          PDF แนบแล้ว
                        </span>
                      )}
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 hover:underline"
                        onClick={() => setForm((s) => ({ ...s, fileUrl: "" }))}
                      >
                        ลบไฟล์
                      </button>
                    </div>
                  ) : (
                    <p className="mb-3 text-xs text-slate-600">เลือกจากแกลเลอรี ถ่ายรูป หรือแนบ PDF</p>
                  )}
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onPickFile}
                  />
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onPickFile}
                  />
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={onPickFile}
                  />
                  <div className="flex flex-wrap gap-2">
                    <AppImagePickCameraButtons
                      className="justify-start"
                      busy={uploading}
                      disabled={saving}
                      onPickGallery={() => galleryRef.current?.click()}
                      onPickCamera={() => cameraRef.current?.click()}
                      labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
                    />
                    <button
                      type="button"
                      disabled={uploading || saving}
                      onClick={() => pdfRef.current?.click()}
                      className="inline-flex min-h-[40px] items-center rounded-xl border border-[#0000BF]/30 bg-white px-3 text-xs font-semibold text-[#1e1b4b] shadow-sm hover:bg-[#ecebff] disabled:opacity-60"
                    >
                      {uploading ? "กำลังอัปโหลด…" : "แนบ PDF"}
                    </button>
                  </div>
                </div>
              </Field>
              <Field label="หมายเหตุ">
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                  rows={2}
                  className={inputClz}
                  maxLength={600}
                />
              </Field>
              <HomeFinanceModalActionBar>
                <HomeFinanceSecondaryButton type="button" onClick={() => setModalOpen(false)}>
                  ยกเลิก
                </HomeFinanceSecondaryButton>
                <HomeFinancePrimaryButton type="submit" disabled={saving || uploading}>
                  {saving ? "กำลังบันทึก…" : editId == null ? "บันทึก" : "บันทึกการแก้ไข"}
                </HomeFinancePrimaryButton>
              </HomeFinanceModalActionBar>
            </form>
          </HomeFinanceModalPanel>
        </HomeFinanceModalBackdrop>
      ) : null}

      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} />
    </HomeFinancePageSection>
  );
}
