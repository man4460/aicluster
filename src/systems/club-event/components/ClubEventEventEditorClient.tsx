"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Link2, Play } from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppYoutubeLightbox,
  appDashboardBrandCtaPillButtonClass,
  useAppImageLightbox,
  useAppNoticePopup,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { extractYoutubeVideoId, youtubeThumbUrl } from "@/lib/youtube-url";
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
import { ClubEventLinkSubmissionsModal } from "@/systems/club-event/components/ClubEventLinkSubmissionsModal";
import {
  ClubEventPageBlock,
  ClubEventPageSubNav,
} from "@/systems/club-event/components/ClubEventPageSubNav";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import { prepareClubEventGalleryWebp } from "@/systems/club-event/lib/gallery-image";
import type {
  ClubDynamicLinkField,
  ClubEventDynamicLinkDto,
  ClubEventRecordDto,
} from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import type { ClubEventMediaLimits } from "@/systems/club-event/lib/plan-limits";
import {
  CLUB_EVENT_FREE_GALLERY_MAX,
  CLUB_EVENT_FREE_YOUTUBE_MAX,
  CLUB_EVENT_MONTHLY_YOUTUBE_MAX,
} from "@/systems/club-event/lib/plan-limits";
import type { ClubSubmissionRow } from "@/systems/club-event/lib/submission-summary";
import type { ClubEventYoutubeVideo } from "@/systems/club-event/lib/youtube";
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

type YoutubeDraft = {
  id: string;
  title: string;
  hint: string;
  youtubeUrl: string;
};

function newYoutubeDraft(): YoutubeDraft {
  return {
    id: `tmp-${Date.now().toString(36)}`,
    title: "",
    hint: "",
    youtubeUrl: "",
  };
}

function draftFromVideo(v: ClubEventYoutubeVideo): YoutubeDraft {
  return {
    id: v.id,
    title: v.title,
    hint: v.hint,
    youtubeUrl: v.youtubeUrl,
  };
}

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
  const ytLb = useAppYoutubeLightbox();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<ClubEventMediaLimits>(defaultLimits);
  const [savedId, setSavedId] = useState<string | null>(eventId);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"UPCOMING" | "PAST">("UPCOMING");
  const [youtubeVideos, setYoutubeVideos] = useState<YoutubeDraft[]>([]);
  const [ytEditIdx, setYtEditIdx] = useState<number | null>(null);
  const [ytForm, setYtForm] = useState<YoutubeDraft>(() => newYoutubeDraft());
  const [ytFormErr, setYtFormErr] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [links, setLinks] = useState<ClubLinkRow[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState(() => emptyClubLinkForm());
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsTitle, setSubsTitle] = useState("");
  const [subsRows, setSubsRows] = useState<ClubSubmissionRow[]>([]);
  const [subsFields, setSubsFields] = useState<ClubDynamicLinkField[]>([]);

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
          youtubeVideos: [],
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
      setYoutubeVideos(
        (ev.youtubeVideos?.length
          ? ev.youtubeVideos
          : (ev.youtubeUrls ?? []).map((u, i) => ({
              id: `legacy-${i}`,
              title: `คลิป ${i + 1}`,
              hint: "",
              youtubeUrl: u,
              videoId: extractYoutubeVideoId(u) ?? `legacy-${i}`,
            }))
        ).map(draftFromVideo),
      );
      setYtEditIdx(null);
      setYtForm(newYoutubeDraft());
      setYtFormErr(null);
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

  const canAddYoutube = youtubeVideos.length < limits.youtubeMax;
  const canAddGallery = gallery.length < limits.galleryMax;
  const ytFormPreviewId = extractYoutubeVideoId(ytForm.youtubeUrl);
  const ytEditing = ytEditIdx !== null || Boolean(ytForm.title || ytForm.youtubeUrl);

  function saveYoutubeFormLocal() {
    const clipTitle = ytForm.title.trim();
    const youtubeUrl = ytForm.youtubeUrl.trim();
    if (!clipTitle || !youtubeUrl) {
      setYtFormErr("กรอกชื่อคลิปและลิงก์ YouTube");
      return;
    }
    if (!extractYoutubeVideoId(youtubeUrl)) {
      setYtFormErr("ลิงก์ YouTube ไม่ถูกต้อง");
      return;
    }
    if (ytEditIdx == null && youtubeVideos.length >= limits.youtubeMax) {
      setYtFormErr(
        limits.isMonthly
          ? `เพิ่มได้สูงสุด ${limits.youtubeMax} ลิงก์`
          : `แพ็กฟรีได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} ลิงก์ — สมัครรายเดือนเพื่อเพิ่มหลายวิดีโอ`,
      );
      return;
    }
    setYtFormErr(null);
    setYoutubeVideos((prev) => {
      const next = [...prev];
      const row = {
        ...ytForm,
        title: clipTitle,
        youtubeUrl,
        hint: ytForm.hint.trim(),
      };
      if (ytEditIdx == null) next.push(row);
      else next[ytEditIdx] = row;
      return next;
    });
    setYtEditIdx(null);
    setYtForm(newYoutubeDraft());
  }

  const saveEvent = async () => {
    if (!title.trim()) {
      notice.error("กรอกชื่อกิจกรรม");
      return;
    }
    if (youtubeVideos.length > limits.youtubeMax) {
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
        youtubeVideos: youtubeVideos.map((v) => ({
          id: v.id.startsWith("tmp-") ? undefined : v.id,
          title: v.title,
          hint: v.hint || null,
          youtubeUrl: v.youtubeUrl,
        })),
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

  const uploadGalleryFiles = async (fileList: FileList | File[]) => {
    if (!activeEventId) {
      notice.error("บันทึกกิจกรรมก่อน แล้วค่อยอัปโหลดรูป");
      return;
    }
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      notice.error("เลือกรูปภาพเท่านั้น");
      return;
    }

    const remaining = limits.galleryMax - gallery.length;
    if (remaining <= 0) {
      notice.error(
        limits.isMonthly
          ? `อัปโหลดได้สูงสุด ${limits.galleryMax} รูป`
          : `แพ็กฟรีอัปโหลดได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป — มากกว่านี้ต้องสมัครรายเดือน`,
      );
      return;
    }

    const toUpload = files.slice(0, remaining);
    const skipped = files.length - toUpload.length;
    setGalleryUploading(true);
    let ok = 0;
    let lastError = "";
    try {
      for (const file of toUpload) {
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
          if (data.image) {
            setGallery((g) => [...g, data.image!]);
            ok += 1;
          }
        } catch (e) {
          lastError = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
        }
      }
      if (ok > 0) {
        notice.success(ok === 1 ? "อัปโหลดรูปแล้ว" : `อัปโหลด ${ok} รูปแล้ว`);
      }
      if (skipped > 0) {
        notice.error(
          `เหลือโควต้า ${remaining} รูป — ข้าม ${skipped} ไฟล์` +
            (limits.isMonthly ? "" : ` (ฟรีได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป)`),
        );
      } else if (ok === 0 && lastError) {
        notice.error(lastError);
      }
    } finally {
      setGalleryUploading(false);
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

  const openEditLink = (l: ClubEventDynamicLinkDto) => {
    setLinkForm(clubLinkFormFromDto(l));
    setLinkModalOpen(true);
  };

  const openCreateLink = () => {
    if (!activeEventId) {
      notice.error("บันทึกกิจกรรมก่อน แล้วค่อยสร้างลิงก์");
      return;
    }
    if (links.length > 0) {
      openEditLink(links[0]!);
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
    setSubsFields(l.config.fields ?? []);
    setSubsOpen(true);
    try {
      const res = await fetch(`/api/club-event/session/links/${l.id}/submissions`);
      const data = (await res.json()) as {
        submissions?: ClubSubmissionRow[];
        fields?: ClubDynamicLinkField[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดคำตอบไม่สำเร็จ");
      setSubsRows(data.submissions ?? []);
      if (data.fields?.length) setSubsFields(data.fields);
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

        <ClubEventPageBlock title="วิดีโอ YouTube">
          <p className="mb-3 text-[11px] font-semibold text-[#8b87b8]">
            {youtubeVideos.length}/{limits.youtubeMax} คลิป
            {limits.isMonthly
              ? ` · แพ็กเดือน สูงสุด ${limits.youtubeMax}`
              : ` · ฟรีได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} คลิป เกินนี้สมัครรายเดือน`}
          </p>

          {ytEditIdx == null && !canAddYoutube ? (
            <div className="rounded-[1.25rem] border border-amber-200/90 bg-amber-50/90 px-3 py-3 text-sm font-semibold text-amber-950 sm:px-4">
              {limits.isMonthly
                ? `เพิ่มคลิปครบโควต้าแล้ว (${limits.youtubeMax}/${limits.youtubeMax})`
                : `แพ็กฟรีเพิ่มได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} คลิปต่อกิจกรรม — ต้องการหลายวิดีโอให้สมัครรายเดือนโมดูลบริหารชมรม (สูงสุด ${CLUB_EVENT_MONTHLY_YOUTUBE_MAX} คลิป)`}
            </div>
          ) : (
          <div className="space-y-3 rounded-[1.25rem] border border-white/70 bg-white/70 p-3 sm:p-4">
            <div className="flex flex-row items-start justify-between gap-3">
              <p className="text-sm font-black text-[#1e1b4b]">
                {ytEditIdx == null ? "เพิ่มคลิป" : "แก้ไขคลิป"}
              </p>
              {ytEditIdx != null ? (
                <button
                  type="button"
                  className={cn(clubEventOutlineButtonClass, "min-h-9 px-3 text-xs")}
                  onClick={() => {
                    setYtEditIdx(null);
                    setYtForm(newYoutubeDraft());
                    setYtFormErr(null);
                  }}
                >
                  ยกเลิกแก้
                </button>
              ) : null}
            </div>
            {ytFormErr ? <p className="text-sm font-semibold text-rose-600">{ytFormErr}</p> : null}
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ชื่อคลิป</span>
              <input
                className={clubEventFieldClass}
                value={ytForm.title}
                onChange={(e) => setYtForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="เช่น ไฮไลต์งานปีที่แล้ว"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">ลิงก์ YouTube</span>
              <input
                className={clubEventFieldClass}
                value={ytForm.youtubeUrl}
                onChange={(e) => setYtForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4d47b6]">คำอธิบายสั้น (ไม่บังคับ)</span>
              <input
                className={clubEventFieldClass}
                value={ytForm.hint}
                onChange={(e) => setYtForm((f) => ({ ...f, hint: e.target.value }))}
                placeholder="เช่น สรุปผลงานชมรม"
              />
            </label>
            <button
              type="button"
              className={cn(appDashboardBrandCtaPillButtonClass, "min-h-10 w-full sm:w-auto sm:px-4")}
              onClick={() => {
                if (ytEditIdx == null && !canAddYoutube) {
                  const msg = limits.isMonthly
                    ? `เพิ่มได้สูงสุด ${limits.youtubeMax} ลิงก์`
                    : `แพ็กฟรีได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} ลิงก์ — สมัครรายเดือนเพื่อเพิ่มหลายวิดีโอ`;
                  setYtFormErr(msg);
                  notice.error(msg);
                  return;
                }
                saveYoutubeFormLocal();
              }}
            >
              {ytEditIdx == null ? "เพิ่มในรายการ" : "อัปเดตรายการ"}
            </button>
            {ytEditing && ytFormPreviewId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={youtubeThumbUrl(ytFormPreviewId)}
                alt=""
                className="mt-1 h-24 w-auto rounded-lg object-cover"
              />
            ) : null}
          </div>
          )}

          {youtubeVideos.length === 0 ? (
            <AppEmptyState tone="violet" className="mt-3">
              ยังไม่มีคลิป — กรอกชื่อและลิงก์ YouTube ด้านบน แล้วกดเพิ่มในรายการ
            </AppEmptyState>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {youtubeVideos.map((v, i) => {
                const vid = extractYoutubeVideoId(v.youtubeUrl);
                return (
                  <div key={v.id} className="relative">
                    <button
                      type="button"
                      className="group relative block w-full overflow-hidden rounded-xl ring-2 ring-slate-100 transition hover:ring-[#0000BF]/30"
                      aria-label={`เล่น ${v.title}`}
                      title={v.title}
                      onClick={() => ytLb.open(v.youtubeUrl, v.title)}
                    >
                      {vid ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={youtubeThumbUrl(vid)}
                          alt=""
                          className="h-20 w-full object-cover object-center sm:h-24"
                        />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center bg-slate-100 text-[10px] font-semibold text-slate-400 sm:h-24">
                          ไม่มีตัวอย่าง
                        </div>
                      )}
                      <span
                        className="absolute inset-0 flex items-center justify-center bg-[#1e1b4b]/30"
                        aria-hidden
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#4d47b6] shadow-md">
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </span>
                      </span>
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[10px] font-bold text-white">
                        {v.title}
                      </span>
                    </button>
                    <div className="absolute -right-1 -top-1 z-[1] flex gap-0.5">
                      <button
                        type="button"
                        className={cn(
                          assetRowEditIconButtonClass,
                          "!min-h-[32px] !min-w-[32px] rounded-full shadow-sm",
                        )}
                        aria-label={`แก้ไข ${v.title}`}
                        title="แก้ไข"
                        onClick={() => {
                          setYtEditIdx(i);
                          setYtForm({ ...v });
                          setYtFormErr(null);
                        }}
                      >
                        <IconRowEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          assetRowRemoveIconButtonClass,
                          "!min-h-[32px] !min-w-[32px] rounded-full shadow-sm",
                        )}
                        aria-label={`ลบ ${v.title}`}
                        title="ลบ"
                        onClick={() => {
                          setYoutubeVideos((prev) => prev.filter((_, j) => j !== i));
                          if (ytEditIdx === i) {
                            setYtEditIdx(null);
                            setYtForm(newYoutubeDraft());
                          } else if (ytEditIdx != null && ytEditIdx > i) {
                            setYtEditIdx(ytEditIdx - 1);
                          }
                        }}
                      >
                        <IconRowRemove className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  (!activeEventId || !canAddGallery || galleryUploading) && "pointer-events-none opacity-50",
                )}
              >
                <ImagePlus className="h-4 w-4" aria-hidden />
                <span>{galleryUploading ? "กำลังอัปโหลด…" : "เพิ่มรูป"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={!activeEventId || !canAddGallery || galleryUploading}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files?.length) void uploadGalleryFiles(files);
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
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {gallery.map((g) => (
                <div key={g.id} className="relative">
                  <AppImageThumb
                    src={g.imageUrl}
                    alt={g.fileName}
                    onOpen={() => lb.open(g.imageUrl)}
                    className="h-20 w-full sm:h-24"
                  />
                  <button
                    type="button"
                    className={cn(
                      assetRowRemoveIconButtonClass,
                      "absolute -right-1 -top-1 !min-h-[32px] !min-w-[32px] rounded-full shadow-sm",
                    )}
                    aria-label={`ลบรูป ${g.fileName}`}
                    title="ลบรูป"
                    onClick={() => void removeGalleryImage(g.id)}
                  >
                    <IconRowRemove className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ClubEventPageBlock>

        <ClubEventPageBlock
          title="ลิงก์สำรวจ · RSVP · เก็บค่า"
          action={
            activeEventId ? (
              <button
                type="button"
                className={cn(clubEventOutlineButtonClass, "inline-flex items-center gap-1.5")}
                onClick={openCreateLink}
              >
                {links.length > 0 ? (
                  <>
                    <IconRowEdit className="h-4 w-4" aria-hidden />
                    แก้ไขลิงก์
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" aria-hidden />
                    สร้างลิงก์
                  </>
                )}
              </button>
            ) : undefined
          }
        >
          <p className="mb-2 text-[11px] font-semibold text-[#8b87b8]">
            กิจกรรมละ 1 ลิงก์ — สร้างแล้วแก้ของเดิมได้เท่านั้น ไม่สร้างซ้ำ
          </p>
          {!activeEventId ? (
            <AppEmptyState>บันทึกกิจกรรมก่อน แล้วค่อยสร้างลิงก์</AppEmptyState>
          ) : links.length === 0 ? (
            <AppEmptyState>ยังไม่มีลิงก์ของกิจกรรมนี้ — กดสร้างลิงก์</AppEmptyState>
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

      <ClubEventLinkSubmissionsModal
        open={subsOpen}
        onClose={() => setSubsOpen(false)}
        title={subsTitle}
        rows={subsRows}
        fields={subsFields}
      />

      <ClubEventSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        slides={gallery}
        title={title}
      />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปกิจกรรม" />
      <AppYoutubeLightbox
        youtubeUrl={ytLb.youtubeUrl}
        title={ytLb.title}
        onClose={ytLb.close}
      />
    </>
  );
}
