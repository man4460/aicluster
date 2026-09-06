"use client";

import { useCallback, useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  AppImageLightbox,
  AppPublicCheckInGlassPage,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ClubPublicPortalPayload } from "@/lib/club-event/load-public-portal";
import { ClubEventCommitteePopup } from "@/systems/club-event/components/ClubEventCommitteePopup";
import {
  ClubEventPortalEventCardGrid,
  ClubEventPortalStandaloneLinks,
} from "@/systems/club-event/components/ClubEventPortalEventCardGrid";
import { ClubEventPortalGallery } from "@/systems/club-event/components/ClubEventPortalGallery";
import { ClubEventPortalMemberSearch } from "@/systems/club-event/components/ClubEventPortalMemberSearch";
import { ClubEventPortalSection } from "@/systems/club-event/components/ClubEventPortalSection";
import { CLUB_EVENT_PORTAL_SAMPLE_BANNER, CLUB_EVENT_PORTAL_GALLERY_MAX } from "@/systems/club-event/lib/portal-media";
import {
  clubEventOutlineButtonClass,
  clubEventPortalHeaderBrandPillClass,
  clubEventPortalHeaderNavOnLightLinkClass,
  clubEventPortalHeaderNavOnLightShellClass,
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
  const standaloneLinks = initialData.standaloneLinks;
  const [committeeOpen, setCommitteeOpen] = useState(false);

  const title = profile.displayName.trim() || "ชมรม";
  const gallery = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (url: string) => {
      const u = url.trim();
      if (!u || seen.has(u)) return;
      seen.add(u);
      out.push(u);
    };
    for (const u of profile.portalGallery ?? []) push(u);
    for (const u of initialData.pastEventGalleryUrls ?? []) push(u);
    return out.slice(0, CLUB_EVENT_PORTAL_GALLERY_MAX);
  }, [profile.portalGallery, initialData.pastEventGalleryUrls]);
  const banner = profile.portalBannerUrl?.trim() || CLUB_EVENT_PORTAL_SAMPLE_BANNER;
  const showCommittee = profile.portalShowCommittee && committee.length > 0;
  const showMembers = Boolean(profile.portalShowMembers);

  const linkHref = useCallback(
    (path: string) => (trialParam ? `${path}?t=${encodeURIComponent(trialParam)}` : path),
    [trialParam],
  );

  const eventHref = useCallback(
    (eventId: string) => {
      const base = `/club/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventId)}`;
      return trialParam ? `${base}?t=${encodeURIComponent(trialParam)}` : base;
    },
    [slug, trialParam],
  );

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className={clubEventPortalHeaderBrandPillClass}>
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0000BF]/10 text-xs font-black text-[#0000BF]">
                {(title || "C").slice(0, 1)}
              </span>
            )}
            <p className={cn("truncate text-sm sm:text-base", clubEventPortalShopNameClass)}>{title}</p>
          </div>
          <nav className={clubEventPortalHeaderNavOnLightShellClass} aria-label="เมนู">
            <a href="#schedule" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={() => scrollTo("schedule")}>
              กำหนดการ
            </a>
            {past.length > 0 ? (
              <a href="#past" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={() => scrollTo("past")}>
                ย้อนหลัง
              </a>
            ) : null}
            {gallery.length > 0 ? (
              <a href="#gallery" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={() => scrollTo("gallery")}>
                แกลเลอรี
              </a>
            ) : null}
            {profile.rulesMarkdown?.trim() || standaloneLinks.length > 0 ? (
              <a href="#rules" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={() => scrollTo("rules")}>
                กฎระเบียบ
              </a>
            ) : null}
            {showCommittee ? (
              <button
                type="button"
                className={clubEventPortalHeaderNavOnLightLinkClass()}
                onClick={() => setCommitteeOpen(true)}
              >
                คณะกรรมการ
              </button>
            ) : null}
            {showMembers ? (
              <a href="#members" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={() => scrollTo("members")}>
                สมาชิก
              </a>
            ) : null}
            <a href="#contact" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={() => scrollTo("contact")}>
              ติดต่อ
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[48vh] overflow-hidden sm:min-h-[56vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-[#faf9ff]/85" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/70 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[48vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-24 sm:min-h-[56vh] sm:px-6 sm:pb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f5a8a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              Club
            </p>
            <h1 className={cn("mt-1 text-3xl sm:text-4xl", clubEventPortalShopNameHeroClass)}>{title}</h1>
            {profile.tagline ? (
              <p className="mt-2 text-sm font-semibold text-[#3f3a6a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] sm:text-base">
                {profile.tagline}
              </p>
            ) : null}
          </div>

          <div id="hero-cta" className={clubEventPortalHeroCompactShellClass}>
            <p className="text-sm font-semibold text-[#5f5a8a] sm:pb-1">
              {upcoming.length > 0
                ? `กิจกรรมถัดไป ${upcoming.length} รายการ`
                : "ดูกำหนดการและติดต่อชมรม"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={clubEventPortalPrimaryBtnClass}
                onClick={() => scrollTo("schedule")}
              >
                ดูกำหนดการ
              </button>
              {showCommittee ? (
                <button
                  type="button"
                  className={cn(clubEventOutlineButtonClass, "inline-flex items-center gap-1.5")}
                  onClick={() => setCommitteeOpen(true)}
                >
                  <Users className="h-4 w-4" aria-hidden />
                  คณะกรรมการ
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <ClubEventPortalSection id="schedule" title="กำหนดการ">
          <ClubEventPortalEventCardGrid
            events={upcoming}
            eventHref={eventHref}
            linkHref={linkHref}
            links={links}
            emptyLabel="ยังไม่มีกิจกรรมที่กำลังจะมาถึง"
            ariaLabel="กำหนดการกิจกรรม"
          />
        </ClubEventPortalSection>

        {past.length > 0 ? (
          <ClubEventPortalSection id="past" title="กิจกรรมย้อนหลัง">
            <ClubEventPortalEventCardGrid
              events={past}
              eventHref={eventHref}
              linkHref={linkHref}
              links={links}
              emptyLabel="ยังไม่มีกิจกรรมย้อนหลัง"
              ariaLabel="กิจกรรมย้อนหลัง"
            />
          </ClubEventPortalSection>
        ) : null}

        <ClubEventPortalGallery urls={gallery} onOpenAt={(index) => lb.openGallery(gallery, index)} />

        {showMembers ? (
          <ClubEventPortalSection
            id="members"
            title="ค้นหาสมาชิก"
            subtitle="พิมพ์ชื่อ ชื่อเล่น หรือรหัสสมาชิก เพื่อค้นหา"
          >
            <ClubEventPortalMemberSearch slug={slug} trialParam={trialParam} />
          </ClubEventPortalSection>
        ) : null}

        {profile.rulesMarkdown?.trim() || standaloneLinks.length > 0 ? (
          <ClubEventPortalSection id="rules" title="กฎระเบียบ">
            {profile.rulesMarkdown?.trim() ? (
              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[#1e1b4b]">
                {profile.rulesMarkdown}
              </p>
            ) : null}
            <ClubEventPortalStandaloneLinks links={standaloneLinks} linkHref={linkHref} />
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

      <ClubEventCommitteePopup
        open={committeeOpen}
        onClose={() => setCommitteeOpen(false)}
        committee={committee}
        clubName={title}
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
