"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Play } from "lucide-react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  AppYoutubeLightbox,
  useAppImageLightbox,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { extractYoutubeVideoId, youtubeThumbUrl } from "@/lib/youtube-url";
import type { ClubPublicEventDetailPayload } from "@/lib/club-event/load-public-portal";
import {
  ClubEventPortalLinkTypeIcon,
  clubEventPortalLinkTileClass,
  clubEventPortalLinkTypeAriaLabel,
} from "@/systems/club-event/lib/portal-link-icons";
import { ClubEventPortalSectionTitleIcon } from "@/systems/club-event/lib/portal-section-icons";
import type { ClubEventYoutubeVideo } from "@/systems/club-event/lib/youtube";
import {
  clubEventGalleryCardGridClass,
  clubEventOutlineButtonClass,
  clubEventPortalPageBodyClass,
  clubEventPortalPageSubtitleClass,
  clubEventPortalPageTitleClass,
  clubEventPortalRulesLinkRowClass,
  clubEventPortalShopNameClass,
  clubEventYoutubeCardGridClass,
} from "@/systems/club-event/lib/ui-tokens";

function PublicYoutubeCard({
  video,
  onPlay,
}: {
  video: ClubEventYoutubeVideo;
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
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#4d47b6] shadow-md">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[10px] font-bold text-white">
            {video.title}
          </span>
        </span>
      </button>
    </li>
  );
}

export function ClubEventPublicEventDetailClient({
  slug,
  trialParam,
  initialData,
}: {
  slug: string;
  trialParam?: string;
  initialData: ClubPublicEventDetailPayload;
}) {
  const lb = useAppImageLightbox();
  const ytLb = useAppYoutubeLightbox();
  const { profile, event, gallery, links } = initialData;

  const clubHref = trialParam
    ? `/club/${encodeURIComponent(slug)}?t=${encodeURIComponent(trialParam)}`
    : `/club/${encodeURIComponent(slug)}`;
  const linkHref = (path: string) =>
    trialParam ? `${path}?t=${encodeURIComponent(trialParam)}` : path;

  const videos: ClubEventYoutubeVideo[] = event.youtubeVideos?.length
    ? event.youtubeVideos
    : (event.youtubeUrls ?? []).map((url, i) => ({
        id: `yt-${i}`,
        title: `คลิป ${i + 1}`,
        hint: "",
        youtubeUrl: url,
        videoId: extractYoutubeVideoId(url) || "",
      }));

  const galleryUrls = gallery.map((g) => g.imageUrl);
  const clubTitle = profile.displayName.trim() || "ชมรม";

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="แกลเลอรีกิจกรรม"
      />
      <AppYoutubeLightbox youtubeUrl={ytLb.youtubeUrl} title={ytLb.title} onClose={ytLb.close} />

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href={clubHref}
              className={cn(clubEventOutlineButtonClass, "min-h-10 min-w-10 shrink-0 px-0")}
              aria-label="กลับหน้าชมรม"
              title="กลับหน้าชมรม"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <div className="flex min-w-0 items-center gap-2">
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <p className={cn("truncate text-sm", clubEventPortalShopNameClass)}>{clubTitle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">
            {event.status === "PAST" ? "ย้อนหลัง" : "กำหนดการ"}
          </p>
          <h1 className={clubEventPortalPageTitleClass}>{event.title}</h1>
          <p className={cn(clubEventPortalPageSubtitleClass, "flex items-center gap-1.5")}>
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatBangkokDateTimeLong(event.eventDate)}
          </p>
          {links.length > 0 ? (
            <ul className={cn(clubEventPortalRulesLinkRowClass, "mt-4")} aria-label="ลิงก์กิจกรรม">
              {links.map((l) => {
                const label = clubEventPortalLinkTypeAriaLabel(l.type, l.title);
                return (
                  <li key={l.id} className="min-w-0">
                    <Link
                      href={linkHref(l.publicPath)}
                      className={clubEventPortalLinkTileClass(l.type)}
                      aria-label={label}
                      title={label}
                    >
                      <ClubEventPortalLinkTypeIcon type={l.type} className="h-5 w-5" />
                      <span className="max-w-[5rem] truncate text-[9px] font-bold leading-tight">{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <section className={clubEventPortalPageBodyClass} aria-labelledby="event-detail-heading">
          <h2
            id="event-detail-heading"
            className="flex items-center gap-2.5 text-base font-black text-[#1e1b4b] sm:gap-3 sm:text-lg"
          >
            <ClubEventPortalSectionTitleIcon name="detail" />
            <span>รายละเอียด</span>
          </h2>
          {event.description.trim() ? (
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#3f3a6a]">
              {event.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[#66638c]">ยังไม่มีคำอธิบายกิจกรรม</p>
          )}
        </section>

        {videos.length > 0 ? (
          <section className="space-y-3" aria-labelledby="event-youtube-heading">
            <h2
              id="event-youtube-heading"
              className="flex items-center gap-2.5 text-base font-black text-[#1e1b4b] sm:gap-3 sm:text-lg"
            >
              <ClubEventPortalSectionTitleIcon name="youtube" />
              <span>วิดีโอ</span>
            </h2>
            <ul className={clubEventYoutubeCardGridClass}>
              {videos.map((v) => (
                <PublicYoutubeCard
                  key={v.id}
                  video={v}
                  onPlay={() => ytLb.open(v.youtubeUrl, v.title)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section className="space-y-3" aria-labelledby="event-gallery-heading">
            <h2
              id="event-gallery-heading"
              className="flex items-center gap-2.5 text-base font-black text-[#1e1b4b] sm:gap-3 sm:text-lg"
            >
              <ClubEventPortalSectionTitleIcon name="gallery" />
              <span>แกลเลอรี</span>
            </h2>
            <ul className={cn(clubEventGalleryCardGridClass, "list-none p-0")}>
              {gallery.map((g, index) => (
                <li key={g.id} className="min-w-0">
                  <AppImageThumb
                    src={g.imageUrl}
                    alt={g.fileName || "รูปกิจกรรม"}
                    className="aspect-square h-auto w-full rounded-xl"
                    onOpen={() => lb.openGallery(galleryUrls, index)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </AppPublicCheckInGlassPage>
  );
}
