"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Play, Users } from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import type { ClubCommitteeMember, ClubEventProfileDto, ClubEventRecordDto } from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import { clubEventGlassShellClass, clubEventPanelClass } from "@/systems/club-event/lib/ui-tokens";

type PastEvent = ClubEventRecordDto & {
  galleryPreview: { id: string; imageUrl: string; fileName: string }[];
};

type PublicLink = {
  id: string;
  type: keyof typeof CLUB_EVENT_LINK_TYPE_LABELS;
  title: string;
  publicPath: string;
};

export function ClubEventPublicClient({ slug, trialParam }: { slug: string; trialParam?: string }) {
  const lb = useAppImageLightbox();
  const [profile, setProfile] = useState<ClubEventProfileDto | null>(null);
  const [committee, setCommittee] = useState<ClubCommitteeMember[]>([]);
  const [upcoming, setUpcoming] = useState<ClubEventRecordDto[]>([]);
  const [past, setPast] = useState<PastEvent[]>([]);
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideshowSlides, setSlideshowSlides] = useState<{ id: string; imageUrl: string; fileName?: string }[]>([]);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowTitle, setSlideshowTitle] = useState("");

  useEffect(() => {
    const q = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
    void fetch(`/api/club-event/public/${encodeURIComponent(slug)}${q}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile ?? null);
        setCommittee(data.committee ?? []);
        setUpcoming(data.upcomingEvents ?? []);
        setPast(data.pastEvents ?? []);
        setLinks(data.links ?? []);
      })
      .finally(() => setLoading(false));
  }, [slug, trialParam]);

  const openEventGallery = async (eventId: string, title: string) => {
    const q = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
    const res = await fetch(`/api/club-event/public/${encodeURIComponent(slug)}/events/${eventId}${q}`);
    const data = (await res.json()) as { gallery?: { id: string; imageUrl: string; fileName: string }[] };
    const slides = data.gallery ?? [];
    if (slides.length === 0) return;
    setSlideshowSlides(slides);
    setSlideshowTitle(title);
    setSlideshowOpen(true);
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-[#66638c]">กำลังโหลด…</p>;
  }

  if (!profile) {
    return <AppEmptyState title="ไม่พบชมรม" description="ตรวจสอบลิงก์อีกครั้ง" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 py-6 sm:px-4">
      <header className={cn("p-6 text-center", clubEventGlassShellClass)}>
        {profile.logoUrl ? (
          <img src={profile.logoUrl} alt="" className="mx-auto mb-3 h-20 w-20 rounded-2xl object-cover" />
        ) : null}
        <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">{profile.displayName}</h1>
        {profile.tagline ? <p className="mt-1 text-sm text-[#66638c]">{profile.tagline}</p> : null}
      </header>

      <section className={cn(clubEventPanelClass, "p-4 sm:p-5")}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-[#1e1b4b]">
          <Calendar className="h-5 w-5" aria-hidden />
          กำหนดการ
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[#66638c]">ยังไม่มีกิจกรรมที่กำลังจะมาถึง</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-slate-100 p-3">
                <p className="font-black text-[#1e1b4b]">{ev.title}</p>
                <p className="text-sm text-[#66638c]">{formatBangkokDateTimeLong(ev.eventDate)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cn(clubEventPanelClass, "p-4 sm:p-5")}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-[#1e1b4b]">
          <Users className="h-5 w-5" aria-hidden />
          คณะกรรมการ
        </h2>
        {committee.length === 0 ? (
          <p className="text-sm text-[#66638c]">ยังไม่ได้ตั้งค่ากรรมการ</p>
        ) : (
          <ul className="space-y-2">
            {committee.map((c, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-black text-[#1e1b4b]">{c.name}</p>
                  <p className="text-sm text-[#66638c]">{c.role}</p>
                </div>
                {c.phone ? <p className="text-sm font-semibold text-[#4d47b6]">{c.phone}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cn(clubEventPanelClass, "p-4 sm:p-5")}>
        <h2 className="mb-3 text-lg font-black text-[#1e1b4b]">กิจกรรมย้อนหลัง</h2>
        {past.length === 0 ? (
          <p className="text-sm text-[#66638c]">ยังไม่มีกิจกรรมที่ผ่านมา</p>
        ) : (
          <ul className="space-y-4">
            {past.map((ev) => (
              <li key={ev.id} className="rounded-2xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-[#1e1b4b]">{ev.title}</p>
                    <p className="text-sm text-[#66638c]">{formatBangkokDateTimeLong(ev.eventDate)}</p>
                  </div>
                  {ev.galleryPreview.length > 0 ? (
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-100 px-3 text-xs font-black text-[#0000BF]"
                      onClick={() => void openEventGallery(ev.id, ev.title)}
                    >
                      <Play className="h-4 w-4" aria-hidden />
                      Slideshow
                    </button>
                  ) : null}
                </div>
                {ev.youtubeEmbedUrl ? (
                  <div className="mt-3 aspect-video overflow-hidden rounded-xl">
                    <iframe
                      src={ev.youtubeEmbedUrl}
                      title={ev.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                {ev.galleryPreview.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {ev.galleryPreview.map((g) => (
                      <AppImageThumb key={g.id} src={g.imageUrl} alt={g.fileName} onOpen={() => lb.open(g.imageUrl)} />
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile.rulesMarkdown ? (
        <section className={cn(clubEventPanelClass, "p-4 sm:p-5")}>
          <h2 className="mb-2 text-lg font-black text-[#1e1b4b]">กฎระเบียบ</h2>
          <p className="whitespace-pre-wrap text-sm text-[#1e1b4b]">{profile.rulesMarkdown}</p>
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className={cn(clubEventPanelClass, "p-4 sm:p-5")}>
          <h2 className="mb-3 text-lg font-black text-[#1e1b4b]">ลิงก์ / ฟอร์ม</h2>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={l.publicPath}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 font-semibold text-[#0000BF]"
                >
                  <span>
                    {l.title}{" "}
                    <span className="text-xs text-[#66638c]">({CLUB_EVENT_LINK_TYPE_LABELS[l.type]})</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ClubEventSlideshow open={slideshowOpen} onClose={() => setSlideshowOpen(false)} slides={slideshowSlides} title={slideshowTitle} />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปกิจกรรม" />
    </div>
  );
}
