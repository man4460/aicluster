"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, X } from "lucide-react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppYoutubeLightbox,
  useAppImageLightbox,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { ProResumePortalSection } from "@/systems/pro-resume/components/ProResumePortalSection";
import type { ResumePortfolioItemDto, ResumePublicDto } from "@/systems/pro-resume/lib/mappers";
import {
  proResumeFilterChipClass,
  proResumeFilterChipShellClass,
  proResumeGlassShellClass,
  proResumePortalPrimaryBtnClass,
  proResumePortalShopNameHeroClass,
} from "@/systems/pro-resume/lib/ui-tokens";

export function ProResumePublicClient({
  slug,
  trialParam,
  initialData,
}: {
  slug: string;
  trialParam?: string;
  initialData: ResumePublicDto;
}) {
  const lb = useAppImageLightbox();
  const yt = useAppYoutubeLightbox();
  const [data] = useState(initialData);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [detailItem, setDetailItem] = useState<ResumePortfolioItemDto | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const viewQuery = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";

  useEffect(() => {
    void fetch(`/api/pro-resume/public/${encodeURIComponent(slug)}/view${viewQuery}`, { method: "POST" }).catch(() => {});
  }, [slug, viewQuery]);

  const filteredItems = useMemo(() => {
    if (filterCat === "all") return data.portfolioItems;
    return data.portfolioItems.filter((i) => i.categoryId === filterCat);
  }, [data.portfolioItems, filterCat]);

  const openItem = useCallback(
    async (item: ResumePortfolioItemDto) => {
      setDetailItem(item);
      void fetch(
        `/api/pro-resume/public/${encodeURIComponent(slug)}/portfolio/${encodeURIComponent(item.id)}/click${viewQuery}`,
        { method: "POST" },
      ).catch(() => {});
    },
    [slug, viewQuery],
  );

  const timeline = useMemo(() => {
    const exp = data.experiences.map((e) => ({
      kind: "exp" as const,
      sort: e.startDate || "0000",
      title: e.jobTitle,
      subtitle: e.company,
      range: `${e.startDate || "?"} – ${e.endDate || "ปัจจุบัน"}`,
      body: e.achievements,
    }));
    const edu = data.educations.map((e) => ({
      kind: "edu" as const,
      sort: String(e.startYear ?? 0).padStart(4, "0"),
      title: e.degree,
      subtitle: e.institution,
      range: `${e.startYear ?? "?"} – ${e.endYear ?? "ปัจจุบัน"}`,
      body: e.description,
    }));
    return [...exp, ...edu].sort((a, b) => b.sort.localeCompare(a.sort));
  }, [data.experiences, data.educations]);

  const { profile } = data;
  const hasContact = Boolean(profile.contactEmail || profile.contactPhone);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-white to-slate-50 pb-24">
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />
      <AppYoutubeLightbox youtubeUrl={yt.youtubeUrl} title={yt.title} onClose={yt.close} />

      <header className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(91,97,255,0.12),transparent_55%)]" aria-hidden />
        <div className={cn(proResumeGlassShellClass, "relative mx-auto max-w-4xl p-6 sm:p-10")}>
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.fullName}
                className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-4 ring-white shadow-lg sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-violet-400 text-3xl font-black text-white shadow-lg sm:h-32 sm:w-32">
                {profile.fullName.slice(0, 1) || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className={cn(proResumePortalShopNameHeroClass, "text-3xl sm:text-4xl")}>{profile.fullName}</h1>
              {profile.positionTitle ? (
                <p className="mt-1 text-lg font-bold text-[#4d47b6] sm:text-xl">{profile.positionTitle}</p>
              ) : null}
              {profile.bio ? (
                <p className="mt-3 text-sm leading-relaxed text-[#66638c] sm:text-base">{profile.bio}</p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6">
        {timeline.length ? (
          <ProResumePortalSection title="ประสบการณ์ & การศึกษา" subtitle="ไทม์ไลน์แนวตั้ง">
            <ol className="relative space-y-6 border-l-2 border-[#5b61ff]/25 pl-6">
              {timeline.map((row, i) => (
                <li key={`${row.kind}-${i}`} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[1.65rem] top-1 flex h-3 w-3 rounded-full ring-4 ring-white",
                      row.kind === "exp" ? "bg-violet-500" : "bg-sky-500",
                    )}
                    aria-hidden
                  />
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8b87b8]">{row.range}</p>
                  <h3 className="text-base font-black text-[#1e1b4b]">{row.title}</h3>
                  <p className="text-sm font-semibold text-[#4d47b6]">{row.subtitle}</p>
                  {row.body ? <p className="mt-2 whitespace-pre-wrap text-sm text-[#66638c]">{row.body}</p> : null}
                </li>
              ))}
            </ol>
          </ProResumePortalSection>
        ) : null}

        {data.certificates.length ? (
          <ProResumePortalSection title="ใบรับรอง">
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.certificates.map((c) => (
                <li key={c.id} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                  <p className="font-bold text-[#1e1b4b]">{c.name}</p>
                  <p className="text-sm text-[#66638c]">{c.issuedBy || "—"}</p>
                  {c.year ? <p className="text-xs text-[#8b87b8]">{c.year}</p> : null}
                  {c.fileUrl ? (
                    <button type="button" className="mt-2" onClick={() => lb.open(c.fileUrl!)}>
                      <AppImageThumb src={c.fileUrl} alt={c.name} className="h-16 w-16" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </ProResumePortalSection>
        ) : null}

        {data.portfolioItems.length ? (
          <ProResumePortalSection title="ผลงาน / พอร์ตโฟลิโอ">
            {data.categories.length > 1 ? (
              <nav className={cn(proResumeFilterChipShellClass, "mb-4")} role="tablist" aria-label="หมวดผลงาน">
                <button type="button" role="tab" aria-selected={filterCat === "all"} className={proResumeFilterChipClass(filterCat === "all")} onClick={() => setFilterCat("all")}>
                  ทั้งหมด
                </button>
                {data.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={filterCat === cat.id}
                    className={proResumeFilterChipClass(filterCat === cat.id)}
                    onClick={() => setFilterCat(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            ) : null}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => void openItem(item)}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">ไม่มีรูปปก</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-black text-[#1e1b4b]">{item.title}</h3>
                      {item.shortDesc ? <p className="mt-1 line-clamp-2 text-sm text-[#66638c]">{item.shortDesc}</p> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ProResumePortalSection>
        ) : null}
      </main>

      {hasContact ? (
        <>
          <button
            type="button"
            className={cn(
              proResumePortalPrimaryBtnClass,
              "fixed bottom-6 right-4 z-30 min-w-[3.5rem] rounded-full px-5 py-3 shadow-lg shadow-violet-900/20 sm:right-6",
            )}
            aria-label="ติดต่อ"
            aria-expanded={contactOpen}
            onClick={() => setContactOpen((o) => !o)}
          >
            ติดต่อ
          </button>
          {contactOpen ? (
            <div className="fixed bottom-20 right-4 z-30 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-xl sm:right-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black text-[#1e1b4b]">ช่องทางติดต่อ</p>
                <button type="button" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="ปิด" onClick={() => setContactOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              {profile.contactEmail ? (
                <a href={`mailto:${profile.contactEmail}`} className="flex items-center gap-2 py-2 text-sm font-semibold text-[#4d47b6] hover:underline">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {profile.contactEmail}
                </a>
              ) : null}
              {profile.contactPhone ? (
                <a href={`tel:${profile.contactPhone}`} className="flex items-center gap-2 py-2 text-sm font-semibold text-[#4d47b6] hover:underline">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  {profile.contactPhone}
                </a>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <FormModal open={detailItem !== null} onClose={() => setDetailItem(null)} title={detailItem?.title ?? "รายละเอียด"} size="lg">
        {detailItem ? (
          <div className="space-y-4">
            {detailItem.coverImage ? (
              <img src={detailItem.coverImage} alt="" className="max-h-64 w-full rounded-xl object-cover" />
            ) : null}
            {detailItem.shortDesc ? <p className="text-sm font-semibold text-[#66638c]">{detailItem.shortDesc}</p> : null}
            {detailItem.contentHTML ? (
              <div className="prose prose-sm max-w-none text-[#1e1b4b]" dangerouslySetInnerHTML={{ __html: detailItem.contentHTML }} />
            ) : null}
            {detailItem.youtubeUrl ? (
              <button
                type="button"
                className={proResumePortalPrimaryBtnClass}
                onClick={() => {
                  if (detailItem.youtubeUrl) yt.open(detailItem.youtubeUrl, detailItem.title);
                }}
              >
                ดูวิดีโอ YouTube
              </button>
            ) : null}
            {detailItem.images.length ? (
              <div className="flex flex-wrap gap-2">
                {detailItem.images.map((url) => (
                  <AppImageThumb key={url} src={url} alt="" className="h-20 w-20" onOpen={() => lb.open(url)} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </FormModal>
    </div>
  );
}
