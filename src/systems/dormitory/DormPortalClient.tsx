"use client";

import { useEffect, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type PortalInfo = {
  dormLabel: string;
  logoUrl: string | null;
  tagline: string;
  address: string | null;
  caretakerPhone: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string;
  portalGallery: string[];
  rooms: {
    id: number;
    roomNumber: string;
    floor: number;
    roomType: string;
    basePrice: number;
    maxOccupants: number;
    activeTenants: number;
    vacant: boolean;
  }[];
};

export function DormPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const [busy, setBusy] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [info, setInfo] = useState<PortalInfo | null>(null);
  const lb = useAppImageLightbox();

  useEffect(() => {
    const qs = new URLSearchParams({ ownerId });
    if (trialSessionId !== "prod") qs.set("t", trialSessionId);
    void fetch(`/api/dorm/public/portal/info?${qs}`, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as PortalInfo & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setInfo(j);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, trialSessionId]);

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
          <p className="text-sm font-bold text-rose-700">{loadErr ?? "ไม่พบหอพัก"}</p>
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const vacantRooms = info.rooms.filter((r) => r.vacant);
  const tel = info.caretakerPhone?.replace(/\D/g, "") ?? "";

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0">
      <div className="relative min-h-[72vh] sm:min-h-[80vh]">
        <button
          type="button"
          className="absolute inset-0"
          aria-label="ดูแบนเนอร์"
          onClick={() => lb.open(info.portalBannerUrl)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={info.portalBannerUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/25 via-[#1e1b4b]/5 to-[#faf9ff]/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf9ff]" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:min-h-[80vh] sm:px-6">
          {info.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.logoUrl}
              alt=""
              className="absolute left-4 top-4 h-10 w-10 rounded-full object-cover ring-2 ring-white/70 shadow-md sm:left-6"
            />
          ) : null}
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/90">หอพัก</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow sm:text-5xl md:text-6xl">
            {info.dormLabel}
          </h1>
          {info.tagline ? (
            <p className="mt-3 max-w-2xl text-base font-semibold text-white/95 sm:text-lg">{info.tagline}</p>
          ) : null}
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-8 sm:px-6">
        <section id="rooms" className={cn(appPublicCheckInGlassCardClass, "p-4 sm:p-6")}>
          <h2 className="text-lg font-black text-[#1e1b4b]">ห้องว่าง</h2>
          {vacantRooms.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-[#66638c]">ขณะนี้ไม่มีห้องว่าง</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vacantRooms.map((r) => (
                <li
                  key={r.id}
                  className="rounded-[1.25rem] border border-white/60 bg-white/70 p-4 shadow-sm"
                >
                  <p className="text-xl font-black text-[#1e1b4b]">ห้อง {r.roomNumber}</p>
                  <p className="mt-1 text-xs font-semibold text-[#66638c]">
                    ชั้น {r.floor} · {r.roomType} · ว่าง {r.maxOccupants - r.activeTenants} ที่
                  </p>
                  <p className="mt-2 text-sm font-black text-[#4d47b6]">
                    {r.basePrice.toLocaleString("th-TH")} ฿/เดือน
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {info.portalGallery.length > 0 ? (
          <section id="gallery" className={cn(appPublicCheckInGlassCardClass, "p-4 sm:p-6")}>
            <h2 className="text-lg font-black text-[#1e1b4b]">ภาพหอพัก</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-6">
              {info.portalGallery.map((url) => (
                <AppImageThumb
                  key={url}
                  src={url}
                  alt="ภาพหอพัก"
                  className="aspect-square h-auto w-full"
                  onOpen={() => lb.open(url)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section id="contact" className={cn(appPublicCheckInGlassCardClass, "p-4 sm:p-6")}>
          <h2 className="text-lg font-black text-[#1e1b4b]">ติดต่อ</h2>
          <div className="mt-4 space-y-2 text-sm font-semibold text-[#66638c]">
            {info.address ? <p>{info.address}</p> : null}
            {info.caretakerPhone ? (
              <p>
                โทร{" "}
                <a href={`tel:${tel}`} className="font-black text-[#4d47b6]">
                  {info.caretakerPhone}
                </a>
              </p>
            ) : null}
            {info.contactLine ? (
              <p>
                LINE{" "}
                <span className="font-black text-[#4d47b6]">{info.contactLine}</span>
              </p>
            ) : null}
            {info.facebookUrl ? (
              <a href={info.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-black text-[#4d47b6] underline-offset-2 hover:underline">
                Facebook
              </a>
            ) : null}
            {info.mapUrl ? (
              <a href={info.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block font-black text-[#4d47b6] underline-offset-2 hover:underline">
                แผนที่
              </a>
            ) : null}
          </div>
          {tel ? (
            <a
              href={`tel:${tel}`}
              className="app-btn-primary mt-5 inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-bold"
            >
              โทรสอบถาม / จอง
            </a>
          ) : null}
        </section>
      </main>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="ภาพหอพัก" />
    </AppPublicCheckInGlassPage>
  );
}
