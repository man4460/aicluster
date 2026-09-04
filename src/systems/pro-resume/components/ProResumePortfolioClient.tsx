"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppGalleryCameraFileInputs,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ProResumePagePanel } from "@/systems/pro-resume/components/ProResumePagePanel";
import { proResumeCardIconTileClass, proResumeTonedRowCardClass } from "@/systems/pro-resume/lib/card-tones";
import type {
  ResumePortfolioCategoryDto,
  ResumePortfolioItemDto,
} from "@/systems/pro-resume/lib/mappers";
import { proResumePageTitleIcon, proResumePageTitleTone, proResumeSectionIcon } from "@/systems/pro-resume/lib/page-menu-icons";
import {
  proResumeFieldClass,
  proResumeFilterChipClass,
  proResumeFilterChipShellClass,
  proResumePrimaryButtonClass,
  proResumeRowIconButtonClass,
  proResumeTextareaClass,
} from "@/systems/pro-resume/lib/ui-tokens";

const UPLOAD = "/api/pro-resume/session/upload";
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

export function ProResumePortfolioClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [categories, setCategories] = useState<ResumePortfolioCategoryDto[]>([]);
  const [items, setItems] = useState<ResumePortfolioItemDto[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [catModal, setCatModal] = useState<ResumePortfolioCategoryDto | "new" | null>(null);
  const [itemModal, setItemModal] = useState<ResumePortfolioItemDto | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        fetch("/api/pro-resume/session/categories"),
        fetch("/api/pro-resume/session/portfolio"),
      ]);
      const cData = (await cRes.json()) as { categories?: ResumePortfolioCategoryDto[] };
      const iData = (await iRes.json()) as { items?: ResumePortfolioItemDto[] };
      setCategories(cData.categories ?? []);
      setItems(iData.items ?? []);
    } catch {
      notice.error("โหลดไม่สำเร็จ");
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    if (filterCat === "all") return items;
    return items.filter((i) => i.categoryId === filterCat);
  }, [items, filterCat]);

  const deleteCat = async (id: string, name: string) => {
    const ok = await notice.confirm(`ลบหมวด «${name}» และผลงานในหมวดนี้ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/pro-resume/session/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await load();
  };

  const deleteItem = async (id: string, title: string) => {
    const ok = await notice.confirm(`ลบผลงาน «${title}» ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/pro-resume/session/portfolio/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await load();
  };

  const reorderCats = async (list: ResumePortfolioCategoryDto[], index: number, dir: -1 | 1) => {
    const next = [...list];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    const res = await fetch("/api/pro-resume/session/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
    });
    if (!res.ok) notice.error("จัดลำดับไม่สำเร็จ");
    else await load();
  };

  return (
    <>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปผลงาน" />

      <ProResumePagePanel
        title="ผลงาน / พอร์ตโฟลิโอ"
        titleIcon={proResumePageTitleIcon("portfolio")}
        titleTone={proResumePageTitleTone("portfolio")}
        action={
          <div className="flex shrink-0 gap-1.5">
            <button type="button" className={proResumePrimaryButtonClass} onClick={() => setCatModal("new")} aria-label="เพิ่มหมวด">
              + หมวด
            </button>
            <button type="button" className={proResumePrimaryButtonClass} onClick={() => setItemModal("new")} aria-label="เพิ่มผลงาน">
              + ผลงาน
            </button>
          </div>
        }
      >
        <div className="space-y-2 border-b border-slate-200/80 pb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#1e1b4b]">
            <span className={proResumeCardIconTileClass("violet", "md")} aria-hidden>
              {proResumeSectionIcon("portfolio")}
            </span>
            หมวดหมู่
          </h3>
          {categories.length ? (
            <ul className="space-y-2">
              {categories.map((cat, i) => (
                <li key={cat.id} className={proResumeTonedRowCardClass("violet")}>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button type="button" className={proResumeRowIconButtonClass} disabled={i === 0} aria-label="เลื่อนขึ้น" onClick={() => void reorderCats(categories, i, -1)}>↑</button>
                      <button type="button" className={proResumeRowIconButtonClass} disabled={i >= categories.length - 1} aria-label="เลื่อนลง" onClick={() => void reorderCats(categories, i, 1)}>↓</button>
                    </div>
                    <span className="font-bold text-[#1e1b4b]">{cat.name}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${cat.name}`} onClick={() => setCatModal(cat)}>
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${cat.name}`} onClick={() => void deleteCat(cat.id, cat.name)}>
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#66638c]">ยังไม่มีหมวด — เพิ่มหมวดก่อนจัดผลงาน</p>
          )}
        </div>

        <nav className={proResumeFilterChipShellClass} role="tablist" aria-label="กรองหมวดผลงาน">
          <button type="button" role="tab" aria-selected={filterCat === "all"} className={proResumeFilterChipClass(filterCat === "all")} onClick={() => setFilterCat("all")}>
            ทั้งหมด ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={filterCat === cat.id}
              className={proResumeFilterChipClass(filterCat === cat.id)}
              onClick={() => setFilterCat(cat.id)}
            >
              {cat.name} ({items.filter((i) => i.categoryId === cat.id).length})
            </button>
          ))}
        </nav>

        {filteredItems.length ? (
          <ul className="space-y-2">
            {filteredItems.map((row) => (
              <li key={row.id} className={proResumeTonedRowCardClass("sky")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <AppImageThumb src={row.coverImage} alt={row.title} className="h-14 w-14 shrink-0" onOpen={() => row.coverImage && lb.open(row.coverImage)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{row.title}</p>
                    <p className="line-clamp-2 text-sm text-[#66638c]">{row.shortDesc || "—"}</p>
                    <p className="text-xs text-emerald-700">{row.clickCount} คลิก</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 self-end sm:self-center">
                  <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.title}`} onClick={() => setItemModal(row)}>
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.title}`} onClick={() => void deleteItem(row.id, row.title)}>
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#66638c]">ยังไม่มีผลงานในหมวดนี้</p>
        )}
      </ProResumePagePanel>

      <CategoryModal open={catModal !== null} row={catModal} onClose={() => setCatModal(null)} onSaved={load} notice={notice} />
      <ItemModal open={itemModal !== null} row={itemModal} categories={categories} onClose={() => setItemModal(null)} onSaved={load} notice={notice} lb={lb} />
    </>
  );
}

function CategoryModal({
  open,
  row,
  onClose,
  onSaved,
  notice,
}: {
  open: boolean;
  row: ResumePortfolioCategoryDto | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(row && row !== "new" ? row.name : "");
  }, [open, row]);

  const submit = async () => {
    setBusy(true);
    try {
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/categories/${row.id}` : "/api/pro-resume/session/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      onClose();
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal open={open} onClose={onClose} title={row === "new" ? "เพิ่มหมวด" : "แก้ไขหมวด"} size="sm" footer={<FormModalFooterActions onCancel={onClose} onSubmit={() => void submit()} submitLabel="บันทึก" loading={busy} submitDisabled={!name.trim()} />}>
      <label className={labelClass}>ชื่อหมวด<input className={proResumeFieldClass} value={name} onChange={(e) => setName(e.target.value)} /></label>
    </FormModal>
  );
}

function ItemModal({
  open,
  row,
  categories,
  onClose,
  onSaved,
  notice,
  lb,
}: {
  open: boolean;
  row: ResumePortfolioItemDto | "new" | null;
  categories: ResumePortfolioCategoryDto[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
  lb: ReturnType<typeof useAppImageLightbox>;
}) {
  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    coverImage: null as string | null,
    shortDesc: "",
    contentHTML: "",
    youtubeUrl: "",
    images: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const coverGalleryRef = useRef<HTMLInputElement>(null);
  const galleryPickRef = useRef<HTMLInputElement>(null);
  const coverCamera = useAppCameraCapture();
  const galleryCamera = useAppCameraCapture();

  useEffect(() => {
    if (!open) return;
    if (row && row !== "new") {
      setForm({
        categoryId: row.categoryId,
        title: row.title,
        coverImage: row.coverImage,
        shortDesc: row.shortDesc,
        contentHTML: row.contentHTML,
        youtubeUrl: row.youtubeUrl ?? "",
        images: row.images,
      });
    } else {
      setForm({
        categoryId: categories[0]?.id ?? "",
        title: "",
        coverImage: null,
        shortDesc: "",
        contentHTML: "",
        youtubeUrl: "",
        images: [],
      });
    }
  }, [open, row, categories]);

  const uploadImage = async (file: File, kind: "images" | "profiles" = "images") => {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("file", prepared);
    fd.set("kind", kind);
    const res = await fetch(UPLOAD, { method: "POST", body: fd });
    const data = (await res.json()) as { imageUrl?: string; error?: string };
    if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
    return data.imageUrl;
  };

  const onPickCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (err) {
      notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  const onPickGalleryImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        setForm((f) => ({ ...f, images: [...f.images, url].slice(0, 24) }));
      } catch (err) {
        notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
        break;
      }
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        categoryId: form.categoryId,
        title: form.title,
        coverImage: form.coverImage,
        shortDesc: form.shortDesc,
        contentHTML: form.contentHTML,
        youtubeUrl: form.youtubeUrl || null,
        images: form.images,
      };
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/portfolio/${row.id}` : "/api/pro-resume/session/portfolio", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      onClose();
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={row === "new" ? "เพิ่มผลงาน" : "แก้ไขผลงาน"}
      size="lg"
      footer={<FormModalFooterActions onCancel={onClose} onSubmit={() => void submit()} submitLabel="บันทึก" loading={busy} submitDisabled={!form.title.trim() || !form.categoryId} />}
    >
      <div className="space-y-3">
        <label className={labelClass}>
          หมวด
          <select className={proResumeFieldClass} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">— เลือกหมวด —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>ชื่อผลงาน<input className={proResumeFieldClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></label>
        <label className={labelClass}>คำอธิบายสั้น<input className={proResumeFieldClass} value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} /></label>
        <label className={labelClass}>เนื้อหา (HTML)<textarea className={proResumeTextareaClass} value={form.contentHTML} onChange={(e) => setForm((f) => ({ ...f, contentHTML: e.target.value }))} /></label>
        <label className={labelClass}>YouTube URL<input className={proResumeFieldClass} value={form.youtubeUrl} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/..." /></label>
        <div className="space-y-2">
          <p className={labelClass}>รูปปก</p>
          <div className="flex flex-wrap items-center gap-2">
            {form.coverImage ? <AppImageThumb src={form.coverImage} alt="ปก" onOpen={() => lb.open(form.coverImage!)} /> : null}
            <AppImagePickCameraButtons
              disabled={busy}
              onPickGallery={() => coverGalleryRef.current?.click()}
              onPickCamera={() => coverCamera.openCamera(async (file) => {
                try {
                  const url = await uploadImage(file);
                  setForm((f) => ({ ...f, coverImage: url }));
                } catch (err) {
                  notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                }
              })}
            />
            <AppGalleryCameraFileInputs galleryInputRef={coverGalleryRef} cameraInputRef={coverCamera.cameraInputRef} onChange={onPickCover} />
            {coverCamera.cameraModal}
          </div>
        </div>
        <div className="space-y-2">
          <p className={labelClass}>แกลเลอรี ({form.images.length})</p>
          <div className="flex flex-wrap gap-2">
            {form.images.map((url) => (
              <div key={url} className="relative">
                <AppImageThumb src={url} alt="" onOpen={() => lb.open(url)} />
                <button type="button" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white" aria-label="ลบรูป" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))}>×</button>
              </div>
            ))}
          </div>
          <AppImagePickCameraButtons
            disabled={busy}
            onPickGallery={() => galleryPickRef.current?.click()}
            onPickCamera={() => galleryCamera.openCamera(async (file) => {
              try {
                const url = await uploadImage(file);
                setForm((f) => ({ ...f, images: [...f.images, url].slice(0, 24) }));
              } catch (err) {
                notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
              }
            })}
          />
          <AppGalleryCameraFileInputs galleryInputRef={galleryPickRef} cameraInputRef={galleryCamera.cameraInputRef} onChange={onPickGalleryImages} galleryMultiple />
          {galleryCamera.cameraModal}
        </div>
      </div>
    </FormModal>
  );
}
