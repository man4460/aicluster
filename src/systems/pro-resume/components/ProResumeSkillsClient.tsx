"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
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
import { ProResumeRichTextField } from "@/systems/pro-resume/components/ProResumeRichTextField";
import { proResumeTonedRowCardClass } from "@/systems/pro-resume/lib/card-tones";
import type { ResumeSkillDto } from "@/systems/pro-resume/lib/mappers";
import { proResumePageTitleIcon, proResumePageTitleTone } from "@/systems/pro-resume/lib/page-menu-icons";
import {
  proResumeFieldClass,
  proResumeFilterChipClass,
  proResumeFilterChipShellClass,
  proResumeOutlineButtonClass,
  proResumePrimaryButtonClass,
  proResumeRowIconButtonClass,
} from "@/systems/pro-resume/lib/ui-tokens";

const UPLOAD = "/api/pro-resume/session/upload";
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";
const SKILL_LEVEL_PRESETS = ["พื้นฐาน", "ดี", "ดีมาก", "เชี่ยวชาญ"] as const;

function ReorderButtons({
  index,
  total,
  onUp,
  onDown,
  label,
}: {
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  label: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <button
        type="button"
        className={proResumeRowIconButtonClass}
        disabled={index === 0}
        aria-label={`เลื่อนขึ้น ${label}`}
        title="เลื่อนขึ้น"
        onClick={onUp}
      >
        ↑
      </button>
      <button
        type="button"
        className={proResumeRowIconButtonClass}
        disabled={index >= total - 1}
        aria-label={`เลื่อนลง ${label}`}
        title="เลื่อนลง"
        onClick={onDown}
      >
        ↓
      </button>
    </div>
  );
}

export function ProResumeSkillsClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [skills, setSkills] = useState<ResumeSkillDto[]>([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [modal, setModal] = useState<ResumeSkillDto | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pro-resume/session/skills");
      const data = (await res.json()) as { skills?: ResumeSkillDto[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setSkills(data.skills ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const levelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of skills) {
      const lv = s.level.trim();
      if (lv) set.add(lv);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "th"));
  }, [skills]);

  const filtersActive = Boolean(keyword.trim() || levelFilter !== "all");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return skills.filter((s) => {
      if (levelFilter !== "all" && s.level.trim() !== levelFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.level ?? "").toLowerCase().includes(q) ||
        (s.shortDesc ?? "").toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [skills, keyword, levelFilter]);

  const reorder = async (ids: string[]) => {
    const res = await fetch("/api/pro-resume/session/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "จัดลำดับไม่สำเร็จ");
    }
    await load();
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    if (filtersActive) {
      notice.error("ล้างตัวกรองก่อนจัดลำดับ");
      return;
    }
    const next = [...skills];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    try {
      await reorder(next.map((r) => r.id));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "จัดลำดับไม่สำเร็จ");
    }
  };

  const deleteRow = async (id: string, name: string) => {
    const ok = await notice.confirm(`ลบทักษะ «${name}» ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/pro-resume/session/skills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await load();
  };

  return (
    <>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปทักษะพิเศษ" />

      <ProResumePagePanel
        title="ทักษะพิเศษ"
        subtitle="ความสามารถพิเศษ — แนบรูปและข้อความแบบผลงาน"
        titleIcon={proResumePageTitleIcon("skills")}
        titleTone={proResumePageTitleTone("skills")}
        action={
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(
                proResumeOutlineButtonClass,
                "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 sm:min-w-0 sm:px-3",
                filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
              )}
              aria-expanded={filterOpen}
              aria-controls="pro-resume-skills-filter-panel"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              className={cn(proResumePrimaryButtonClass, "min-h-[40px] min-w-[40px] sm:min-w-0")}
              onClick={() => setModal("new")}
              aria-label="เพิ่มทักษะพิเศษ"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ เพิ่มทักษะ</span>
            </button>
          </div>
        }
      >
        <div id="pro-resume-skills-filter-panel" className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
          <nav className={proResumeFilterChipShellClass} role="tablist" aria-label="กรองระดับทักษะ">
            <button
              type="button"
              role="tab"
              aria-selected={levelFilter === "all"}
              className={proResumeFilterChipClass(levelFilter === "all")}
              onClick={() => setLevelFilter("all")}
            >
              ทั้งหมด ({skills.length})
            </button>
            {levelOptions.map((lv) => (
              <button
                key={lv}
                type="button"
                role="tab"
                aria-selected={levelFilter === lv}
                className={proResumeFilterChipClass(levelFilter === lv)}
                onClick={() => setLevelFilter(lv)}
              >
                {lv} ({skills.filter((s) => s.level.trim() === lv).length})
              </button>
            ))}
          </nav>
          <label className={labelClass}>
            ค้นหา
            <input
              className={proResumeFieldClass}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ชื่อทักษะ · ระดับ · ข้อความ"
            />
          </label>
          {filtersActive ? (
            <button
              type="button"
              className={proResumeOutlineButtonClass}
              onClick={() => {
                setKeyword("");
                setLevelFilter("all");
              }}
            >
              ล้างกรอง
            </button>
          ) : null}
          <p className="text-xs font-medium text-[#66638c]">
            แสดง {filtered.length}/{skills.length}
          </p>
        </div>

        {filtered.length ? (
          <ul className="space-y-2">
            {filtered.map((row, i) => (
              <li key={row.id} className={proResumeTonedRowCardClass("amber")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {!filtersActive ? (
                    <ReorderButtons
                      index={i}
                      total={filtered.length}
                      label={row.name}
                      onUp={() => void moveItem(i, -1)}
                      onDown={() => void moveItem(i, 1)}
                    />
                  ) : null}
                  <AppImageThumb
                    src={row.coverImage}
                    alt={row.name}
                    emptyLabel="ไม่มีรูป"
                    className="h-14 w-14 shrink-0"
                    onOpen={() => row.coverImage && lb.open(row.coverImage)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{row.name}</p>
                    {row.level.trim() ? (
                      <p className="text-sm font-semibold text-[#4d47b6]">{row.level}</p>
                    ) : null}
                    <p className="line-clamp-2 text-sm text-[#66638c]">
                      {(row.shortDesc ?? "").trim() ||
                        ((row.description ?? "").trim()
                          ? (row.description ?? "").replace(/<[^>]+>/g, " ").trim()
                          : "—")}
                    </p>
                    {row.images.length > 1 ? (
                      <p className="mt-0.5 text-[11px] font-medium text-[#8b87b8]">{row.images.length} รูป</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 self-end sm:self-center">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${row.name}`}
                    title="แก้ไข"
                    onClick={() => setModal(row)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${row.name}`}
                    title="ลบ"
                    onClick={() => void deleteRow(row.id, row.name)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#66638c]">
            {skills.length ? "ไม่พบรายการตามตัวกรอง" : "ยังไม่มีทักษะพิเศษ — กดเพิ่มเพื่อเริ่มนำเสนอ"}
          </p>
        )}
      </ProResumePagePanel>

      <SkillModal
        open={modal !== null}
        row={modal}
        onClose={() => setModal(null)}
        onSaved={load}
        notice={notice}
        lb={lb}
      />
    </>
  );
}

function SkillModal({
  open,
  row,
  onClose,
  onSaved,
  notice,
  lb,
}: {
  open: boolean;
  row: ResumeSkillDto | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
  lb: ReturnType<typeof useAppImageLightbox>;
}) {
  const [form, setForm] = useState({
    name: "",
    level: "",
    shortDesc: "",
    description: "",
    coverImage: null as string | null,
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
        name: row.name,
        level: row.level,
        shortDesc: row.shortDesc,
        description: row.description,
        coverImage: row.coverImage,
        images,
      });
    } else {
      setForm({ name: "", level: "", shortDesc: "", description: "", coverImage: null, images: [] });
    }
  }, [open, row]);

  const uploadImage = async (file: File) => {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("file", prepared);
    fd.set("kind", "images");
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
        f.coverImage === url
          ? images[0] ?? null
          : f.coverImage && images.includes(f.coverImage)
            ? f.coverImage
            : images[0] ?? null;
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
        name: form.name,
        level: form.level,
        shortDesc: form.shortDesc,
        description: form.description,
        coverImage: form.coverImage,
        images: form.images,
      };
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/skills/${row.id}` : "/api/pro-resume/session/skills", {
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
      title={row === "new" ? "เพิ่มทักษะพิเศษ" : "แก้ไขทักษะพิเศษ"}
      description="แนบรูปและข้อความนำเสนอ — รูปแบบเดียวกับผลงาน"
      size="lg"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={() => void submit()}
          submitLabel="บันทึก"
          loading={busy}
          submitDisabled={!form.name.trim()}
        />
      }
    >
      <div className="space-y-3">
        <label className={labelClass}>
          ชื่อทักษะ / ความสามารถ
          <input
            className={proResumeFieldClass}
            value={form.name}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น นำเสนอแผนธุรกิจ · ถ่ายภาพผลิตภัณฑ์"
          />
        </label>
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-[#4d47b6]">ระดับ (ไม่บังคับ)</p>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_LEVEL_PRESETS.map((lv) => (
              <button
                key={lv}
                type="button"
                className={proResumeFilterChipClass(form.level === lv)}
                disabled={busy}
                onClick={() => setForm((f) => ({ ...f, level: f.level === lv ? "" : lv }))}
              >
                {lv}
              </button>
            ))}
          </div>
          <input
            className={proResumeFieldClass}
            value={form.level}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
            placeholder="หรือพิมพ์ระดับเอง"
          />
        </div>
        <label className={labelClass}>
          คำอธิบายสั้น
          <input
            className={proResumeFieldClass}
            value={form.shortDesc}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
            placeholder="สรุปสั้น ๆ ที่โชว์ในการ์ดรายการ"
          />
        </label>
        <ProResumeRichTextField
          label="รายละเอียด / ข้อความ"
          value={form.description}
          disabled={busy}
          onChange={(description) => setForm((f) => ({ ...f, description }))}
          textareaClassName="min-h-[10rem]"
          placeholder={`# จุดเด่น
ใช้ในงานนำเสนอและปิดการขาย

~ รายละเอียดเสริม

## ตัวอย่างการใช้
- บริบทงานหรือโครงการ
- เครื่องมือ / เทคนิคที่เกี่ยวข้อง`}
        />
        <div className="space-y-2">
          <p className={labelClass}>แกลเลอรี ({form.images.length})</p>
          <p className="text-[10px] font-medium leading-relaxed text-[#66638c]">
            อัปโหลดรูปแล้วกด «ตั้งเป็นปก» บนรูปที่ต้องการเป็นหน้าปก
          </p>
          {form.coverImage ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#0000BF]/15 bg-[#0000BF]/5 px-2.5 py-2">
              <AppImageThumb
                src={form.coverImage}
                alt="หน้าปก"
                className="h-12 w-12"
                onOpen={() => lb.open(form.coverImage!)}
              />
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
            onPickCamera={() =>
              galleryCamera.openCamera(async (file) => {
                try {
                  appendGalleryImages([await uploadImage(file)]);
                } catch (err) {
                  notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                }
              })
            }
            labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
            buttonClassName={proResumeOutlineButtonClass}
          />
          <input
            ref={galleryPickRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => void onPickGalleryImages(e)}
          />
          {galleryCamera.cameraModal}
        </div>
      </div>
    </FormModal>
  );
}
