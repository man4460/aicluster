"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Play } from "lucide-react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  AppYoutubeLightbox,
  appDashboardHeaderBarClass,
  appDashboardHeaderBarInnerClass,
  appDashboardHeaderIconButtonClass,
  useAppImageLightbox,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { extractYoutubeVideoId, youtubeThumbUrl } from "@/lib/youtube-url";
import type { ClubPublicEventDetailPayload } from "@/lib/club-event/load-public-portal";
import { ClubEventPortalSection } from "@/systems/club-event/components/ClubEventPortalSection";
import {
  ClubEventPortalLinkTypeIcon,
  clubEventPortalLinkCtaClass,
  clubEventPortalLinkTypeAriaLabel,
} from "@/systems/club-event/lib/portal-link-icons";
import type { ClubEventYoutubeVideo } from "@/systems/club-event/lib/youtube";
import {
  clubEventGalleryCardGridClass,
  clubEventPortalPageSubtitleClass,
  clubEventPortalPageTitleClass,
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
  const description = event.description.trim();
  const statusLabel = event.status === "PAST" ? "ย้อนหลัง" : "กำหนดการ";

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

      <header className={appDashboardHeaderBarClass}>
        <div className={cn(appDashboardHeaderBarInnerClass, "justify-between")}>
          <Link
            href={clubHref}
            className="flex min-w-0 max-w-[min(100%,18rem)] items-center gap-2 sm:max-w-xs sm:gap-2.5"
            aria-label={clubTitle}
          >
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/35"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-black text-white ring-2 ring-white/35">
                {(clubTitle || "C").slice(0, 1)}
              </span>
            )}
            <p className="min-w-0 truncate text-sm font-bold tracking-tight text-white sm:text-base">
              {clubTitle}
            </p>
          </Link>

          <Link
            href={clubHref}
            className={cn(
              appDashboardHeaderIconButtonClass,
              "min-w-10 gap-1.5 sm:min-w-0 sm:px-2",
            )}
            aria-label="กลับหน้าชมรม"
            title="กลับหน้าชมรม"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2.25} />
            <span className="hidden text-sm font-bold sm:inline">กลับ</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:space-y-14 sm:px-6 sm:py-10">
        <section className="space-y-4" aria-labelledby="event-title">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#66638c]">{statusLabel}</p>
              <h1 id="event-title" className={clubEventPortalPageTitleClass}>
                {event.title}
              </h1>
              <p className={cn(clubEventPortalPageSubtitleClass, "flex items-center gap-1.5")}>
                <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {formatBangkokDateTimeLong(event.eventDate)}
              </p>
            </div>

            {links.length > 0 ? (
              <ul
                className="flex max-w-[min(100%,11.5rem)] shrink-0 flex-wrap content-start justify-end gap-2 sm:max-w-[min(100%,20rem)] sm:pt-0.5"
                aria-label="ลิงก์กิจกรรม"
              >
                {links.map((l) => {
                  const label = clubEventPortalLinkTypeAriaLabel(l.type, l.title);
                  return (
                    <li key={l.id} className="min-w-0">
                      <Link
                        href={linkHref(l.publicPath)}
                        className={clubEventPortalLinkCtaClass(l.type)}
                        aria-label={label}
                        title={label}
                      >
                        <ClubEventPortalLinkTypeIcon type={l.type} className="h-5 w-5" />
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {description ? (
            <p className="max-w-3xl whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#3f3a6a] sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </section>

        {videos.length > 0 ? (
          <ClubEventPortalSection id="event-youtube" title="วิดีโอ" titleIcon="youtube">
            <ul className={clubEventYoutubeCardGridClass}>
              {videos.map((v) => (
                <PublicYoutubeCard
                  key={v.id}
                  video={v}
                  onPlay={() => ytLb.open(v.youtubeUrl, v.title)}
                />
              ))}
            </ul>
          </ClubEventPortalSection>
        ) : null}

        {gallery.length > 0 ? (
          <ClubEventPortalSection id="event-gallery" title="แกลเลอรี" titleIcon="gallery">
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
          </ClubEventPortalSection>
        ) : null}
      </main>
    </AppPublicCheckInGlassPage>
  );
}
