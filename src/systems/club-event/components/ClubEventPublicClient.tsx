"use client";

import { useCallback, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ClubPublicPortalPayload } from "@/lib/club-event/load-public-portal";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { ClubEventPortalGallery } from "@/systems/club-event/components/ClubEventPortalGallery";
import { ClubEventPortalSection } from "@/systems/club-event/components/ClubEventPortalSection";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import { ClubEventYoutubePlayer } from "@/systems/club-event/components/ClubEventYoutubePlayer";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_PORTAL_SAMPLE_BANNER } from "@/systems/club-event/lib/portal-media";
import {
  clubEventOutlineButtonClass,
  clubEventPortalHeaderNavLinkClass,
  clubEventPortalHeaderNavShellClass,
  clubEventPortalHeroCompactShellClass,
  clubEventPortalPrimaryBtnClass,
  clubEventPortalShopNameClass,
  clubEventPortalShopNameHeroClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventPublicClient({
  slug,
  trialParam,
  initialData,
}: {
  slug: string;
  trialParam?: string;
  initialData: ClubPublicPortalPayload;
}) {
  const lb = useAppImageLightbox();
  const profile = initialData.profile;
  const committee = initialData.committee;
  const upcoming = initialData.upcomingEvents;
  const past = initialData.pastEvents;
  const links = initialData.links;
  const [slideshowSlides, setSlideshowSlides] = useState<{ id: string; imageUrl: string; fileName?: string }[]>([]);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowTitle, setSlideshowTitle] = useState("");

  const title = profile.displayName.trim() || "ชมรม";
  const gallery = profile.portalGallery?.length ? profile.portalGallery : [];
  const banner = profile.portalBannerUrl?.trim() || CLUB_EVENT_PORTAL_SAMPLE_BANNER;

  const linkHref = useCallback(
    (path: string) => (trialParam ? `${path}?t=${encodeURIComponent(trialParam)}` : path),
    [trialParam],
  );

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openEventGallery = async (eventId: string, eventTitle: string) => {
    const q = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
    const res = await fetch(`/api/club-event/public/${encodeURIComponent(slug)}/events/${eventId}${q}`);
    const data = (await res.json().catch(() => ({}))) as {
      gallery?: { id: string; imageUrl: string; fileName: string }[];
    };
    const slides = data.gallery ?? [];
    if (slides.length === 0) return;
    setSlideshowSlides(slides);
    setSlideshowTitle(eventTitle);
    setSlideshowOpen(true);
  };

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : null}
            <p className={cn("truncate text-sm sm:text-base", clubEventPortalShopNameHeroClass)}>{title}</p>
          </div>
          <nav className={clubEventPortalHeaderNavShellClass} aria-label="เมนู">
            <a href="#schedule" className={clubEventPortalHeaderNavLinkClass()} onClick={() => scrollTo("schedule")}>
              กำหนดการ
            </a>
            {links.length > 0 ? (
              <a href="#links" className={clubEventPortalHeaderNavLinkClass()} onClick={() => scrollTo("links")}>
                ลิงก์ / ฟอร์ม
              </a>
            ) : null}
            {committee.length > 0 ? (
              <a href="#committee" className={clubEventPortalHeaderNavLinkClass()} onClick={() => scrollTo("committee")}>
                คณะกรรมการ
              </a>
            ) : null}
            {past.length > 0 ? (
              <a href="#past" className={clubEventPortalHeaderNavLinkClass()} onClick={() => scrollTo("past")}>
                ย้อนหลัง
              </a>
            ) : null}
            {gallery.length > 0 ? (
              <a href="#gallery" className={clubEventPortalHeaderNavLinkClass()} onClick={() => scrollTo("gallery")}>
                แกลเลอรี
              </a>
            ) : null}
            <a href="#contact" className={clubEventPortalHeaderNavLinkClass()} onClick={() => scrollTo("contact")}>
              ติดต่อ
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[56vh] overflow-hidden sm:min-h-[64vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/20 via-transparent to-[#faf9ff]/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/45 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[56vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-24 sm:min-h-[64vh] sm:px-6 sm:pb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 drop-shadow">Club</p>
            <h1 className={cn("mt-2 text-4xl sm:text-5xl", clubEventPortalShopNameHeroClass)}>{title}</h1>
            {profile.tagline ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">{profile.tagline}</p>
            ) : null}
          </div>

          <div id="hero-cta" className={clubEventPortalHeroCompactShellClass}>
            <p className="text-sm font-semibold text-[#5f5a8a] sm:pb-1">
              {upcoming.length > 0
                ? `กิจกรรมถัดไป ${upcoming.length} รายการ`
                : "ดูกำหนดการ ลิงก์ฟอร์ม และติดต่อชมรม"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={clubEventPortalPrimaryBtnClass}
                onClick={() => scrollTo("schedule")}
              >
                ดูกำหนดการ
              </button>
              {links.length > 0 ? (
                <button
                  type="button"
                  className={clubEventOutlineButtonClass}
                  onClick={() => scrollTo("links")}
                >
                  ลิงก์ / ฟอร์ม
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <ClubEventPortalSection id="schedule" title="กำหนดการ">
          {upcoming.length === 0 ? (
            <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีกิจกรรมที่กำลังจะมาถึง</p>
          ) : (
            <ul className="space-y-0 divide-y divide-slate-200/80">
              {upcoming.map((ev) => (
                <li key={ev.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <p className="font-bold text-[#1e1b4b]">{ev.title}</p>
                  <p className="shrink-0 text-sm font-semibold text-[#66638c]">
                    {formatBangkokDateTimeLong(ev.eventDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ClubEventPortalSection>

        {links.length > 0 ? (
          <ClubEventPortalSection id="links" title="ลิงก์ / ฟอร์ม">
            <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={linkHref(l.publicPath)}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 font-semibold text-[#0000BF] shadow-sm transition hover:border-[#5b61ff]/35 hover:bg-slate-50/80"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{l.title}</span>
                      <span className="text-xs font-semibold text-[#66638c]">
                        {CLUB_EVENT_LINK_TYPE_LABELS[l.type]}
                      </span>
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </ClubEventPortalSection>
        ) : null}

        {committee.length > 0 ? (
          <ClubEventPortalSection id="committee" title="คณะกรรมการ">
            <ul className="space-y-0 divide-y divide-slate-200/80">
              {committee.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-bold text-[#1e1b4b]">{c.name}</p>
                    <p className="text-sm font-semibold text-[#66638c]">{c.role}</p>
                  </div>
                  {c.phone ? (
                    <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="shrink-0 text-sm font-bold text-[#4d47b6]">
                      {c.phone}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </ClubEventPortalSection>
        ) : null}

        {past.length > 0 ? (
          <ClubEventPortalSection id="past" title="กิจกรรมย้อนหลัง">
            <ul className="space-y-8">
              {past.map((ev) => (
                <li key={ev.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#1e1b4b]">{ev.title}</p>
                      <p className="text-sm font-semibold text-[#66638c]">
                        {formatBangkokDateTimeLong(ev.eventDate)}
                      </p>
                    </div>
                    {ev.galleryPreview.length > 0 ? (
                      <button
                        type="button"
                        className={cn(clubEventOutlineButtonClass, "gap-1.5")}
                        onClick={() => void openEventGallery(ev.id, ev.title)}
                      >
                        <Play className="h-4 w-4" aria-hidden />
                        Slideshow
                      </button>
                    ) : null}
                  </div>
                  {(ev.youtubeUrls?.length ? ev.youtubeUrls : ev.youtubeEmbedUrl ? [ev.youtubeEmbedUrl] : []).map(
                    (url, i) => (
                      <ClubEventYoutubePlayer
                        key={`${ev.id}-yt-${i}`}
                        youtubeEmbedUrl={url}
                        title={`${ev.title}${ev.youtubeUrls && ev.youtubeUrls.length > 1 ? ` · ${i + 1}` : ""}`}
                      />
                    ),
                  )}
                  {ev.galleryPreview.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {ev.galleryPreview.map((g) => (
                        <AppImageThumb
                          key={g.id}
                          src={g.imageUrl}
                          alt={g.fileName}
                          onOpen={() => lb.open(g.imageUrl)}
                          className="h-28 w-full sm:h-32"
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </ClubEventPortalSection>
        ) : null}

        <ClubEventPortalGallery urls={gallery} onOpenAt={(index) => lb.openGallery(gallery, index)} />

        {profile.rulesMarkdown?.trim() ? (
          <ClubEventPortalSection id="rules" title="กฎระเบียบ">
            <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[#1e1b4b]">
              {profile.rulesMarkdown}
            </p>
          </ClubEventPortalSection>
        ) : null}

        <ClubEventPortalSection id="contact" title="ติดต่อ">
          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-8 sm:space-y-0">
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className={cn("text-lg", clubEventPortalShopNameClass)}>{title}</p>
              {profile.address ? <p>{profile.address}</p> : null}
              {profile.contactPhone ? (
                <p>
                  <a
                    className="font-bold text-[#4d47b6] hover:underline"
                    href={`tel:${profile.contactPhone.replace(/\D/g, "")}`}
                  >
                    {profile.contactPhone}
                  </a>
                </p>
              ) : null}
              {profile.contactLine ? <p>LINE: {profile.contactLine}</p> : null}
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {profile.contactPhone ? (
                <a
                  href={`tel:${profile.contactPhone.replace(/\D/g, "")}`}
                  className={clubEventOutlineButtonClass}
                >
                  โทร
                </a>
              ) : null}
              {profile.contactLine ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(profile.contactLine.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className={clubEventOutlineButtonClass}
                >
                  LINE
                </a>
              ) : null}
              {profile.facebookUrl ? (
                <a href={profile.facebookUrl} target="_blank" rel="noreferrer" className={clubEventOutlineButtonClass}>
                  Facebook
                </a>
              ) : null}
              {profile.mapUrl ? (
                <a href={profile.mapUrl} target="_blank" rel="noreferrer" className={clubEventOutlineButtonClass}>
                  แผนที่
                </a>
              ) : null}
              {!profile.contactPhone &&
              !profile.contactLine &&
              !profile.facebookUrl &&
              !profile.mapUrl &&
              !profile.address ? (
                <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีข้อมูลติดต่อ</p>
              ) : null}
            </div>
          </div>
        </ClubEventPortalSection>
      </main>

      <ClubEventSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        slides={slideshowSlides}
        title={slideshowTitle}
      />
      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        alt="รูปชมรม"
        onClose={lb.close}
      />
    </AppPublicCheckInGlassPage>
  );
}
