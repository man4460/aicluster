"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LANDING_HERO_BANNER, LANDING_HERO_SLIDE_INTERVAL_MS, LANDING_HERO_SLIDES, type LandingGalleryItem } from "@/app/landing/landing-media";
import { isSafeLandingBannerDisplayUrl } from "@/lib/landing/banner-url";
import { cn } from "@/lib/cn";
import { moduleTryPath } from "@/lib/modules/try-link";

export function buildLandingHeroSlides(bannerUrl: string | null | undefined): LandingGalleryItem[] {
  const custom =
    bannerUrl &&
    isSafeLandingBannerDisplayUrl(bannerUrl) &&
    bannerUrl !== LANDING_HERO_BANNER &&
    !LANDING_HERO_SLIDES.some((s) => s.src === bannerUrl)
      ? [{ label: "MAWELL", src: bannerUrl }]
      : [];
  return [...custom, ...LANDING_HERO_SLIDES];
}

export function LandingHeroSlideshow({
  slides,
  index,
  onIndexChange,
  paused,
}: {
  slides: LandingGalleryItem[];
  index: number;
  onIndexChange: (next: number | ((prev: number) => number)) => void;
  paused: boolean;
}) {
  const n = slides.length;
  const safeIndex = n > 0 ? index % n : 0;
  const current = slides[safeIndex];
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (n < 2 || paused || tabHidden) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const id = window.setInterval(() => {
      onIndexChange((i) => (i + 1) % n);
    }, LANDING_HERO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [n, onIndexChange, paused, tabHidden]);

  useEffect(() => {
    const next = slides[(safeIndex + 1) % n];
    if (!next) return;
    const img = new Image();
    img.src = next.src;
  }, [n, safeIndex, slides]);

  if (!current) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {slides.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out",
            i === safeIndex ? "opacity-100" : "opacity-0",
          )}
          fetchPriority={i === 0 ? "high" : "low"}
          decoding="async"
          aria-hidden={i !== safeIndex}
        />
      ))}
    </div>
  );
}

export function LandingHeroSlideMeta({
  slides,
  index,
  onIndexChange,
  onOpen,
  onPausedChange,
  onBeforeTryNavigate,
}: {
  slides: LandingGalleryItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onOpen: (index: number) => void;
  onPausedChange: (paused: boolean) => void;
  onBeforeTryNavigate?: () => void;
}) {
  const current = slides[index];
  const labels = useMemo(() => slides.map((s) => s.label), [slides]);
  if (!current) return null;
  const tryHref = current.slug ? moduleTryPath(current.slug) : null;
  return (
    <div onMouseEnter={() => onPausedChange(true)} onMouseLeave={() => onPausedChange(false)}>
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        {tryHref ? (
          <Link
            href={tryHref}
            onClick={() => onBeforeTryNavigate?.()}
            className="text-left text-lg font-black text-white drop-shadow transition hover:underline sm:text-2xl"
            aria-live="polite"
            aria-label={`${current.label} — ทดลองใช้งาน`}
          >
            {current.label}
            <span className="mt-0.5 block text-xs font-bold text-white/90 sm:text-sm">ทดลองใช้งาน →</span>
          </Link>
        ) : (
          <button
            type="button"
            className="text-left text-lg font-black text-white drop-shadow sm:text-2xl"
            aria-live="polite"
            onClick={() => onOpen(index)}
          >
            {current.label}
          </button>
        )}
        <button
          type="button"
          className="mb-0.5 inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-white/50 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
          aria-label={`ดูรูป ${current.label}`}
          title="ดูรูปเต็ม"
          onClick={() => onOpen(index)}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {slides.length < 2 ? null : (
        <div className="mt-3 flex max-h-16 flex-wrap items-center gap-0.5 overflow-y-auto sm:max-h-none" role="tablist" aria-label="สไลด์โมดูล">
          {labels.map((label, i) => {
            const active = i === index;
            return (
              <button
                key={`${label}-${i}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={label}
                title={label}
                data-slide-to={String(i)}
                className="inline-flex min-h-8 min-w-8 items-center justify-center"
                onClick={() => onIndexChange(i)}
              >
                <span
                  className={cn("h-2 rounded-full transition", active ? "w-7 bg-white" : "w-2 bg-white/45")}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
