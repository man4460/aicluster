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
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ProResumePagePanel } from "@/systems/pro-resume/components/ProResumePagePanel";
import { proResumeTonedRowCardClass } from "@/systems/pro-resume/lib/card-tones";
import type {
  ResumePortfolioCategoryDto,
  ResumePortfolioItemDto,
} from "@/systems/pro-resume/lib/mappers";
import {
  contentHtmlToPlainText,
  plainTextToContentHtml,
} from "@/systems/pro-resume/lib/content-plain";
import { proResumePageTitleIcon, proResumePageTitleTone } from "@/systems/pro-resume/lib/page-menu-icons";
import {
  proResumeFieldClass,
  proResumeFilterChipClass,
  proResumeFilterChipShellClass,
  proResumeOutlineButtonClass,
  proResumePrimaryButtonClass,
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
  const [catsManageOpen, setCatsManageOpen] = useState(false);
  const [itemModal, setItemModal] = useState<ResumePortfolioItemDto | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        fetch("/api/pro-resume/session/categories"),
        fetch("/api/pro-resume/session/portfolio"),
      ]);
      const cData = (await cRes.json()) as { categories?: ResumePortfolioCategoryDto[] };
      const iData = (await iRes.json()) as { items?: ResumePortfolioItemDto[] };
      const nextCats = cData.categories ?? [];
      setCategories(nextCats);
      setItems(iData.items ?? []);
      setFilterCat((prev) => (prev === "all" || nextCats.some((c) => c.id === prev) ? prev : "all"));
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
            <button
              type="button"
              className={proResumeOutlineButtonClass}
              onClick={() => setCatsManageOpen(true)}
              aria-label="จัดการหมวดหมู่"
              title="จัดการหมวด"
            >
              จัดการหมวด
            </button>
            <button type="button" className={proResumePrimaryButtonClass} onClick={() => setItemModal("new")} aria-label="เพิ่มผลงาน">
              + ผลงาน
            </button>
          </div>
        }
      >
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
          <p className="text-sm text-[#66638c]">
            {categories.length ? "ยังไม่มีผลงานในหมวดนี้" : "ยังไม่มีหมวด — กด «จัดการหมวด» เพื่อเพิ่มก่อน"}
          </p>
        )}
      </ProResumePagePanel>

      <CategoriesManageModal
        open={catsManageOpen}
        categories={categories}
        onClose={() => setCatsManageOpen(false)}
        onSaved={load}
        notice={notice}
      />
      <ItemModal open={itemModal !== null} row={itemModal} categories={categories} onClose={() => setItemModal(null)} onSaved={load} notice={notice} lb={lb} />
    </>
  );
}

function CategoriesManageModal({
  open,
  categories,
  onClose,
  onSaved,
  notice,
}: {
  open: boolean;
  categories: ResumePortfolioCategoryDto[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewName("");
      setEditingId(null);
      setEditName("");
    }
  }, [open]);

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch("/api/pro-resume/session/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "เพิ่มไม่สำเร็จ");
      setNewName("");
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "เพิ่มไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pro-resume/session/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setEditingId(null);
      setEditName("");
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const deleteCat = async (id: string, name: string) => {
    const ok = await notice.confirm(`ลบหมวด «${name}» และผลงานในหมวดนี้ใช่หรือไม่?`);
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pro-resume/session/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      if (editingId === id) {
        setEditingId(null);
        setEditName("");
      }
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal open={open} onClose={onClose} title="จัดการหมวดหมู่" size="md" mobileCentered>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            className={proResumeFieldClass}
            placeholder="ชื่อหมวดใหม่"
            value={newName}
            disabled={busy}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addCategory();
              }
            }}
          />
          <button type="button" className={proResumePrimaryButtonClass} disabled={busy || !newName.trim()} onClick={() => void addCategory()}>
            เพิ่ม
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-[#66638c]">ยังไม่มีหมวด — เพิ่มก่อนจัดผลงาน</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id} className={proResumeTonedRowCardClass("violet")}>
                {editingId === cat.id ? (
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <input
                      className={proResumeFieldClass}
                      value={editName}
                      disabled={busy}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveEdit();
                        }
                      }}
                    />
                    <button type="button" className={proResumePrimaryButtonClass} disabled={busy || !editName.trim()} onClick={() => void saveEdit()}>
                      บันทึก
                    </button>
                    <button
                      type="button"
                      className={proResumeOutlineButtonClass}
                      disabled={busy}
                      onClick={() => {
                        setEditingId(null);
                        setEditName("");
                      }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="min-w-0 flex-1 font-bold text-[#1e1b4b]">{cat.name}</p>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${cat.name}`}
                        title="แก้ไข"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${cat.name}`}
                        title="ลบ"
                        disabled={busy}
                        onClick={() => void deleteCat(cat.id, cat.name)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
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
    contentPlain: "",
    youtubeUrl: "",
    images: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const galleryPickRef = useRef<HTMLInputElement>(null);
  const galleryCamera = useAppCameraCapture();

  useEffect(() => {
    if (!open) return;
    if (row && row !== "new") {
      const images =
        row.coverImage && !row.images.includes(row.coverImage)
          ? [row.coverImage, ...row.images]
          : row.images;
      setForm({
        categoryId: row.categoryId,
        title: row.title,
        coverImage: row.coverImage,
        shortDesc: row.shortDesc,
        contentPlain: contentHtmlToPlainText(row.contentHTML),
        youtubeUrl: row.youtubeUrl ?? "",
        images,
      });
    } else {
      setForm({
        categoryId: categories[0]?.id ?? "",
        title: "",
        coverImage: null,
        shortDesc: "",
        contentPlain: "",
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

  const appendGalleryImages = (urls: string[]) => {
    if (!urls.length) return;
    setForm((f) => {
      const images = [...f.images, ...urls].slice(0, 24);
      return {
        ...f,
        images,
        coverImage: f.coverImage && images.includes(f.coverImage) ? f.coverImage : images[0] ?? null,
      };
    });
  };

  const removeGalleryImage = (url: string) => {
    setForm((f) => {
      const images = f.images.filter((u) => u !== url);
      const coverImage =
        f.coverImage === url ? images[0] ?? null : f.coverImage && images.includes(f.coverImage) ? f.coverImage : images[0] ?? null;
      return { ...f, images, coverImage };
    });
  };

  const onPickGalleryImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    const uploaded: string[] = [];
    for (const file of files) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (err) {
        notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
        break;
      }
    }
    appendGalleryImages(uploaded);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        categoryId: form.categoryId,
        title: form.title,
        coverImage: form.coverImage,
        shortDesc: form.shortDesc,
        contentHTML: plainTextToContentHtml(form.contentPlain),
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
        <label className={labelClass}>
          เนื้อหา
          <textarea
            className={cn(proResumeTextareaClass, "min-h-[10rem]")}
            value={form.contentPlain}
            onChange={(e) => setForm((f) => ({ ...f, contentPlain: e.target.value }))}
            placeholder={`## ผลลัพธ์
ลดงานเอกสารลงทะเบียนวันงาน และเปิดให้สมาชิกชำระค่าบำรุงผ่านลิงก์ไดนามิก

## จุดเด่น
- เป้าหมายชัดเจนและวัดผลได้
- ทำงานร่วมทีมข้ามหน่วยงาน
- ส่งมอบตรงเวลาพร้อมเอกสารครบ

เน้น **ส่งมอบตรงเวลา** และเอกสารครบ`}
          />
          <span className="mt-1 block space-y-0.5 text-[10px] font-medium leading-relaxed text-[#66638c]">
            <span className="block">หัวข้อ: ขึ้นต้นด้วย <code className="rounded bg-slate-100 px-1">##</code> หรือบรรทัดสั้นเดี่ยวคั่นบรรทัดว่าง</span>
            <span className="block">บูลเล็ต: <code className="rounded bg-slate-100 px-1">- ข้อความ</code> · ตัวหนา: <code className="rounded bg-slate-100 px-1">**ข้อความ**</code></span>
            <span className="block">ย่อหน้า: คั่นด้วยบรรทัดว่าง</span>
          </span>
        </label>
        <label className={labelClass}>YouTube URL<input className={proResumeFieldClass} value={form.youtubeUrl} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/..." /></label>
        <div className="space-y-2">
          <p className={labelClass}>แกลเลอรี ({form.images.length})</p>
          <p className="text-[10px] font-medium leading-relaxed text-[#66638c]">
            อัปโหลดรูปแล้วกด «ตั้งเป็นปก» บนรูปที่ต้องการเป็นหน้าปก
          </p>
          {form.coverImage ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#0000BF]/15 bg-[#0000BF]/5 px-2.5 py-2">
              <AppImageThumb src={form.coverImage} alt="หน้าปก" className="h-12 w-12" onOpen={() => lb.open(form.coverImage!)} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#4d47b6]">หน้าปกปัจจุบัน</p>
                <p className="text-[10px] text-[#66638c]">เลือกใหม่ได้จากแกลเลอรีด้านล่าง</p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-[#66638c]">
              ยังไม่มีหน้าปก — เพิ่มรูปแล้วตั้งเป็นปก
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {form.images.map((url) => {
              const isCover = form.coverImage === url;
              return (
                <div key={url} className="relative">
                  <div className={cn(isCover && "rounded-xl ring-2 ring-[#0000BF] ring-offset-2")}>
                    <AppImageThumb src={url} alt="" onOpen={() => lb.open(url)} />
                  </div>
                  {isCover ? (
                    <span className="absolute -left-1 -top-1 rounded-md bg-[#0000BF] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                      ปก
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="absolute bottom-1 left-1 right-1 rounded-md bg-white/95 px-1 py-0.5 text-[9px] font-bold text-[#4d47b6] shadow-sm ring-1 ring-[#0000BF]/20"
                      onClick={() => setForm((f) => ({ ...f, coverImage: url }))}
                    >
                      ตั้งเป็นปก
                    </button>
                  )}
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white"
                    aria-label="ลบรูป"
                    onClick={() => removeGalleryImage(url)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <AppImagePickCameraButtons
            disabled={busy}
            onPickGallery={() => galleryPickRef.current?.click()}
            onPickCamera={() => galleryCamera.openCamera(async (file) => {
              try {
                appendGalleryImages([await uploadImage(file)]);
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
