"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Link2, Play, Plus, Trash2 } from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  CLUB_EVENT_BASE,
  clubEventEventHref,
} from "@/systems/club-event/club-event-module-nav";
import {
  ClubEventLinkEditorModal,
  clubLinkFormFromDto,
  emptyClubLinkForm,
} from "@/systems/club-event/components/ClubEventLinkEditorModal";
import {
  ClubEventPageBlock,
  ClubEventPageSubNav,
} from "@/systems/club-event/components/ClubEventPageSubNav";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import { ClubEventYoutubePlayer } from "@/systems/club-event/components/ClubEventYoutubePlayer";
import { prepareClubEventGalleryWebp } from "@/systems/club-event/lib/gallery-image";
import type {
  ClubEventDynamicLinkDto,
  ClubEventRecordDto,
} from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import type { ClubEventMediaLimits } from "@/systems/club-event/lib/plan-limits";
import {
  CLUB_EVENT_FREE_GALLERY_MAX,
  CLUB_EVENT_FREE_YOUTUBE_MAX,
} from "@/systems/club-event/lib/plan-limits";
import { clubEventYoutubeWatchUrlFromStored } from "@/systems/club-event/lib/youtube";
import {
  clubEventFieldClass,
  clubEventIconButtonClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventRowCardClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

type GalleryItem = { id: string; imageUrl: string; fileName: string; sortOrder: number };
type ClubLinkRow = ClubEventDynamicLinkDto & { submissionsCount?: number };
type ClubSubmissionRow = {
  id: string;
  respondentName: string;
  respondentPhone: string;
  amountBaht: number | null;
  paymentMethod: string | null;
  slipUrl: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
};

const defaultLimits: ClubEventMediaLimits = {
  isMonthly: false,
  youtubeMax: CLUB_EVENT_FREE_YOUTUBE_MAX,
  galleryMax: CLUB_EVENT_FREE_GALLERY_MAX,
};

export function ClubEventEventEditorClient({ eventId }: { eventId: string | null }) {
  const router = useRouter();
  const isNew = !eventId;
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<ClubEventMediaLimits>(defaultLimits);
  const [savedId, setSavedId] = useState<string | null>(eventId);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [youtubeInputs, setYoutubeInputs] = useState<string[]>([""]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [links, setLinks] = useState<ClubLinkRow[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState(() => emptyClubLinkForm());
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsTitle, setSubsTitle] = useState("");
  const [subsRows, setSubsRows] = useState<ClubSubmissionRow[]>([]);

  const activeEventId = savedId;
  const eventAsList: ClubEventRecordDto[] = activeEventId
    ? [
        {
          id: activeEventId,
          title: title || "กิจกรรม",
          eventDate: new Date(eventDate).toISOString(),
          status,
          description,
          youtubeEmbedUrl: null,
          youtubeUrls: [],
          galleryCount: gallery.length,
        },
      ]
    : [];

  const loadLinks = useCallback(async (forEventId: string) => {
    try {
      const res = await fetch("/api/club-event/session/links");
      const data = (await res.json()) as { links?: ClubLinkRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดลิงก์ไม่สำเร็จ");
      setLinks((data.links ?? []).filter((l) => l.config.eventId === forEventId));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดลิงก์ไม่สำเร็จ");
    }
  }, [notice.error]);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/club-event/session/events/${eventId}`);
      const data = (await res.json()) as {
        event?: ClubEventRecordDto;
        gallery?: GalleryItem[];
        mediaLimits?: ClubEventMediaLimits;
        error?: string;
      };
      if (!res.ok || !data.event) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      const ev = data.event;
      setTitle(ev.title);
      setEventDate(ev.eventDate.slice(0, 16));
      setDescription(ev.description);
      setStatus(ev.status);
      const urls =
        ev.youtubeUrls?.length > 0
          ? ev.youtubeUrls.map((u) => clubEventYoutubeWatchUrlFromStored(u) ?? u)
          : ev.youtubeEmbedUrl
            ? [clubEventYoutubeWatchUrlFromStored(ev.youtubeEmbedUrl) ?? ev.youtubeEmbedUrl]
            : [""];
      setYoutubeInputs(urls.length > 0 ? urls : [""]);
      setGallery(data.gallery ?? []);
      if (data.mediaLimits) setLimits(data.mediaLimits);
      setSavedId(ev.id);
      await loadLinks(ev.id);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      router.replace(CLUB_EVENT_BASE);
    } finally {
      setLoading(false);
    }
  }, [eventId, loadLinks, notice.error, router]);

  useEffect(() => {
    if (isNew) {
      void (async () => {
        try {
          const res = await fetch("/api/club-event/session/events?status=UPCOMING");
          const data = (await res.json()) as { mediaLimits?: ClubEventMediaLimits };
          if (data.mediaLimits) setLimits(data.mediaLimits);
        } catch {
          /* ignore */
        }
      })();
      return;
    }
    void loadEvent();
  }, [isNew, loadEvent]);

  const canAddYoutube = youtubeInputs.filter((u) => u.trim()).length < limits.youtubeMax;
  const canAddGallery = gallery.length < limits.galleryMax;

  const saveEvent = async () => {
    if (!title.trim()) {
      notice.error("กรอกชื่อกิจกรรม");
      return;
    }
    const youtubeUrls = youtubeInputs.map((u) => u.trim()).filter(Boolean);
    if (youtubeUrls.length > limits.youtubeMax) {
      notice.error(
        limits.isMonthly
          ? `เพิ่ม YouTube ได้สูงสุด ${limits.youtubeMax} ลิงก์`
          : `แพ็กฟรีเพิ่ม YouTube ได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} ลิงก์ — มากกว่านี้ต้องสมัครรายเดือน`,
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        eventDate: new Date(eventDate).toISOString(),
        description,
        status,
        youtubeUrls,
      };
      const res = await fetch(
        activeEventId ? `/api/club-event/session/events/${activeEventId}` : "/api/club-event/session/events",
        {
          method: activeEventId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        event?: ClubEventRecordDto;
        mediaLimits?: ClubEventMediaLimits;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.mediaLimits) setLimits(data.mediaLimits);
      notice.success("บันทึกกิจกรรมแล้ว");
      if (data.event && isNew) {
        setSavedId(data.event.id);
        router.replace(clubEventEventHref(data.event.id));
      } else if (data.event) {
        setSavedId(data.event.id);
      }
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const uploadGallery = async (file: File) => {
    if (!activeEventId) {
      notice.error("บันทึกกิจกรรมก่อน แล้วค่อยอัปโหลดรูป");
      return;
    }
    if (!canAddGallery) {
      notice.error(
        limits.isMonthly
          ? `อัปโหลดได้สูงสุด ${limits.galleryMax} รูป`
          : `แพ็กฟรีอัปโหลดได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป — มากกว่านี้ต้องสมัครรายเดือน`,
      );
      return;
    }
    try {
      const webp = await prepareClubEventGalleryWebp(file);
      const form = new FormData();
      form.set("file", webp);
      const res = await fetch(`/api/club-event/session/events/${activeEventId}/gallery`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { image?: GalleryItem; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      if (data.image) setGallery((g) => [...g, data.image!]);
      notice.success("อัปโหลดรูปแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  const removeGalleryImage = async (imageId: string) => {
    if (!activeEventId) return;
    try {
      const res = await fetch(
        `/api/club-event/session/events/${activeEventId}/gallery?imageId=${encodeURIComponent(imageId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      setGallery((g) => g.filter((x) => x.id !== imageId));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const openCreateLink = () => {
    if (!activeEventId) {
      notice.error("บันทึกกิจกรรมก่อน แล้วค่อยสร้างลิงก์");
      return;
    }
    setLinkForm(
      emptyClubLinkForm({
        type: "RSVP",
        title: `ลงทะเบียน · ${title || "กิจกรรม"}`,
        eventId: activeEventId,
      }),
    );
    setLinkModalOpen(true);
  };

  const openEditLink = (l: ClubEventDynamicLinkDto) => {
    setLinkForm(clubLinkFormFromDto(l));
    setLinkModalOpen(true);
  };

  const deleteLink = async (id: string, linkTitle: string) => {
    const ok = await notice.confirm(`ลบลิงก์ «${linkTitle}» ใช่หรือไม่?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/club-event/session/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      if (activeEventId) await loadLinks(activeEventId);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const openSubmissions = async (l: ClubEventDynamicLinkDto) => {
    setSubsTitle(l.title);
    setSubsOpen(true);
    try {
      const res = await fetch(`/api/club-event/session/links/${l.id}/submissions`);
      const data = (await res.json()) as { submissions?: ClubSubmissionRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดคำตอบไม่สำเร็จ");
      setSubsRows(data.submissions ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดคำตอบไม่สำเร็จ");
      setSubsRows([]);
    }
  };

  if (loading) {
    return (
      <ClubEventPageSubNav title="กำหนดการ" subtitle="กำลังโหลด…">
        <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
      </ClubEventPageSubNav>
    );
  }

  const pageSubtitle = isNew && !savedId ? "เพิ่มกิจกรรม" : "แก้ไขกิจกรรม";

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="กำหนดการ"
        subtitle={pageSubtitle}
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
            <Link
              href={CLUB_EVENT_BASE}
              className={clubEventIconButtonClass}
              aria-label="กลับกำหนดการ"
              title="กลับกำหนดการ"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              className={clubEventPrimaryButtonClass}
              disabled={saving}
              onClick={() => void saveEvent()}
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        }
      >
        <ClubEventPageBlock first>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-[#1e1b4b]">ชื่อกิจกรรม</span>
              <input
                className={clubEventFieldClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ประชุมใหญ่ประจำปี"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-[#1e1b4b]">วันเวลา</span>
              <input
                type="datetime-local"
                className={clubEventFieldClass}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-[#1e1b4b]">รายละเอียด</span>
              <textarea
                className={clubEventTextareaClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>
        </ClubEventPageBlock>

        <ClubEventPageBlock
          title="วิดีโอ YouTube"
          action={
            <button
              type="button"
              className={clubEventOutlineButtonClass}
              disabled={!canAddYoutube}
              onClick={() => {
                if (!canAddYoutube) {
                  notice.error(
                    limits.isMonthly
                      ? `เพิ่มได้สูงสุด ${limits.youtubeMax} ลิงก์`
                      : `แพ็กฟรีได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} ลิงก์ — สมัครรายเดือนเพื่อเพิ่มหลายวิดีโอ`,
                  );
                  return;
                }
                setYoutubeInputs((rows) => [...rows, ""]);
              }}
            >
              <Plus className="mr-1 inline h-4 w-4" aria-hidden />
              เพิ่มลิงก์
            </button>
          }
        >
          <p className="mb-2 text-[11px] font-semibold text-[#8b87b8]">
            {limits.isMonthly
              ? `แพ็กเดือน · ได้สูงสุด ${limits.youtubeMax} ลิงก์`
              : `แพ็กฟรี · ได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} ลิงก์ — เพิ่มมากกว่านี้ต้องสมัครรายเดือน`}
          </p>
          <ul className="space-y-2">
            {youtubeInputs.map((url, idx) => (
              <li key={idx} className="flex gap-2">
                <input
                  className={cn(clubEventFieldClass, "min-w-0 flex-1")}
                  value={url}
                  onChange={(e) => {
                    const next = [...youtubeInputs];
                    next[idx] = e.target.value;
                    setYoutubeInputs(next);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  autoComplete="off"
                  spellCheck={false}
                />
                {youtubeInputs.length > 1 ? (
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบลิงก์วิดีโอที่ ${idx + 1}`}
                    title="ลบ"
                    onClick={() => setYoutubeInputs((rows) => rows.filter((_, i) => i !== idx))}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {youtubeInputs.some((u) => u.trim()) ? (
            <div className="mt-3 space-y-3">
              {youtubeInputs
                .filter((u) => u.trim())
                .map((u, i) => (
                  <ClubEventYoutubePlayer key={`${u}-${i}`} youtubeEmbedUrl={u} title={`${title || "วิดีโอ"} ${i + 1}`} />
                ))}
            </div>
          ) : null}
        </ClubEventPageBlock>

        <ClubEventPageBlock
          title="แกลเลอรี"
          action={
            <div className="flex flex-wrap gap-1.5">
              {gallery.length > 0 ? (
                <button
                  type="button"
                  className={cn(clubEventOutlineButtonClass, "inline-flex items-center gap-1.5")}
                  onClick={() => setSlideshowOpen(true)}
                >
                  <Play className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Slideshow</span>
                </button>
              ) : null}
              <label
                className={cn(
                  clubEventOutlineButtonClass,
                  "inline-flex cursor-pointer items-center gap-1.5",
                  (!activeEventId || !canAddGallery) && "pointer-events-none opacity-50",
                )}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                <span>เพิ่มรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={!activeEventId || !canAddGallery}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadGallery(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          }
        >
          <p className="mb-2 text-[11px] font-semibold text-[#8b87b8]">
            {gallery.length}/{limits.galleryMax} รูป
            {!limits.isMonthly ? ` · ฟรีได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป เกินนี้สมัครรายเดือน` : null}
          </p>
          {!activeEventId ? (
            <AppEmptyState>บันทึกกิจกรรมก่อน แล้วค่อยอัปโหลดรูป</AppEmptyState>
          ) : gallery.length === 0 ? (
            <AppEmptyState>ยังไม่มีรูป — อัปโหลดรูปกิจกรรม (แปลง WebP อัตโนมัติ)</AppEmptyState>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gallery.map((g) => (
                <div key={g.id} className="relative">
                  <AppImageThumb src={g.imageUrl} alt={g.fileName} onOpen={() => lb.open(g.imageUrl)} />
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white"
                    aria-label={`ลบรูป ${g.fileName}`}
                    onClick={() => void removeGalleryImage(g.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ClubEventPageBlock>

        <ClubEventPageBlock
          title="ลิงก์สำรวจ · RSVP · เก็บค่า"
          action={
            <button
              type="button"
              className={cn(clubEventOutlineButtonClass, "inline-flex items-center gap-1.5")}
              disabled={!activeEventId}
              onClick={openCreateLink}
            >
              <Link2 className="h-4 w-4" aria-hidden />
              สร้างลิงก์
            </button>
          }
        >
          {!activeEventId ? (
            <AppEmptyState>บันทึกกิจกรรมก่อน แล้วค่อยสร้างลิงก์</AppEmptyState>
          ) : links.length === 0 ? (
            <AppEmptyState>ยังไม่มีลิงก์ของกิจกรรมนี้</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id} className={clubEventRowCardClass}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{l.title}</p>
                    <p className="text-sm text-[#66638c]">
                      {CLUB_EVENT_LINK_TYPE_LABELS[l.type]}
                      {typeof l.submissionsCount === "number" ? ` · คำตอบ ${l.submissionsCount}` : ""}
                    </p>
                    <a
                      href={l.publicPath}
                      className="text-xs text-[#0000BF] underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.publicPath}
                    </a>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <button
                      type="button"
                      className={clubEventOutlineButtonClass}
                      onClick={() => void openSubmissions(l)}
                    >
                      คำตอบ
                    </button>
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${l.title}`}
                      title="แก้ไข"
                      onClick={() => openEditLink(l)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${l.title}`}
                      title="ลบ"
                      onClick={() => void deleteLink(l.id, l.title)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ClubEventPageBlock>
      </ClubEventPageSubNav>

      <ClubEventLinkEditorModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        initial={linkForm}
        events={eventAsList}
        lockEventId
        onSaved={() => (activeEventId ? void loadLinks(activeEventId) : undefined)}
      />

      <FormModal open={subsOpen} onClose={() => setSubsOpen(false)} title={`คำตอบ · ${subsTitle}`} mobileCentered>
        {subsRows.length === 0 ? (
          <AppEmptyState>ยังไม่มีคำตอบ</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {subsRows.map((s) => {
              const answers =
                s.payload.answers && typeof s.payload.answers === "object"
                  ? (s.payload.answers as Record<string, string>)
                  : null;
              const fieldMeta = Array.isArray(s.payload.fields)
                ? (s.payload.fields as { key?: string; label?: string }[])
                : [];
              const labelOf = (key: string) =>
                fieldMeta.find((f) => f.key === key)?.label?.trim() || key;
              const legacyAnswer =
                typeof s.payload.answer === "string" ? s.payload.answer : "";
              return (
                <li key={s.id} className="rounded-lg border border-slate-200/90 p-3 text-sm">
                  <p className="font-bold text-[#1e1b4b]">
                    {s.respondentName || "ไม่ระบุชื่อ"}
                    {s.respondentPhone ? ` · ${s.respondentPhone}` : ""}
                  </p>
                  {s.amountBaht != null ? (
                    <p className="text-[#4d47b6]">
                      ฿{s.amountBaht.toLocaleString("th-TH")}
                      {s.paymentMethod ? ` · ${s.paymentMethod}` : ""}
                    </p>
                  ) : null}
                  {answers
                    ? Object.entries(answers).map(([k, v]) =>
                        v ? (
                          <p key={k} className="mt-1 text-[#66638c]">
                            <span className="font-semibold text-[#4d47b6]">{labelOf(k)}: </span>
                            {v}
                          </p>
                        ) : null,
                      )
                    : legacyAnswer
                      ? <p className="mt-1 text-[#66638c]">{legacyAnswer}</p>
                      : null}
                  {s.slipUrl ? (
                    <a href={s.slipUrl} target="_blank" rel="noreferrer" className="text-xs text-[#0000BF] underline">
                      ดูสลิป
                    </a>
                  ) : null}
                  <p className="mt-1 text-[10px] text-[#9490c0]">
                    {new Date(s.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </FormModal>

      <ClubEventSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        slides={gallery}
        title={title}
      />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปกิจกรรม" />
    </>
  );
}
