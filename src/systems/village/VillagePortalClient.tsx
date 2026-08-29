"use client";

import { useEffect, useState } from "react";
import {
  AppImageLightbox,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { DormPortalRemoteImage } from "@/systems/dormitory/components/DormPortalRemoteImage";
import {
  VILLAGE_PORTAL_SAMPLE_BANNER,
  filterLoadablePortalGalleryUrls,
} from "@/systems/village/lib/portal-media";

type PortalInfo = {
  villageLabel: string;
  logoUrl: string | null;
  tagline: string;
  address: string | null;
  contactPhone: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string;
  portalGallery: string[];
  houses: {
    id: number;
    houseNo: string;
    plotLabel: string | null;
    ownerName: string | null;
  }[];
};

const portalNavLinkClass =
  "rounded-full px-3 py-1.5 text-xs font-black text-white/95 transition hover:bg-white/15";

export function VillagePortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const [busy, setBusy] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [info, setInfo] = useState<PortalInfo | null>(null);
  const [galleryReady, setGalleryReady] = useState<string[]>([]);
  const [bannerSrc, setBannerSrc] = useState(VILLAGE_PORTAL_SAMPLE_BANNER);
  const lb = useAppImageLightbox();

  useEffect(() => {
    const qs = new URLSearchParams({ ownerId });
    if (trialSessionId !== "prod") qs.set("t", trialSessionId);
    void fetch(`/api/village/public/portal/info?${qs}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as PortalInfo & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setInfo(j);
        setBannerSrc(j.portalBannerUrl?.trim() || VILLAGE_PORTAL_SAMPLE_BANNER);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, trialSessionId]);

  useEffect(() => {
    if (!info?.portalGallery?.length) {
      setGalleryReady([]);
      return;
    }
    let cancelled = false;
    void filterLoadablePortalGalleryUrls(info.portalGallery).then((urls) => {
      if (!cancelled) setGalleryReady(urls);
    });
    return () => {
      cancelled = true;
    };
  }, [info?.portalGallery]);

  const tel = info?.contactPhone?.replace(/\D/g, "") ?? "";
  const showGalleryNav = galleryReady.length > 0;

  if (busy) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="h-64 animate-pulse rounded-[2rem] bg-white/40" />
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (loadErr || !info) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0">
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-sm font-bold text-rose-700">{loadErr ?? "ไม่พบโครงการ"}</p>
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {info.logoUrl ? (
              <DormPortalRemoteImage
                src={info.logoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/70 shadow-md"
              />
            ) : null}
            <p className="truncate text-sm font-black tracking-tight text-white drop-shadow sm:text-base">
              {info.villageLabel}
            </p>
          </div>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
            aria-label="เมนู"
          >
            <a href="#houses" className={portalNavLinkClass}>
              บ้านในโครงการ
            </a>
            {showGalleryNav ? (
              <a href="#gallery" className={portalNavLinkClass}>
                ภาพโครงการ
              </a>
            ) : null}
            <a href="#contact" className={portalNavLinkClass}>
              ติดต่อ
            </a>
          </nav>
        </div>
      </header>

      <div className="relative min-h-[72vh] sm:min-h-[80vh]">
        <button
          type="button"
          className="absolute inset-0"
          aria-label="ดูแบนเนอร์"
          onClick={() => lb.open(bannerSrc)}
        >
          <DormPortalRemoteImage
            src={bannerSrc}
            alt=""
            className="h-full w-full object-cover object-center"
            loading="eager"
            onFailed={() => setBannerSrc(VILLAGE_PORTAL_SAMPLE_BANNER)}
          />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/25 via-[#1e1b4b]/5 to-[#faf9ff]/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf9ff]" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:min-h-[80vh] sm:px-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/90">หมู่บ้าน / โครงการ</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow sm:text-5xl md:text-6xl">
            {info.villageLabel}
          </h1>
          {info.tagline ? (
            <p className="mt-3 max-w-2xl text-base font-semibold text-white/95 sm:text-lg">{info.tagline}</p>
          ) : null}
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-8 sm:px-6">
        <section id="houses" className={cn(appPublicCheckInGlassCardClass, "scroll-mt-8 p-4 sm:p-6")}>
          <h2 className="text-lg font-black text-[#1e1b4b]">บ้านในโครงการ</h2>
          {info.houses.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-[#66638c]">ยังไม่มีรายการบ้านแสดง</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {info.houses.map((h) => (
                <li
                  key={h.id}
                  className="rounded-[1.25rem] border border-white/60 bg-white/70 p-4 shadow-sm"
                >
                  <p className="text-xl font-black text-[#1e1b4b]">บ้าน {h.houseNo}</p>
                  {h.plotLabel ? (
                    <p className="mt-1 text-xs font-semibold text-[#66638c]">แปลง {h.plotLabel}</p>
                  ) : null}
                  {h.ownerName ? (
                    <p className="mt-2 text-sm font-semibold text-[#4d47b6]">{h.ownerName}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {galleryReady.length > 0 ? (
          <section id="gallery" className={cn(appPublicCheckInGlassCardClass, "scroll-mt-8 p-4 sm:p-6")}>
            <h2 className="text-lg font-black text-[#1e1b4b]">ภาพโครงการ</h2>
            <ul className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6">
              {galleryReady.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => lb.openGallery(galleryReady, idx)}
                    className="block w-full overflow-hidden rounded-[1.25rem] border border-white/60 shadow-sm ring-1 ring-inset ring-white/60"
                    aria-label={`ภาพโครงการ ${idx + 1}`}
                  >
                    <DormPortalRemoteImage
                      src={url}
                      alt=""
                      className="aspect-square w-full object-cover object-center"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="contact" className={cn(appPublicCheckInGlassCardClass, "scroll-mt-8 p-4 sm:p-6")}>
          <h2 className="text-lg font-black text-[#1e1b4b]">ติดต่อนิติบุคคล</h2>
          <div className="mt-4 space-y-2 text-sm font-semibold text-[#66638c]">
            {info.address ? <p className="whitespace-pre-line">{info.address}</p> : null}
            {info.contactPhone ? (
              <p>
                โทร{" "}
                <a href={`tel:${tel}`} className="font-black text-[#4d47b6]">
                  {info.contactPhone}
                </a>
              </p>
            ) : null}
            {info.contactLine ? (
              <p>
                LINE <span className="font-black text-[#4d47b6]">{info.contactLine}</span>
              </p>
            ) : null}
            {info.facebookUrl ? (
              <a
                href={info.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-black text-[#4d47b6] underline-offset-2 hover:underline"
              >
                Facebook
              </a>
            ) : null}
            {info.mapUrl ? (
              <a
                href={info.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-black text-[#4d47b6] underline-offset-2 hover:underline"
              >
                แผนที่
              </a>
            ) : null}
          </div>
          {tel ? (
            <a
              href={`tel:${tel}`}
              className="app-btn-primary mt-5 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold"
            >
              โทรสอบถาม
            </a>
          ) : null}
        </section>
      </main>

      <AppImageLightbox
        src={lb.src}
        sources={lb.sources}
        initialIndex={lb.initialIndex}
        onClose={lb.close}
        alt="ภาพโครงการ"
      />
    </AppPublicCheckInGlassPage>
  );
}
