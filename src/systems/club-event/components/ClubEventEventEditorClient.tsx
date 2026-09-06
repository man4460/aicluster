"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Link2, MessageSquareText, Play } from "lucide-react";
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
  clubEventEventEditHref,
  clubEventEventHref,
  clubEventEventSubmissionsHref,
} from "@/systems/club-event/club-event-module-nav";
import {
  ClubEventLinkEditorModal,
  clubLinkFormFromDto,
  emptyClubLinkForm,
  type ClubProfileDuesOption,
} from "@/systems/club-event/components/ClubEventLinkEditorModal";
import {
  ClubEventPageSubNav,
  type ClubEventPageSubNavItem,
} from "@/systems/club-event/components/ClubEventPageSubNav";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import { prepareClubEventGalleryWebp } from "@/systems/club-event/lib/gallery-image";
import {
  ClubEventPortalLinkTypeIcon,
  clubEventPortalLinkTypeBadgeClass,
} from "@/systems/club-event/lib/portal-link-icons";
import type {
  ClubEventDynamicLinkDto,
  ClubEventRecordDto,
} from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_DUES_PERIOD_LABELS } from "@/systems/club-event/lib/dues";
import type { ClubEventMediaLimits } from "@/systems/club-event/lib/plan-limits";
import {
  CLUB_EVENT_FREE_GALLERY_MAX,
  CLUB_EVENT_FREE_YOUTUBE_MAX,
  CLUB_EVENT_MONTHLY_GALLERY_MAX,
  CLUB_EVENT_MONTHLY_YOUTUBE_MAX,
} from "@/systems/club-event/lib/plan-limits";
import { ModuleMonthlyUpgradeCta } from "@/components/dashboard/ModuleMonthlyUpgradeCta";
import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";
import {
  clubEventEditorTabIcon,
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
} from "@/systems/club-event/lib/page-menu-icons";
import type { ClubEventYoutubeVideo } from "@/systems/club-event/lib/youtube";
import {
  clubEventFieldClass,
  clubEventGalleryCardGridClass,
  clubEventIconButtonClass,
  clubEventNavDividerClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventRowCardClass,
  clubEventTextareaClass,
  clubEventYoutubeCardGridClass,
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

/** แกลเลอรีในฟอร์มแก้ไข — 8 คอลัมน์ × 2 แถว ต่อหน้า */
const EDITOR_GALLERY_PAGE_COLS = 8;
const EDITOR_GALLERY_PAGE_ROWS = 2;
const EDITOR_GALLERY_PAGE_SIZE = EDITOR_GALLERY_PAGE_COLS * EDITOR_GALLERY_PAGE_ROWS;

type EditorTabKey = "general" | "youtube" | "gallery" | "links";

const EDITOR_TAB_ITEMS: ClubEventPageSubNavItem[] = [
  { key: "general", label: "ทั่วไป", shortLabel: "ทั่วไป", icon: clubEventEditorTabIcon("general") },
  { key: "youtube", label: "ยูทูป", shortLabel: "ยูทูป", icon: clubEventEditorTabIcon("youtube") },
  { key: "gallery", label: "แกลเลอรี", shortLabel: "รูป", icon: clubEventEditorTabIcon("gallery") },
  { key: "links", label: "ลิงก์", shortLabel: "ลิงก์", icon: clubEventEditorTabIcon("links") },
];

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
  const [galleryPage, setGalleryPage] = useState(0);
  const [editorTab, setEditorTab] = useState<EditorTabKey>("general");
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [links, setLinks] = useState<ClubLinkRow[]>([]);
  const [profileDues, setProfileDues] = useState<ClubProfileDuesOption | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState(() => emptyClubLinkForm());

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
          checkInCount: 0,
        },
      ]
    : [];

  const loadLinks = useCallback(async (forEventId: string) => {
    try {
      const [linksRes, profileRes] = await Promise.all([
        fetch("/api/club-event/session/links"),
        fetch("/api/club-event/session/profile"),
      ]);
      const data = (await linksRes.json()) as { links?: ClubLinkRow[]; error?: string };
      if (!linksRes.ok) throw new Error(data.error ?? "โหลดลิงก์ไม่สำเร็จ");
      const all = data.links ?? [];
      setLinks(all.filter((l) => l.config.eventId === forEventId));

      const profileData = (await profileRes.json()) as {
        profile?: {
          duesEnabled?: boolean;
          duesAmountBaht?: number;
          duesPeriod?: keyof typeof CLUB_EVENT_DUES_PERIOD_LABELS;
          duesLinkId?: string | null;
        };
      };
      const p = profileData.profile;
      if (p) {
        const period = p.duesPeriod ?? "YEARLY";
        setProfileDues({
          enabled: Boolean(p.duesEnabled),
          amountBaht: Math.max(0, Math.round(Number(p.duesAmountBaht) || 0)),
          periodLabel: CLUB_EVENT_DUES_PERIOD_LABELS[period] ?? "รายปี",
          linkId: p.duesLinkId ?? null,
        });
      }
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
      setGalleryPage(0);
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
  const galleryPageCount = Math.max(1, Math.ceil(gallery.length / EDITOR_GALLERY_PAGE_SIZE));
  const gallerySlice = useMemo(() => {
    const start = galleryPage * EDITOR_GALLERY_PAGE_SIZE;
    return gallery.slice(start, start + EDITOR_GALLERY_PAGE_SIZE).map((g, i) => ({
      item: g,
      index: start + i,
    }));
  }, [gallery, galleryPage]);

  useEffect(() => {
    setGalleryPage((p) => Math.min(p, Math.max(0, galleryPageCount - 1)));
  }, [galleryPageCount]);

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
        router.replace(clubEventEventEditHref(data.event.id));
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

  if (loading) {
    return (
      <ClubEventPageSubNav
        title="กำหนดการ"
        titleIcon={clubEventPageTitleIcon("eventEdit")}
        titleTone={clubEventPageTitleTone("eventEdit")}
        subtitle="กำลังโหลด…"
      >
        <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
      </ClubEventPageSubNav>
    );
  }

  const pageTitle = isNew && !savedId ? "เพิ่มกิจกรรม" : "แก้ไขกิจกรรม";

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title={pageTitle}
        titleIcon={clubEventPageTitleIcon("eventEdit")}
        titleTone={clubEventPageTitleTone("eventEdit")}
        items={EDITOR_TAB_ITEMS}
        activeKey={editorTab}
        onSelect={(key) => setEditorTab(key as EditorTabKey)}
        ariaLabel="เมนูแก้ไขกิจกรรม"
        mobileSelect={{
          id: "club-event-editor-tab-mobile",
          label: "เลือกหมวด",
        }}
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
            <Link
              href={activeEventId ? clubEventEventHref(activeEventId) : CLUB_EVENT_BASE}
              className={clubEventIconButtonClass}
              aria-label={activeEventId ? "กลับหน้ารายละเอียด" : "กลับแดชบอร์ด"}
              title={activeEventId ? "กลับหน้ารายละเอียด" : "กลับแดชบอร์ด"}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <span className={clubEventNavDividerClass} aria-hidden />
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
        {editorTab === "general" ? (
        <div role="tabpanel" className="space-y-3">
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
        ) : null}

        {editorTab === "youtube" ? (
        <div role="tabpanel">
          <p className="mb-3 text-[11px] font-semibold text-[#8b87b8]">
            {youtubeVideos.length}/{limits.youtubeMax} คลิป
            {limits.isMonthly
              ? ` · แพ็กเดือน สูงสุด ${limits.youtubeMax}`
              : ` · ฟรีได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} คลิป เกินนี้สมัครรายเดือน`}
          </p>

          {ytEditIdx == null && !canAddYoutube ? (
            limits.isMonthly ? (
              <div className="rounded-[1.25rem] border border-amber-200/90 bg-amber-50/90 px-3 py-3 text-sm font-semibold text-amber-950 sm:px-4">
                {`เพิ่มคลิปครบโควต้าแล้ว (${limits.youtubeMax}/${limits.youtubeMax})`}
              </div>
            ) : (
              <ModuleMonthlyUpgradeCta
                moduleSlug={CLUB_EVENT_MODULE_SLUG}
                benefit={`แพ็กฟรีเพิ่มได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} คลิปต่อกิจกรรม — อัปเกรดเพื่อเพิ่มได้สูงสุด ${CLUB_EVENT_MONTHLY_YOUTUBE_MAX} คลิป`}
                onUpgraded={() => {
                  if (isNew) {
                    setLimits({
                      isMonthly: true,
                      youtubeMax: CLUB_EVENT_MONTHLY_YOUTUBE_MAX,
                      galleryMax: CLUB_EVENT_MONTHLY_GALLERY_MAX,
                    });
                  } else {
                    void loadEvent();
                  }
                }}
              />
            )
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
            <div className={cn("mt-3", clubEventYoutubeCardGridClass)}>
              {youtubeVideos.map((v, i) => {
                const vid = extractYoutubeVideoId(v.youtubeUrl);
                return (
                  <div key={v.id} className="relative min-w-0">
                    <button
                      type="button"
                      className="group relative block w-full overflow-hidden rounded-xl ring-2 ring-slate-100 transition hover:ring-[#0000BF]/30"
                      aria-label={`เล่น ${v.title}`}
                      title={v.title}
                      onClick={() => ytLb.open(v.youtubeUrl, v.title)}
                    >
                      <span className="relative block aspect-video w-full">
                        {vid ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={youtubeThumbUrl(vid)}
                            alt=""
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] font-semibold text-slate-400">
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
        </div>
        ) : null}

        {editorTab === "gallery" ? (
        <div role="tabpanel">
          <div className="mb-3 flex flex-row items-start justify-between gap-3">
            <p className="text-[11px] font-semibold text-[#8b87b8]">
              {gallery.length}/{limits.galleryMax} รูป
              {!limits.isMonthly ? ` · ฟรีได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป เกินนี้สมัครรายเดือน` : null}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gallery.length > 0 ? (
                <button
                  type="button"
                  className={cn(clubEventOutlineButtonClass, "inline-flex items-center gap-1.5")}
                  onClick={() => setSlideshowOpen(true)}
                >
                  <Play className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">รับชมสไลด์</span>
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
          </div>
          {!limits.isMonthly && !canAddGallery ? (
            <div className="mb-3">
              <ModuleMonthlyUpgradeCta
                moduleSlug={CLUB_EVENT_MODULE_SLUG}
                benefit={`แพ็กฟรีอัปโหลดได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป — อัปเกรดเพื่อเพิ่มได้สูงสุด ${CLUB_EVENT_MONTHLY_GALLERY_MAX} รูป`}
                onUpgraded={() => {
                  if (isNew) {
                    setLimits({
                      isMonthly: true,
                      youtubeMax: CLUB_EVENT_MONTHLY_YOUTUBE_MAX,
                      galleryMax: CLUB_EVENT_MONTHLY_GALLERY_MAX,
                    });
                  } else {
                    void loadEvent();
                  }
                }}
              />
            </div>
          ) : null}
          {!activeEventId ? (
            <AppEmptyState>บันทึกกิจกรรมก่อน แล้วค่อยอัปโหลดรูป</AppEmptyState>
          ) : gallery.length === 0 ? (
            <AppEmptyState>ยังไม่มีรูป — อัปโหลดรูปกิจกรรม (แปลง WebP อัตโนมัติ)</AppEmptyState>
          ) : (
            <div className="space-y-3">
              <div className={clubEventGalleryCardGridClass}>
                {gallerySlice.map(({ item: g, index }) => (
                  <div key={g.id} className="relative min-w-0">
                    <AppImageThumb
                      src={g.imageUrl}
                      alt={g.fileName}
                      onOpen={() =>
                        lb.openGallery(
                          gallery.map((x) => x.imageUrl),
                          index,
                        )
                      }
                      className="aspect-square h-auto w-full"
                    />
                    <button
                      type="button"
                      className={cn(
                        assetRowRemoveIconButtonClass,
                        "absolute -right-0.5 -top-0.5 !min-h-[28px] !min-w-[28px] rounded-full shadow-sm sm:!min-h-[32px] sm:!min-w-[32px]",
                      )}
                      aria-label={`ลบรูป ${g.fileName}`}
                      title="ลบรูป"
                      onClick={() => void removeGalleryImage(g.id)}
                    >
                      <IconRowRemove className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {galleryPageCount > 1 ? (
                <nav
                  className="flex flex-wrap items-center justify-between gap-2"
                  aria-label="หน้าแกลเลอรี"
                >
                  <p className="text-xs font-semibold text-[#66638c]">
                    หน้า {galleryPage + 1} / {galleryPageCount}
                    <span className="text-slate-400">
                      {" "}
                      · แสดง {gallerySlice.length}/{gallery.length} รูป
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={clubEventOutlineButtonClass}
                      disabled={galleryPage <= 0}
                      aria-label="หน้าก่อนหน้า"
                      onClick={() => setGalleryPage((p) => Math.max(0, p - 1))}
                    >
                      ก่อนหน้า
                    </button>
                    <button
                      type="button"
                      className={cn(
                        galleryPage >= galleryPageCount - 1
                          ? clubEventOutlineButtonClass
                          : clubEventPrimaryButtonClass,
                      )}
                      disabled={galleryPage >= galleryPageCount - 1}
                      aria-label="หน้าถัดไป"
                      onClick={() =>
                        setGalleryPage((p) => Math.min(galleryPageCount - 1, p + 1))
                      }
                    >
                      ถัดไป
                    </button>
                  </div>
                </nav>
              ) : null}
            </div>
          )}
        </div>
        ) : null}

        {editorTab === "links" ? (
        <div role="tabpanel">
          <div className="mb-3 flex flex-row items-start justify-between gap-3">
            <p className="text-[11px] font-semibold text-[#8b87b8]">
              กิจกรรมละ 1 ลิงก์ — สร้างแล้วแก้ของเดิมได้เท่านั้น ไม่สร้างซ้ำ
            </p>
            {activeEventId ? (
              <button
                type="button"
                className={cn(clubEventOutlineButtonClass, "inline-flex shrink-0 items-center gap-1.5")}
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
            ) : null}
          </div>
          {!activeEventId ? (
            <AppEmptyState>บันทึกกิจกรรมก่อน แล้วค่อยสร้างลิงก์</AppEmptyState>
          ) : links.length === 0 ? (
            <AppEmptyState>ยังไม่มีลิงก์ของกิจกรรมนี้ — กดสร้างลิงก์</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id} className={cn(clubEventRowCardClass, "items-start sm:items-center")}>
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
                      clubEventPortalLinkTypeBadgeClass(l.type),
                    )}
                    aria-hidden
                  >
                    <ClubEventPortalLinkTypeIcon type={l.type} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{l.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-[#66638c]">
                      <span className={clubEventPortalLinkTypeBadgeClass(l.type)}>
                        {CLUB_EVENT_LINK_TYPE_LABELS[l.type]}
                      </span>
                      {typeof l.submissionsCount === "number" ? (
                        <span>· คำตอบ {l.submissionsCount}</span>
                      ) : null}
                    </p>
                    <a
                      href={l.publicPath}
                      className="mt-1 inline-block text-xs text-[#0000BF] underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {l.publicPath}
                    </a>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {activeEventId ? (
                      <Link
                        href={clubEventEventSubmissionsHref(activeEventId)}
                        className={cn(
                          clubEventOutlineButtonClass,
                          "min-h-[40px] min-w-[40px] sm:min-w-0 sm:px-2.5",
                        )}
                        aria-label={`คำตอบ ${l.title}`}
                      >
                        <MessageSquareText className="h-4 w-4 sm:hidden" aria-hidden />
                        <span className="hidden sm:inline">คำตอบ</span>
                      </Link>
                    ) : null}
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
        </div>
        ) : null}
      </ClubEventPageSubNav>

      <ClubEventLinkEditorModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        initial={linkForm}
        events={eventAsList}
        lockEventId
        profileDues={profileDues}
        onSaved={() => (activeEventId ? void loadLinks(activeEventId) : undefined)}
      />

      <ClubEventSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        slides={gallery}
        title={title}
      />
      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปกิจกรรม"
      />
      <AppYoutubeLightbox
        youtubeUrl={ytLb.youtubeUrl}
        title={ytLb.title}
        onClose={ytLb.close}
      />
    </>
  );
}
