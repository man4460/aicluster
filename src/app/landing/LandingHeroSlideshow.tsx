"use client";

import { useEffect, useMemo, useState } from "react";
import { LANDING_HERO_BANNER, LANDING_HERO_SLIDE_INTERVAL_MS, LANDING_HERO_SLIDES, type LandingGalleryItem } from "@/app/landing/landing-media";
import { isSafeLandingBannerDisplayUrl } from "@/lib/landing/banner-url";
import { cn } from "@/lib/cn";

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
}: {
  slides: LandingGalleryItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onOpen: (index: number) => void;
  onPausedChange: (paused: boolean) => void;
}) {
  const current = slides[index];
  const labels = useMemo(() => slides.map((s) => s.label), [slides]);
  if (!current) return null;
  return (
    <div onMouseEnter={() => onPausedChange(true)} onMouseLeave={() => onPausedChange(false)}>
      <button
        type="button"
        className="text-left text-lg font-black text-white drop-shadow sm:text-2xl"
        aria-live="polite"
        onClick={() => onOpen(index)}
      >
        {current.label}
      </button>
      {slides.length < 2 ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-0.5" role="tablist" aria-label="สไลด์โมดูล">
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
