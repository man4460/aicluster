"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  encodeHomeFinancePublicAssetHref,
  isHomeFinancePdfUrl,
} from "@/lib/home-finance/attachments";
import {
  homeFinanceUploadErrorMessage,
  uploadHomeFinanceFileUrl,
} from "@/lib/home-finance/upload-client";
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
import {
  homeFinanceCardIconTileClass,
  homeFinanceDocumentCardTone,
} from "@/systems/home-finance/lib/card-tones";

const inputClz =
  "box-border h-9 min-h-9 w-full rounded-lg border border-slate-200/90 bg-white px-3 text-sm font-semibold text-[#1e1b4b] outline-none transition placeholder:text-slate-400 focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/15";

type PersonalDocument = {
  id: number;
  title: string;
  category: string | null;
  fileUrl: string;
  mimeType: string | null;
  note: string | null;
  createdAt: string;
};

function IconDocFile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.15} aria-hidden>
      <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 13h6M10 17h4" strokeLinecap="round" />
    </svg>
  );
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
  const notice = useAppNoticePopup();
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
      const url = await uploadHomeFinanceFileUrl(file, { kind: "attach" });
      setForm((s) => ({
        ...s,
        fileUrl: url,
        // ชื่อเอกสารให้ผู้ใช้ตั้งเอง — ไม่ดึงจากชื่อไฟล์ OS
      }));
    } catch (err) {
      setError(homeFinanceUploadErrorMessage(err, "อัปโหลดไม่สำเร็จ"));
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
    const ok = await notice.confirm("ลบเอกสารนี้?");
    if (!ok) return;
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
      {notice.popup}
      <HomeFinanceSectionHeader
        title="เอกสารส่วนตัว"
        description="เก็บบัตรประชาชน สัญญา ใบรับรอง และไฟล์สำคัญ — แยกจากสลิปรายรับ–รายจ่าย"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <HomeFinancePrimaryButton type="button" onClick={openCreate} aria-label="เพิ่มเอกสาร">
            <span className="sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มเอกสาร</span>
          </HomeFinancePrimaryButton>
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
              const tone = homeFinanceDocumentCardTone(pdf);
              return (
                <li key={doc.id}>
                  <HomeFinanceEntityRow tone={tone}>
                    <HomeFinanceEntityMain className="items-start gap-3">
                      {pdf ? (
                        <a
                          href={abs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(homeFinanceCardIconTileClass(tone, "lg"), "flex-col gap-0.5 text-[10px] font-bold")}
                          title="เปิด PDF"
                        >
                          <IconDocFile className="h-5 w-5" />
                          PDF
                        </a>
                      ) : (
                        <AppImageThumb
                          src={abs}
                          alt={doc.title}
                          objectFit="contain"
                          onOpen={() => lightbox.open(abs)}
                          className="h-14 w-14 sm:h-16 sm:w-16"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1e1b4b]">{doc.title}</p>
                        {doc.category ? (
                          <p className="mt-0.5 text-xs font-medium text-[#66638c]">{doc.category}</p>
                        ) : null}
                        {doc.note ? <p className="mt-1 line-clamp-2 text-xs text-[#66638c]">{doc.note}</p> : null}
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
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
                          objectFit="contain"
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
