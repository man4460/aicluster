"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Images, Pencil, Play, Presentation } from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppYoutubeLightbox,
  useAppImageLightbox,
  useAppNoticePopup,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { extractYoutubeVideoId, youtubeThumbUrl } from "@/lib/youtube-url";
import {
  CLUB_EVENT_BASE,
  clubEventEventEditHref,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageBlock, ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import {
  clubEventCardIconTileClass,
  clubEventTonedRowCardClass,
} from "@/systems/club-event/lib/card-tones";
import type { ClubEventRecordDto } from "@/systems/club-event/lib/mappers";
import {
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
  clubEventSectionBlockIcon,
} from "@/systems/club-event/lib/page-menu-icons";
import type { ClubEventMediaLimits } from "@/systems/club-event/lib/plan-limits";
import { CLUB_EVENT_FREE_YOUTUBE_MAX } from "@/systems/club-event/lib/plan-limits";
import {
  CLUB_EVENT_TRIAL_SAMPLE_YOUTUBE_VIDEOS,
  type ClubEventYoutubeVideo,
} from "@/systems/club-event/lib/youtube";
import {
  clubEventGalleryCardGridClass,
  clubEventIconButtonClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventYoutubeCardGridClass,
} from "@/systems/club-event/lib/ui-tokens";

type GalleryItem = { id: string; imageUrl: string; fileName: string; sortOrder: number };

const defaultLimits: ClubEventMediaLimits = {
  isMonthly: false,
  youtubeMax: CLUB_EVENT_FREE_YOUTUBE_MAX,
  galleryMax: 20,
};

function ClubEventYoutubeVideoCard({
  video,
  sample,
  onPlay,
}: {
  video: ClubEventYoutubeVideo;
  sample?: boolean;
  onPlay: () => void;
}) {
  const vid = video.videoId || extractYoutubeVideoId(video.youtubeUrl) || "";
  return (
    <li className="min-w-0">
      <button
        type="button"
        className="group relative block w-full overflow-hidden rounded-xl bg-slate-100 ring-2 ring-slate-100 transition hover:ring-[#0000BF]/35"
        aria-label={`เล่น ${video.title}`}
        title={video.title}
        onClick={onPlay}
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
            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">
              ไม่มีตัวอย่าง
            </span>
          )}
          <span
            className="absolute inset-0 flex items-center justify-center bg-[#1e1b4b]/35 transition group-hover:bg-[#1e1b4b]/45"
            aria-hidden
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#4d47b6] shadow-md sm:h-10 sm:w-10">
              <Play className="ml-0.5 h-4 w-4 fill-current sm:h-5 sm:w-5" />
            </span>
          </span>
          {sample ? (
            <span className="absolute left-1 top-1 rounded bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
              ตัวอย่าง
            </span>
          ) : null}
          <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[10px] font-bold text-white sm:text-[11px]">
            {video.title}
          </span>
        </span>
      </button>
    </li>
  );
}

export function ClubEventEventDetailClient({ eventId }: { eventId: string }) {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const ytLb = useAppYoutubeLightbox();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<ClubEventRecordDto | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [limits, setLimits] = useState<ClubEventMediaLimits>(defaultLimits);
  const [slideshowOpen, setSlideshowOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/club-event/session/events/${encodeURIComponent(eventId)}`);
      const data = (await res.json()) as {
        event?: ClubEventRecordDto;
        gallery?: GalleryItem[];
        mediaLimits?: ClubEventMediaLimits;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setEvent(data.event ?? null);
      setGallery(data.gallery ?? []);
      if (data.mediaLimits) setLimits(data.mediaLimits);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setEvent(null);
      setGallery([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const realVideos: ClubEventYoutubeVideo[] = event?.youtubeVideos?.length
    ? event.youtubeVideos
    : (event?.youtubeUrls ?? []).map((url, i) => ({
        id: `legacy-${i}`,
        title: event?.title ? `${event.title} · คลิป ${i + 1}` : `คลิป ${i + 1}`,
        hint: "",
        youtubeUrl: url,
        videoId: extractYoutubeVideoId(url) ?? "",
      }));

  const isTrialUser = !limits.isMonthly;
  const showSampleVideos = isTrialUser && realVideos.length === 0;
  const videos = showSampleVideos ? CLUB_EVENT_TRIAL_SAMPLE_YOUTUBE_VIDEOS : realVideos;

  const tone = event?.status === "PAST" ? "slate" : "sky";
  const galleryUrls = gallery.map((g) => g.imageUrl);
  const slideshowSlides = gallery.map((g) => ({
    id: g.id,
    imageUrl: g.imageUrl,
    fileName: g.fileName,
  }));

  return (
    <>
      {notice.popup}
      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="รูปกิจกรรม"
      />
      <AppYoutubeLightbox youtubeUrl={ytLb.youtubeUrl} title={ytLb.title} onClose={ytLb.close} />
      <ClubEventSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        slides={slideshowSlides}
        title={event?.title ? `สไลด์ · ${event.title}` : "สไลด์โชว์"}
      />

      <ClubEventPageSubNav
        title="รายละเอียดกำหนดการ"
        titleIcon={clubEventPageTitleIcon("eventDetail")}
        titleTone={clubEventPageTitleTone("eventDetail")}
        subtitle={event?.title}
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
            <Link
              href={CLUB_EVENT_BASE}
              className={clubEventIconButtonClass}
              aria-label="กลับแดชบอร์ด"
              title="กลับแดชบอร์ด"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            {event ? (
              <Link
                href={clubEventEventEditHref(event.id)}
                className={clubEventPrimaryButtonClass}
                aria-label={`แก้ไข ${event.title}`}
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">แก้ไข</span>
              </Link>
            ) : null}
          </div>
        }
      >
        {loading ? (
          <p className="py-10 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : !event ? (
          <AppEmptyState>
            ไม่พบกิจกรรม —{" "}
            <Link href={CLUB_EVENT_BASE} className="font-semibold text-[#0000BF] underline">
              กลับแดชบอร์ด
            </Link>
          </AppEmptyState>
        ) : (
          <div>
            <ClubEventPageBlock first>
              <div className={cn(clubEventTonedRowCardClass(tone), "sm:items-start")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={clubEventCardIconTileClass(tone, "lg")} aria-hidden>
                    <Calendar className="h-7 w-7" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#66638c]">
                      {event.status === "PAST" ? "ย้อนหลัง" : "กำหนดการ"}
                    </p>
                    <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">{event.title}</h3>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-[#5f5a8a]">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {formatBangkokDateTimeLong(event.eventDate)}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {gallery.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold text-[#5f5a8a] ring-1 ring-slate-200/80">
                          <Images className="h-3.5 w-3.5" aria-hidden />
                          รูป {gallery.length}
                        </span>
                      ) : null}
                      {realVideos.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold text-[#0000BF] ring-1 ring-indigo-100">
                          <Play className="h-3.5 w-3.5" aria-hidden />
                          วิดีโอ {realVideos.length}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Link
                  href={clubEventEventEditHref(event.id)}
                  className={cn(clubEventOutlineButtonClass, "self-end sm:self-start")}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  แก้ไขกิจกรรม
                </Link>
              </div>
            </ClubEventPageBlock>

            <ClubEventPageBlock title="รายละเอียด" titleIcon={clubEventSectionBlockIcon("detail")}>
              {event.description.trim() ? (
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#3f3a6a]">
                  {event.description}
                </p>
              ) : (
                <p className="text-sm text-[#66638c]">ยังไม่มีคำอธิบายกิจกรรม</p>
              )}
            </ClubEventPageBlock>

            <ClubEventPageBlock
              title="วิดีโอ YouTube"
              titleIcon={clubEventSectionBlockIcon("youtube")}
              action={
                videos.length > 0 ? (
                  <span className="text-xs font-semibold text-[#66638c]">
                    {showSampleVideos ? `ตัวอย่าง ${videos.length}` : `${videos.length} คลิป`}
                  </span>
                ) : null
              }
            >
              {videos.length === 0 ? (
                <AppEmptyState>ยังไม่มีวิดีโอ YouTube</AppEmptyState>
              ) : (
                <div className="space-y-3">
                  {showSampleVideos ? (
                    <p className="text-[11px] font-semibold text-[#8b87b8]">
                      บัญชีทดลอง — แสดงคลิปตัวอย่างเพื่อดูเลย์เอาต์ · คลิกเล่นในป๊อปอัป · กดเต็มจอได้ ·
                      เพิ่มคลิปจริงได้จากปุ่มแก้ไข
                    </p>
                  ) : null}
                  <ul className={clubEventYoutubeCardGridClass}>
                    {videos.map((v) => (
                      <ClubEventYoutubeVideoCard
                        key={v.id}
                        video={v}
                        sample={showSampleVideos}
                        onPlay={() => ytLb.open(v.youtubeUrl, v.title)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </ClubEventPageBlock>

            <ClubEventPageBlock
              title="แกลเลอรีรูป"
              titleIcon={clubEventSectionBlockIcon("gallery")}
              action={
                gallery.length > 0 ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      className={cn(clubEventOutlineButtonClass, "inline-flex items-center gap-1.5")}
                      aria-label="รับชมสไลด์"
                      title="รับชมสไลด์"
                      onClick={() => setSlideshowOpen(true)}
                    >
                      <Presentation className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="hidden sm:inline">รับชมสไลด์</span>
                    </button>
                    <span className="text-xs font-semibold text-[#66638c]">{gallery.length} รูป</span>
                  </div>
                ) : null
              }
            >
              {gallery.length === 0 ? (
                <AppEmptyState>ยังไม่มีรูปในแกลเลอรี</AppEmptyState>
              ) : (
                <ul className={clubEventGalleryCardGridClass}>
                  {gallery.map((g, index) => (
                    <li key={g.id} className="min-w-0">
                      <button
                        type="button"
                        className="relative aspect-square w-full overflow-hidden rounded-xl ring-2 ring-slate-100 transition hover:ring-[#0000BF]/30"
                        onClick={() => lb.openGallery(galleryUrls, index)}
                        aria-label={`ดูรูป ${g.fileName || event.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.imageUrl}
                          alt={g.fileName || event.title}
                          className="h-full w-full object-cover object-center"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ClubEventPageBlock>
          </div>
        )}
      </ClubEventPageSubNav>
    </>
  );
}
