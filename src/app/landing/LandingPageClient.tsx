"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppMobileDockShell,
  AppPublicCheckInGlassPage,
  appDashboardBrandGradientFillClass,
  appMobileDockContentClearanceClass,
  appMobileDockGridClass,
  appMobileDockLinkClass,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { cn } from "@/lib/cn";
import { displayAppModuleTitle } from "@/lib/modules/config";
import {
  LANDING_DAILY_MODULE_SHOWCASE,
  LANDING_FREE_MODULE_SHOWCASE,
  type LandingModuleShowcaseItem,
} from "@/app/landing/landing-module-showcase-data";
import { LANDING_GALLERY, LANDING_GALLERY_URLS } from "@/app/landing/landing-media";
import { buildLandingHeroSlides, LandingHeroSlideMeta, LandingHeroSlideshow } from "@/app/landing/LandingHeroSlideshow";
import { isSafeLandingBannerDisplayUrl } from "@/lib/landing/banner-url";
import { LandingAndroidInstallGuide, LandingMobileInstallHeroCta } from "@/app/landing/LandingAndroidInstallGuide";
import { moduleTryPath, MODULE_TRY_ALL_PATH } from "@/lib/modules/try-link";

function ModuleShowcaseCard({ item, tier }: { item: LandingModuleShowcaseItem; tier: "free" | "daily" }) {
  const title = displayAppModuleTitle(item.slug, item.slug);
  return (
    <li className="h-full">
      <Link
        href={moduleTryPath(item.slug)}
        aria-label={`${title} — ทดลองใช้งาน`}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/55 bg-white/75 shadow-[0_22px_55px_-30px_rgba(30,27,75,0.35)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition duration-500",
          "hover:-translate-y-1 hover:border-[#5b61ff]/30 hover:shadow-[0_28px_64px_-26px_rgba(91,97,255,0.38)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f4ff]",
          "sm:rounded-[1.75rem]",
        )}
      >
        <div className="relative aspect-[16/10] min-h-[6.5rem] w-full overflow-hidden bg-gradient-to-br from-[#ecebff] to-indigo-100/40 sm:min-h-[10rem]">
          <img
            src={item.coverSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 ease-out will-change-transform group-hover:scale-[1.045]"
            loading="lazy"
            decoding="async"
            width={900}
            height={563}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1222]/95 via-[#1e1b4b]/4 to-[#312e81]/15"
            aria-hidden
          />
          <span
            className={cn(
              "absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide shadow-md backdrop-blur-md sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs",
              tier === "free"
                ? "border border-emerald-300/50 bg-emerald-500/90 text-white"
                : "border border-amber-200/60 bg-amber-400/95 text-[#1a0d3a]",
            )}
          >
            {tier === "free" ? "ฟรี" : "1 บาท/วัน"}
          </span>
          <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 sm:p-5">
            <p className="text-pretty text-xs font-black leading-snug text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] sm:text-lg">
              {title}
            </p>
          </div>
        </div>
        <div className="hidden border-t border-white/50 bg-gradient-to-br from-white/90 to-indigo-50/20 px-3 py-2.5 sm:block sm:px-5 sm:py-4">
          <p className="text-pretty text-xs font-semibold leading-relaxed text-[#5f5a8a] sm:text-sm">{item.blurb}</p>
        </div>
      </Link>
    </li>
  );
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0, rootMargin: "0px 0px 8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function landingGalleryTileClass(index: number) {
  if (index === 0) return "col-span-2 min-h-[220px] sm:row-span-2 sm:min-h-[280px]";
  if (index === 1) return "col-span-2 min-h-[140px] sm:min-h-[160px]";
  return "col-span-1 min-h-[140px] sm:min-h-[160px]";
}

const sectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

const trustLogos = [
  { abbr: "ร", name: "ร้านค้าปลีกภาคตะวันออก" },
  { abbr: "ม", name: "มหาวิทยาลัยในเครือข่าย" },
  { abbr: "อ", name: "อาคารพาณิชย์กลางเมือง" },
  { abbr: "ส", name: "สหกรณ์ชุมชนตัวอย่าง" },
  { abbr: "ค", name: "คาร์แคร์ & บริการ" },
  { abbr: "พ", name: "พาร์จอาคารสูง" },
] as const;

const reviews = [
  {
    quote: "ย้ายจากสเปรดชีตมาใช้แดชบอร์ดเดียว ทีมเห็นภาพสินทรัพย์ชัดขึ้นมาก",
    role: "ผู้จัดการฝ่ายปฏิบัติการ",
    org: "องค์กรบริการ",
  },
  {
    quote: "ลูกค้าสแกนคิวเองได้ ลดแอดมิน — ค่าใช้จ่ายระบบถูกกว่าที่คิดมาก",
    role: "เจ้าของร้าน",
    org: "ธุรกิจบริการ",
  },
] as const;

const NAV = [
  { href: "#gallery", label: "ภาพรวม", dock: "ภาพรวม" },
  { href: "#modules", label: "โมดูล", dock: "โมดูล" },
  { href: "#download-app", label: "แอปมือถือ", dock: "แอป" },
  { href: "#contact", label: "ติดต่อ", dock: "ติดต่อ" },
] as const;

function LandingNavIcon({ href, className }: { href: string; className?: string }) {
  const common = className ?? "h-5 w-5";
  if (href === "#gallery") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10.5" r="1.5" />
        <path d="m21 15-4.5-4.5L9 18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href === "#modules") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (href === "#download-app") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M12 17h.01" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M22 16.9v.1A2 2 0 0 1 20 19h-1a8 8 0 0 1-8-8V5a2 2 0 0 1 2-2h.2" strokeLinecap="round" />
      <path d="M14 5h5a2 2 0 0 1 2 2v1" strokeLinecap="round" />
      <path d="M9 14H5a2 2 0 0 0-2 2v1" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPageClient({ bannerUrl }: { bannerUrl?: string | null }) {
  const customBanner = isSafeLandingBannerDisplayUrl(bannerUrl) ? bannerUrl : null;
  const heroSlides = useMemo(() => buildLandingHeroSlides(customBanner), [customBanner]);
  const lb = useAppImageLightbox();
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moduleTab, setModuleTab] = useState<"free" | "daily">("daily");
  const [activeNav, setActiveNav] = useState<(typeof NAV)[number]["href"]>("#gallery");
  const heroCta = useReveal<HTMLDivElement>();
  const galleryBlock = useReveal<HTMLDivElement>();
  const valueBlock = useReveal<HTMLDivElement>();
  const moduleShowcase = useReveal<HTMLDivElement>();
  const logos = useReveal<HTMLDivElement>();
  const features = useReveal<HTMLDivElement>();
  const social = useReveal<HTMLDivElement>();
  const bottomCta = useReveal<HTMLDivElement>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id) setActiveNav(`#${id}` as (typeof NAV)[number]["href"]);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.15, 0.4] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const navLinkClass = scrolled
    ? "rounded-full px-3 py-2 text-xs font-bold text-[#1e1b4b] transition hover:bg-[#5b61ff]/10 sm:text-sm"
    : "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";

  return (
    <AppPublicCheckInGlassPage className={cn("!px-0 !pt-0 sm:!px-0", appMobileDockContentClearanceClass)}>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition duration-300",
          scrolled ? "border-b border-white/50 bg-white/80 shadow-sm backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-white/95 px-3 py-1.5 leading-none shadow-sm ring-1 ring-white/80"
          >
            <MawellLogo size="md" />
          </Link>

          <nav
            className={cn(
              "hidden max-w-full items-center gap-1 overflow-x-auto rounded-full border px-1 py-1 lg:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              scrolled
                ? "border-[#5b61ff]/15 bg-white/70 backdrop-blur-xl"
                : "border-white/40 bg-white/20 backdrop-blur-xl",
            )}
            aria-label="เมนู"
          >
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className={cn(navLinkClass, "shrink-0")}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className={cn(
                "rounded-2xl px-3 py-2 text-sm font-bold transition sm:px-4",
                scrolled ? "text-[#5f5a8a] hover:bg-white hover:text-[#1e1b4b]" : "text-white/95 hover:bg-white/20",
              )}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href={MODULE_TRY_ALL_PATH}
              className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-2 text-sm font-black text-[#1e0f4a] shadow-md ring-2 ring-amber-200/80 transition hover:brightness-105 sm:px-4"
            >
              <span className="sm:hidden">ขอสาธิต</span>
              <span className="hidden sm:inline">ขอสาธิตฟรี</span>
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative isolate overflow-hidden sm:min-h-[80vh]"
        aria-roledescription="carousel"
        aria-label="แบนเนอร์โมดูล"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto sm:min-h-[80vh]">
          <LandingHeroSlideshow
            slides={heroSlides}
            index={heroIndex}
            onIndexChange={setHeroIndex}
            paused={heroPaused || Boolean(lb.src)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/40 via-transparent to-[#1e1b4b]/35 sm:from-[#1e1b4b]/25 sm:via-[#1e1b4b]/5 sm:to-[#faf9ff]/90" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent sm:h-40 sm:from-[#faf9ff] sm:via-[#faf9ff]/70" />
          <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 pb-4 pt-16 sm:px-6 sm:pb-36 sm:pt-24">
            <div className="mx-auto w-full max-w-6xl">
              <h1 className="sr-only">MAWELL</h1>
              <LandingHeroSlideMeta
                slides={heroSlides}
                index={heroIndex}
                onIndexChange={(i) => setHeroIndex(i)}
                onOpen={(i) => lb.openGallery(heroSlides.map((s) => s.src), i)}
                onPausedChange={setHeroPaused}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-6 pt-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:px-6 sm:pb-12 sm:pt-0">
          <div
            id="start"
            ref={heroCta.ref}
            className={cn(
              appPublicCheckInGlassCardClass,
              "grid w-full gap-3 p-4 text-[#1e1b4b] sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:p-5",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-black">เริ่มใช้งานวันนี้</p>
              <p className="mt-0.5 text-xs font-semibold text-[#66638c]">โมดูลฟรีหลายระบบ · 1 บาท/วัน</p>
            </div>
            <Link
              href={MODULE_TRY_ALL_PATH}
              className={cn(
                "landing-cta-primary inline-flex min-h-[52px] items-center justify-center rounded-[1rem] bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-6 text-sm font-black text-[#1a0d3a] shadow-md ring-2 ring-white/90",
                heroCta.visible && "landing-cta-micro",
              )}
            >
              ขอสาธิตฟรี
            </Link>
            <LandingMobileInstallHeroCta />
            <Link
              href="/login"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[1rem] border-2 border-[#5b61ff]/35 bg-white/80 px-6 text-sm font-black text-[#4d47b6] transition hover:border-[#5b61ff]/55 hover:bg-white"
            >
              เริ่มใช้งาน
            </Link>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-16 sm:px-6">
        <section id="gallery" className="scroll-mt-24">
          <div ref={galleryBlock.ref}>
            <h2 className={sectionTitleClass}>ภาพรวม</h2>
          </div>
          <ul
            className={cn(
              "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[minmax(8.5rem,1fr)] sm:gap-4",
              "transition duration-700",
              galleryBlock.visible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            {LANDING_GALLERY.map((item, idx) => (
              <li key={item.src} className={cn("relative", landingGalleryTileClass(idx))}>
                <button
                  type="button"
                  onClick={() => lb.openGallery(LANDING_GALLERY_URLS, idx)}
                  className="group absolute inset-0 block overflow-hidden rounded-[1.25rem] border border-white/60 shadow-sm ring-1 ring-inset ring-white/60"
                  aria-label={`ภาพรวม ${item.label}`}
                >
                  <img
                    src={item.src}
                    alt=""
                    className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.05]"
                    loading={idx < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/75 via-[#1e1b4b]/10 to-transparent opacity-80 transition group-hover:opacity-95"
                    aria-hidden
                  />
                  <span className="absolute inset-x-0 bottom-0 z-10 p-3 text-left text-xs font-black text-white drop-shadow sm:p-4 sm:text-sm">
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section
          ref={valueBlock.ref}
          className={cn(
            "transition duration-700",
            valueBlock.visible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
          )}
        >
          <h2 className={sectionTitleClass}>ทำไมถึงคุ้ม</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                t: "โมดูลใช้งานฟรี",
                d: "หลายระบบไม่หักโทเคนรายวัน — เริ่มใช้งานจริงได้ทันทีหลังเปิดสิทธิ์โมดูล",
              },
              {
                t: "1 บาท/วัน",
                d: "โมดูลกลุ่ม Basic หัก 1 บาทต่อวัน — ใช้ได้ทันที ทุกที่ ทุกเวลา",
              },
              {
                t: "หนึ่งแพลตฟอร์ม",
                d: "ทรัพย์สิน รายรับ–รายจ่าย หอพัก หมู่บ้าน โรงเรียน ร้านค้า บริการ และเอกสาร — ไม่ต้องย้ายข้อมูลหลายที่",
              },
            ].map((x) => (
              <li
                key={x.t}
                className="mawell-card-surface rounded-[1.5rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[2rem] sm:p-8"
              >
                <p className="text-lg font-black text-[#4d47b6]">{x.t}</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#5f5a8a]">{x.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="modules" className="scroll-mt-24">
          <div ref={moduleShowcase.ref}>
            <h2 className={sectionTitleClass}>โมดูล</h2>
          </div>

          <div
            className={cn(
              "mt-6 transition duration-700",
              moduleShowcase.visible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            <div
              className="flex gap-1 overflow-x-auto rounded-2xl border border-indigo-100/90 bg-white/90 p-1 shadow-sm ring-1 ring-indigo-100/60 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="หมวดโมดูล"
            >
              <button
                type="button"
                role="tab"
                aria-selected={moduleTab === "daily"}
                onClick={() => setModuleTab("daily")}
                className={cn(
                  "inline-flex min-h-[40px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:text-sm",
                  moduleTab === "daily"
                    ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md shadow-indigo-400/25")
                    : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
                )}
              >
                1 บาท/วัน
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                    moduleTab === "daily" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {LANDING_DAILY_MODULE_SHOWCASE.length}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={moduleTab === "free"}
                onClick={() => setModuleTab("free")}
                className={cn(
                  "inline-flex min-h-[40px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:text-sm",
                  moduleTab === "free"
                    ? cn(appDashboardBrandGradientFillClass, "text-white shadow-md shadow-indigo-400/25")
                    : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
                )}
              >
                โมดูลฟรี
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                    moduleTab === "free" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {LANDING_FREE_MODULE_SHOWCASE.length}
                </span>
              </button>
            </div>

            {moduleTab === "daily" ? (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {LANDING_DAILY_MODULE_SHOWCASE.map((item) => (
                  <ModuleShowcaseCard key={item.slug} item={item} tier="daily" />
                ))}
              </ul>
            ) : (
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {LANDING_FREE_MODULE_SHOWCASE.map((item) => (
                  <ModuleShowcaseCard key={item.slug} item={item} tier="free" />
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          ref={logos.ref}
          className={cn(
            "transition duration-700",
            logos.visible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
          )}
        >
          <h2 className={sectionTitleClass}>องค์กรที่ไว้วางใจใช้งาน</h2>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {trustLogos.map((logo, i) => (
              <li
                key={logo.abbr}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md transition duration-500 hover:-translate-y-0.5 hover:shadow-md",
                  logos.visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
                )}
                style={{ transitionDelay: logos.visible ? `${i * 75}ms` : "0ms" }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff] to-[#a855f7] text-sm font-black text-white shadow-inner"
                  aria-hidden
                >
                  {logo.abbr}
                </span>
                <span className="max-w-[10rem] text-left text-xs font-bold leading-snug text-[#4d47b6] sm:max-w-[12rem]">
                  {logo.name}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          ref={features.ref}
          className={cn(
            "transition duration-700",
            features.visible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
          )}
        >
          <h2 className={sectionTitleClass}>ฟีเจอร์ที่โฟกัสผลลัพธ์</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "แดชบอร์ดรวม", desc: "เมนูชัด สลับโมดูลเร็ว รองรับมือถือ" },
              { title: "สิทธิ์และความปลอดภัย", desc: "ล็อกอินมาตรฐาน แยกโมดูลตามสิทธิ์" },
              { title: "รายงานและส่งออก", desc: "สรุปยอด กรองช่วงเวลา พร้อมพิมพ์" },
              { title: "ขยายตามร้าน", desc: "เพิ่มโมดูลเมื่อธุรกิจโต ไม่ต้องย้ายระบบ" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-[1.25rem] border border-white/55 bg-white/60 p-5 shadow-sm backdrop-blur-md transition hover:border-[#5b61ff]/25 motion-safe:hover:-translate-y-0.5 sm:p-6"
              >
                <p className="font-black text-[#4d47b6]">{f.title}</p>
                <p className="mt-2 text-sm font-medium text-[#66638c]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="reviews"
          ref={social.ref}
          className={cn(
            "scroll-mt-24 transition duration-700",
            social.visible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
          )}
        >
          <h2 className={sectionTitleClass}>รีวิว</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
            {reviews.map((r) => (
              <blockquote key={r.quote} className="mawell-card-surface relative overflow-hidden rounded-[1.5rem] p-6 sm:rounded-[2rem] sm:p-8">
                <p className="text-lg font-bold leading-relaxed text-[#312e81]">&ldquo;{r.quote}&rdquo;</p>
                <footer className="mt-4 text-sm font-semibold text-[#66638c]">
                  <span className="text-[#4d47b6]">{r.role}</span> · {r.org}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="download-app" className="scroll-mt-24">
          <LandingAndroidInstallGuide variant="section" />
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2 className={sectionTitleClass}>ติดต่อ</h2>
          <div className={cn(appPublicCheckInGlassCardClass, "mt-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6")}>
            <address className="space-y-2 not-italic text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">ห้างหุ้นส่วนจำกัด มาเวล</p>
              <p>เลขประจำตัวผู้เสียภาษี 0103564008119</p>
              <p>เลขที่ 222/285 ม.1 ต.บางคูวัด อ.เมือง จ.ปทุมธานี 12000</p>
            </address>
            <div className="flex flex-wrap content-start gap-2">
              <a
                href="tel:0966646914"
                className="inline-flex min-h-[44px] items-center rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold text-[#4d47b6]"
              >
                โทร. 0966646914
              </a>
              <a
                href="https://line.me/R/ti/p/@mawell"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
              >
                LINE
              </a>
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-white/50 bg-gradient-to-r from-[#5b61ff] via-[#6d5acd] to-[#7c3aed] py-14 text-white sm:py-16">
        <div
          ref={bottomCta.ref}
          className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left"
        >
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">พร้อมลองในองค์กรคุณ</h2>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/85 sm:text-base">
              สมัครใช้งานหรือขอสาธิต — ทีมงานช่วยแนะนำโมดูลที่เหมาะกับธุรกิจคุณ
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:shrink-0">
            <Link
              href={MODULE_TRY_ALL_PATH}
              className={cn(
                "inline-flex min-h-[48px] min-w-[180px] items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-base font-black text-[#1a0d3a] shadow-lg ring-2 ring-white/40 transition hover:brightness-110",
                bottomCta.visible && "landing-cta-micro",
              )}
            >
              ขอสาธิตฟรี
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[48px] min-w-[180px] items-center justify-center rounded-2xl border-2 border-white/70 bg-white/10 px-6 py-3 text-base font-black text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/40 bg-white/40 py-8 text-center text-xs font-semibold text-[#66638c] backdrop-blur-sm sm:text-sm">
        <p>© {new Date().getFullYear()} MAWELL — แพลตฟอร์มธุรกิจ</p>
        <p className="mt-2">
          <Link href="/login" className="text-[#5b61ff] underline-offset-2 hover:underline">
            เข้าสู่ระบบ
          </Link>
          <span className="mx-2 text-[#66638c]/80" aria-hidden>
            ·
          </span>
          <Link href="/login" className="text-[#5b61ff] underline-offset-2 hover:underline">
            สมัครใช้งาน
          </Link>
          <span className="mx-2 text-[#66638c]/80" aria-hidden>
            ·
          </span>
          <Link href="/download-app" className="text-[#5b61ff] underline-offset-2 hover:underline">
            ดาวน์โหลดแอป Android
          </Link>
        </p>
      </footer>

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="ภาพ MAWELL"
      />

      <AppMobileDockShell ariaLabel="เมนูหน้าแรก">
        <ul className={cn(appMobileDockGridClass, "grid-cols-4")}>
          {NAV.map((item) => {
            const active = activeNav === item.href;
            return (
              <li key={item.href} className="min-w-0">
                <a
                  href={item.href}
                  className={appMobileDockLinkClass(active)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  onClick={() => setActiveNav(item.href)}
                >
                  <LandingNavIcon href={item.href} className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                    {item.dock}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </AppMobileDockShell>
    </AppPublicCheckInGlassPage>
  );
}
