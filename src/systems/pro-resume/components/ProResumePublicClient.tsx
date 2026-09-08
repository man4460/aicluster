"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppYoutubeLightbox,
  appSafeAreaLandingHeaderPadClass,
  useAppImageLightbox,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ProResumePortalSection } from "@/systems/pro-resume/components/ProResumePortalSection";
import { ProResumeRichContent } from "@/systems/pro-resume/components/ProResumeRichContent";
import type { ResumePortfolioItemDto, ResumePublicDto } from "@/systems/pro-resume/lib/mappers";
import {
  proResumePortalContactIcon,
  proResumePortalTabIcon,
  proResumePortalYoutubeIcon,
  proResumeSectionIcon,
  proResumeTimelineKindIcon,
} from "@/systems/pro-resume/lib/page-menu-icons";
import {
  PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_DESKTOP,
  PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_MOBILE,
  PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_TABLET,
  proResumeFilterChipClass,
  proResumeFilterChipShellClass,
  proResumeGlassShellClass,
  proResumeOutlineButtonClass,
  proResumePortalContainerClass,
  proResumePortalDetailBackBtnClass,
  proResumePortalDetailHeaderClass,
  proResumePortalPortfolioGridClass,
  proResumePortalPrimaryBtnClass,
  proResumePortalShopNameHeroClass,
  proResumePortalTabDockDesktopClass,
  proResumePortalTabDockDesktopWrapClass,
  proResumePortalTabDockMobileInnerClass,
  proResumePortalTabDockMobileShellClass,
  proResumePrimaryTabPillClass,
} from "@/systems/pro-resume/lib/ui-tokens";

type PortalTab = "career" | "portfolio";

/** มือถือ 2×2 · ไอแพดแนวตั้ง 3×2 · คอม 4×2 */
function useProResumePortalPortfolioPageSize(): number {
  const [size, setSize] = useState(PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_DESKTOP);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const sync = () => {
      if (mqMobile.matches) setSize(PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_MOBILE);
      else if (mqTablet.matches) setSize(PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_TABLET);
      else setSize(PRO_RESUME_PORTAL_PORTFOLIO_PAGE_SIZE_DESKTOP);
    };
    sync();
    mqMobile.addEventListener("change", sync);
    mqTablet.addEventListener("change", sync);
    return () => {
      mqMobile.removeEventListener("change", sync);
      mqTablet.removeEventListener("change", sync);
    };
  }, []);

  return size;
}

function ProResumePortfolioDetailPage({
  item,
  onBack,
  onOpenImage,
  onOpenYoutube,
}: {
  item: ResumePortfolioItemDto;
  onBack: () => void;
  onOpenImage: (url: string) => void;
  onOpenYoutube: (url: string, title: string) => void;
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [item.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-white to-slate-50 pb-16">
      <header className={cn(proResumePortalDetailHeaderClass, appSafeAreaLandingHeaderPadClass)}>
        <div className={cn(proResumePortalContainerClass, "flex items-center gap-3")}>
          <button
            type="button"
            className={proResumePortalDetailBackBtnClass}
            aria-label="กลับไปหน้ารายการผลงาน"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span>กลับ</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#8b87b8]">รายละเอียดผลงาน</p>
            <h1 className="truncate text-base font-black text-[#1e1b4b] sm:text-lg">{item.title}</h1>
          </div>
        </div>
      </header>

      <main className={cn(proResumePortalContainerClass, "space-y-5 px-4 pt-5 sm:space-y-6 sm:px-6 sm:pt-8")}>
        {item.coverImage ? (
          <button
            type="button"
            className="block w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40"
            aria-label={`ดูรูปปก ${item.title}`}
            onClick={() => onOpenImage(item.coverImage!)}
          >
            <img src={item.coverImage} alt="" className="max-h-[min(70vh,28rem)] w-full object-cover" />
          </button>
        ) : null}

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl">{item.title}</h2>
          {item.shortDesc ? (
            <p className="text-sm font-semibold leading-relaxed text-[#66638c] sm:text-base">{item.shortDesc}</p>
          ) : null}
        </div>

        {item.contentHTML ? <ProResumeRichContent content={item.contentHTML} className="sm:text-base" /> : null}

        {item.youtubeUrl ? (
          <button
            type="button"
            className={proResumePortalPrimaryBtnClass}
            onClick={() => {
              if (item.youtubeUrl) onOpenYoutube(item.youtubeUrl, item.title);
            }}
          >
            {proResumePortalYoutubeIcon()}
            <span>ดูวิดีโอ YouTube</span>
          </button>
        ) : null}

        {item.images.length ? (
          <section className="space-y-2" aria-label="แกลเลอรี">
            <h3 className="text-sm font-black text-[#1e1b4b]">แกลเลอรี</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {item.images.map((url) => (
                <AppImageThumb
                  key={url}
                  src={url}
                  alt=""
                  className="h-20 w-20 sm:h-24 sm:w-24"
                  onOpen={() => onOpenImage(url)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="pt-2">
          <button
            type="button"
            className={cn(proResumePortalDetailBackBtnClass, "w-full sm:w-auto")}
            aria-label="กลับไปหน้ารายการผลงาน"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span>กลับ</span>
          </button>
        </div>
      </main>
    </div>
  );
}

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
  const [portfolioPage, setPortfolioPage] = useState(0);
  const portfolioPageSize = useProResumePortalPortfolioPageSize();

  const hasCareer = data.experiences.length > 0 || data.educations.length > 0 || data.certificates.length > 0;
  const hasPortfolio = data.portfolioItems.length > 0;

  const [tab, setTab] = useState<PortalTab>(() => {
    if (hasCareer) return "career";
    if (hasPortfolio) return "portfolio";
    return "career";
  });

  const viewQuery = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";

  useEffect(() => {
    void fetch(`/api/pro-resume/public/${encodeURIComponent(slug)}/view${viewQuery}`, { method: "POST" }).catch(() => {});
  }, [slug, viewQuery]);

  const filteredItems = useMemo(() => {
    if (filterCat === "all") return data.portfolioItems;
    return data.portfolioItems.filter((i) => i.categoryId === filterCat);
  }, [data.portfolioItems, filterCat]);

  const portfolioPageCount = Math.max(1, Math.ceil(filteredItems.length / portfolioPageSize));

  useEffect(() => {
    setPortfolioPage(0);
  }, [filterCat, portfolioPageSize]);

  useEffect(() => {
    setPortfolioPage((p) => Math.min(p, Math.max(0, portfolioPageCount - 1)));
  }, [portfolioPageCount]);

  const pagedItems = useMemo(() => {
    const start = portfolioPage * portfolioPageSize;
    return filteredItems.slice(start, start + portfolioPageSize);
  }, [filteredItems, portfolioPage, portfolioPageSize]);

  const closeDetail = useCallback(() => {
    setDetailItem(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);

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
  const showTabNav = hasCareer && hasPortfolio;

  const renderTabNav = (idSuffix: string, className: string) =>
    showTabNav ? (
      <nav className={className} role="tablist" aria-label="เมนูเรซูเม่">
        <button
          type="button"
          role="tab"
          id={`resume-tab-career${idSuffix}`}
          aria-selected={tab === "career"}
          aria-controls="resume-panel-career"
          className={proResumePrimaryTabPillClass(tab === "career")}
          onClick={() => setTab("career")}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
            {proResumePortalTabIcon("career")}
          </span>
          <span className="min-w-0 truncate">
            <span className="lg:hidden">ประวัติ</span>
            <span className="hidden lg:inline">ประสบการณ์ / การศึกษา</span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          id={`resume-tab-portfolio${idSuffix}`}
          aria-selected={tab === "portfolio"}
          aria-controls="resume-panel-portfolio"
          className={proResumePrimaryTabPillClass(tab === "portfolio")}
          onClick={() => setTab("portfolio")}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
            {proResumePortalTabIcon("portfolio")}
          </span>
          <span className="min-w-0 truncate">ผลงาน</span>
        </button>
      </nav>
    ) : null;

  if (detailItem) {
    return (
      <>
        <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />
        <AppYoutubeLightbox youtubeUrl={yt.youtubeUrl} title={yt.title} onClose={yt.close} />
        <ProResumePortfolioDetailPage
          item={detailItem}
          onBack={closeDetail}
          onOpenImage={(url) => lb.open(url)}
          onOpenYoutube={(url, title) => yt.open(url, title)}
        />
      </>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-violet-50/80 via-white to-slate-50",
        showTabNav
          ? "pb-[calc(5.75rem+var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px)))] lg:pb-24"
          : "pb-24",
      )}
    >
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />
      <AppYoutubeLightbox youtubeUrl={yt.youtubeUrl} title={yt.title} onClose={yt.close} />

      <header
        className={cn(
          "relative overflow-hidden px-4 pb-8 sm:px-6 sm:pb-10",
          appSafeAreaLandingHeaderPadClass,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(91,97,255,0.12),transparent_55%)]" aria-hidden />
        <div className={cn(proResumeGlassShellClass, proResumePortalContainerClass, "relative p-6 sm:p-10")}>
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative flex w-full max-w-[11rem] flex-col items-center gap-3 sm:w-auto sm:max-w-none sm:items-stretch">
              {profile.profileImageUrl ? (
                <button
                  type="button"
                  className="group relative mx-auto shrink-0 rounded-2xl bg-gradient-to-br from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] p-[2px] shadow-md transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/40 focus-visible:ring-offset-2 sm:mx-0"
                  aria-label={`ดูรูปโปรไฟล์ ${profile.fullName}`}
                  onClick={() => lb.open(profile.profileImageUrl!)}
                >
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.fullName}
                    className="h-28 w-28 rounded-[0.9rem] object-cover ring-2 ring-white transition group-hover:brightness-[0.97] sm:h-32 sm:w-32"
                  />
                </button>
              ) : (
                <div className="mx-auto shrink-0 rounded-2xl bg-gradient-to-br from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] p-[2px] shadow-md sm:mx-0">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[0.9rem] bg-gradient-to-br from-[#5b61ff] to-violet-400 text-3xl font-black text-white ring-2 ring-white sm:h-32 sm:w-32">
                    {profile.fullName.slice(0, 1) || "?"}
                  </div>
                </div>
              )}

              {hasContact ? (
                <div className="w-full space-y-2">
                  <button
                    type="button"
                    className={cn(proResumePortalPrimaryBtnClass, "w-full")}
                    aria-label="ติดต่อ"
                    aria-expanded={contactOpen}
                    onClick={() => setContactOpen((o) => !o)}
                  >
                    {proResumePortalContactIcon()}
                    <span>ติดต่อ</span>
                  </button>
                  {contactOpen ? (
                    <div className="rounded-xl border border-slate-200/90 bg-white/90 p-2.5 text-left shadow-sm">
                      {profile.contactEmail ? (
                        <a
                          href={`mailto:${profile.contactEmail}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-violet-50 sm:text-sm"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="min-w-0 truncate">{profile.contactEmail}</span>
                        </a>
                      ) : null}
                      {profile.contactPhone ? (
                        <a
                          href={`tel:${profile.contactPhone}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-violet-50 sm:text-sm"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="min-w-0 truncate">{profile.contactPhone}</span>
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className={cn(proResumePortalShopNameHeroClass, "text-3xl sm:text-4xl")}>{profile.fullName}</h1>
              {profile.positionTitle ? (
                <p className="mt-1 text-lg font-bold text-[#4d47b6] sm:text-xl">{profile.positionTitle}</p>
              ) : null}
              {profile.bio ? (
                <ProResumeRichContent content={profile.bio} className="mt-3 text-left sm:text-left" />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className={cn(proResumePortalContainerClass, "space-y-6 px-4 sm:space-y-8 sm:px-6")}>
        {showTabNav ? (
          <div className={proResumePortalTabDockDesktopWrapClass}>
            {renderTabNav("", proResumePortalTabDockDesktopClass)}
          </div>
        ) : null}

        {(tab === "career" || !showTabNav) && hasCareer ? (
          <div
            id="resume-panel-career"
            role="tabpanel"
            aria-labelledby={showTabNav ? "resume-tab-career" : undefined}
            className="space-y-6 sm:space-y-8"
          >
            {timeline.length ? (
              <ProResumePortalSection
                title="ประสบการณ์ & การศึกษา"
                subtitle="ไทม์ไลน์แนวตั้ง"
                titleIcon={proResumeSectionIcon("experience")}
                titleTone="violet"
              >
                <ol className="relative space-y-3 border-l-2 border-[#5b61ff]/25 pl-7 sm:space-y-3.5 sm:pl-8">
                  {timeline.map((row, i) => (
                    <li key={`${row.kind}-${i}`} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[2.05rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-lg ring-2 ring-white sm:-left-[2.35rem]",
                          row.kind === "exp"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-sky-100 text-sky-700",
                        )}
                        aria-hidden
                      >
                        {proResumeTimelineKindIcon(row.kind)}
                      </span>
                      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-[#8b87b8] sm:text-xs">{row.range}</p>
                      <h3 className="mt-0.5 text-sm font-black leading-snug text-[#1e1b4b] sm:text-base">{row.title}</h3>
                      <p className="text-xs font-semibold leading-snug text-[#4d47b6] sm:text-sm">{row.subtitle}</p>
                      {row.body ? (
                        <ProResumeRichContent content={row.body} className="mt-1.5" />
                      ) : null}
                    </li>
                  ))}
                </ol>
              </ProResumePortalSection>
            ) : null}

            {data.certificates.length ? (
              <ProResumePortalSection title="ใบรับรอง" titleIcon={proResumeSectionIcon("certificate")} titleTone="emerald">
                <ul className="grid gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3">
                  {data.certificates.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5 rounded-lg border border-slate-200/90 bg-white p-2.5 shadow-sm sm:gap-3 sm:rounded-xl sm:p-3">
                      <AppImageThumb
                        src={c.fileUrl}
                        alt={c.name}
                        emptyLabel="ไม่มีรูป"
                        className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
                        onOpen={() => c.fileUrl && lb.open(c.fileUrl)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold leading-snug text-[#1e1b4b]">{c.name}</p>
                        <p className="mt-0.5 truncate text-xs leading-snug text-[#66638c] sm:text-sm">{c.issuedBy || "—"}</p>
                        {c.year ? <p className="truncate text-[11px] leading-tight text-[#8b87b8] sm:text-xs">{c.year}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </ProResumePortalSection>
            ) : null}
          </div>
        ) : null}

        {(tab === "portfolio" || (!showTabNav && hasPortfolio)) && hasPortfolio ? (
          <div
            id="resume-panel-portfolio"
            role="tabpanel"
            aria-labelledby={showTabNav ? "resume-tab-portfolio" : undefined}
          >
            <ProResumePortalSection title="ผลงาน / พอร์ตโฟลิโอ" titleIcon={proResumeSectionIcon("portfolio")} titleTone="sky">
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
              <div className="space-y-3">
                <ul className={proResumePortalPortfolioGridClass} aria-label="รายการผลงาน">
                  {pagedItems.map((item) => (
                    <li key={item.id} className="min-w-0">
                      <button
                        type="button"
                        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        onClick={() => void openItem(item)}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                          {item.coverImage ? (
                            <img
                              src={item.coverImage}
                              alt=""
                              className="h-full w-full object-cover transition group-hover:scale-105"
                              onError={(e) => {
                                const el = e.currentTarget;
                                el.style.display = "none";
                                const fallback = el.nextElementSibling;
                                if (fallback instanceof HTMLElement) fallback.hidden = false;
                              }}
                            />
                          ) : null}
                          <div
                            className="flex h-full items-center justify-center text-sm font-bold text-slate-400"
                            hidden={Boolean(item.coverImage)}
                          >
                            ไม่มีรูปปก
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
                          <h3 className="truncate text-sm font-black text-[#1e1b4b] sm:text-base">{item.title}</h3>
                          {item.shortDesc ? <p className="mt-1 truncate text-xs text-[#66638c] sm:text-sm">{item.shortDesc}</p> : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {portfolioPageCount > 1 ? (
                  <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="หน้าผลงาน">
                    <p className="text-xs font-semibold text-[#66638c]">
                      หน้า {portfolioPage + 1} / {portfolioPageCount}
                      <span className="text-slate-400"> · {filteredItems.length} รายการ</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={proResumeOutlineButtonClass}
                        disabled={portfolioPage <= 0}
                        aria-label="หน้าก่อนหน้า"
                        onClick={() => setPortfolioPage((p) => Math.max(0, p - 1))}
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        type="button"
                        className={cn(
                          portfolioPage >= portfolioPageCount - 1
                            ? proResumeOutlineButtonClass
                            : proResumePortalPrimaryBtnClass,
                        )}
                        disabled={portfolioPage >= portfolioPageCount - 1}
                        aria-label="หน้าถัดไป"
                        onClick={() => setPortfolioPage((p) => Math.min(portfolioPageCount - 1, p + 1))}
                      >
                        ถัดไป
                      </button>
                    </div>
                  </nav>
                ) : null}
              </div>
            </ProResumePortalSection>
          </div>
        ) : null}
      </main>

      {showTabNav ? (
        <div className={proResumePortalTabDockMobileShellClass}>
          {renderTabNav("-m", proResumePortalTabDockMobileInnerClass)}
        </div>
      ) : null}
    </div>
  );
}
