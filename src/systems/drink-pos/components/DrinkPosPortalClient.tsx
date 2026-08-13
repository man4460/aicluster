"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  drinkPosChipActiveClass,
  drinkPosChipIdleClass,
  drinkPosFieldClass,
} from "@/systems/drink-pos/lib/ui-tokens";
import { DrinkPosCustomerOrderClient } from "@/systems/drink-pos/DrinkPosCustomerOrderClient";
import { DrinkPosRemoteImg } from "@/systems/drink-pos/components/DrinkPosRemoteImg";

type PortalReview = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  photoUrls: string[];
  createdAt: string;
};

type PortalInfo = {
  shopName: string;
  tagline: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  openTime: string;
  closeTime: string;
  portalBannerUrl: string | null;
  portalGallery: string[];
  reviews: PortalReview[];
  reviewAvg: number | null;
  reviewCount: number;
};

const SAMPLE_BANNER =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${n} จาก 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden>
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

const portalNavLinkClass =
  "rounded-full px-3 py-2 text-xs font-bold text-white/95 transition hover:bg-white/25 sm:text-sm";

const portalSectionTitleClass = "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";
const portalMutedTextClass = "text-sm font-semibold text-[#66638c]";

export function DrinkPosPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const t = trialSessionId && trialSessionId !== "prod" ? trialSessionId : undefined;
  const [info, setInfo] = useState<PortalInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const [revName, setRevName] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revPhotos, setRevPhotos] = useState<string[]>([]);
  const [revBusy, setRevBusy] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);

  const revGalleryRef = useRef<HTMLInputElement>(null);
  const revCamera = useAppCameraCapture({ title: "ถ่ายรูปรีวิว" });
  const lb = useAppImageLightbox();

  useEffect(() => {
    const q = new URLSearchParams({ ownerId });
    if (t) q.set("t", t);
    setBusy(true);
    void fetch(`/api/drink-pos/public/portal/info?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as PortalInfo & { error?: string };
        if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setInfo(j);
      })
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, t]);

  async function uploadPublicImage(file: File): Promise<string> {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("ownerId", ownerId);
    fd.append("file", prepared);
    const res = await fetch("/api/drink-pos/public/upload-slip", { method: "POST", body: fd });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    if (!res.ok || typeof j?.imageUrl !== "string") {
      throw new Error(j?.error ?? "อัปโหลดไม่สำเร็จ");
    }
    return j.imageUrl;
  }

  async function onSubmitReview(e: FormEvent) {
    e.preventDefault();
    setRevMsg(null);
    setRevBusy(true);
    try {
      const res = await fetch("/api/drink-pos/public/portal/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          t,
          guestName: revName,
          rating: revRating,
          comment: revComment,
          photoUrls: revPhotos,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { review?: PortalReview; error?: string };
      if (!res.ok || !j.review) throw new Error(j.error ?? "ส่งรีวิวไม่สำเร็จ");
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              reviews: [j.review!, ...prev.reviews].slice(0, 40),
              reviewCount: prev.reviewCount + 1,
            }
          : prev,
      );
      setRevName("");
      setRevComment("");
      setRevPhotos([]);
      setRevRating(5);
      setRevMsg("ส่งรีวิวแล้ว");
    } catch (err) {
      setRevMsg(err instanceof Error ? err.message : "ส่งรีวิวไม่สำเร็จ");
    } finally {
      setRevBusy(false);
    }
  }

  if (busy) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-[#66638c]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (loadErr || !info) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm font-semibold text-rose-600">
          {loadErr ?? "ไม่พบร้าน"}
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const banner = info.portalBannerUrl || SAMPLE_BANNER;
  const title = info.shopName.trim() || "ร้านเครื่องดื่ม";

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {revCamera.cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />

      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {info.logoUrl ? (
              <DrinkPosRemoteImg
                src={info.logoUrl}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/70 shadow-md"
              />
            ) : null}
            <p className="truncate text-sm font-black tracking-tight text-white drop-shadow sm:text-base">
              {title}
            </p>
          </div>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
            aria-label="เมนู"
          >
            <a href="#order" className={portalNavLinkClass}>
              สั่ง
            </a>
            <a href="#gallery" className={portalNavLinkClass}>
              แกลเลอรี
            </a>
            <a href="#reviews" className={portalNavLinkClass}>
              รีวิว
            </a>
            <a href="#contact" className={portalNavLinkClass}>
              ติดต่อ
            </a>
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[72vh] overflow-hidden sm:min-h-[80vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          <DrinkPosRemoteImg src={banner} className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/25 via-[#1e1b4b]/5 to-[#faf9ff]/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/70 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-28 sm:min-h-[80vh] sm:px-6 sm:pb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 drop-shadow">
              สั่งเครื่องดื่ม
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
              {title}
            </h1>
            {info.tagline ? (
              <p className="mt-3 text-base font-semibold text-white/90 drop-shadow sm:text-lg">
                {info.tagline}
              </p>
            ) : null}
            {info.reviewCount > 0 && info.reviewAvg != null ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-100 drop-shadow">
                <Stars n={Math.round(info.reviewAvg)} />
                <span>
                  {info.reviewAvg} · {info.reviewCount} รีวิว
                </span>
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-8 flex w-full flex-col gap-3 p-4 text-[#1e1b4b] sm:flex-row sm:items-center sm:justify-between sm:p-5",
            )}
          >
            <p className="text-sm font-semibold text-[#66638c]">
              เปิด {info.openTime}–{info.closeTime}
            </p>
            <a
              href="#order"
              className="app-btn-primary inline-flex h-11 min-h-11 items-center justify-center rounded-[1rem] px-6 text-sm font-black"
            >
              สั่งเลย
            </a>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <section id="order" className="scroll-mt-8">
          <h2 className={portalSectionTitleClass}>สั่งเครื่องดื่ม</h2>
          <div className="mt-6">
            <DrinkPosCustomerOrderClient
              ownerId={ownerId}
              trialSessionId={trialSessionId}
              variant="portal"
            />
          </div>
        </section>

        {info.portalGallery.length > 0 ? (
          <section id="gallery" className="scroll-mt-8">
            <h2 className={portalSectionTitleClass}>แกลเลอรี</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {info.portalGallery.map((url, idx) => (
                <li key={`${url}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => lb.open(url)}
                    className="block w-full overflow-hidden rounded-[1.25rem] border border-white/60 shadow-sm ring-1 ring-inset ring-white/60"
                    aria-label={`แกลเลอรี ${idx + 1}`}
                  >
                    <DrinkPosRemoteImg src={url} className="h-32 w-full object-cover sm:h-40" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="reviews" className="scroll-mt-8">
          <h2 className={portalSectionTitleClass}>รีวิว</h2>
          {info.reviews.length === 0 ? (
            <p className={cn("mt-3", portalMutedTextClass)}>ยังไม่มีรีวิว</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {info.reviews.map((r) => (
                <li key={r.id} className={cn(appPublicCheckInGlassCardClass, "p-4")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#1e1b4b]">{r.guestName}</p>
                    <Stars n={r.rating} />
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c]">{r.comment}</p>
                  {r.photoUrls.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.photoUrls.map((u) => (
                        <AppImageThumb key={u} src={u} alt="รีวิว" onOpen={() => lb.open(u)} />
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <form
            className={cn(appPublicCheckInGlassCardClass, "mt-6 space-y-3 p-4 sm:p-5")}
            onSubmit={(e) => void onSubmitReview(e)}
          >
            <h3 className="text-sm font-black text-[#1e1b4b]">เขียนรีวิว</h3>
            <input
              required
              placeholder="ชื่อ"
              value={revName}
              onChange={(e) => setRevName(e.target.value)}
              className={drinkPosFieldClass}
            />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={revRating === n ? drinkPosChipActiveClass : drinkPosChipIdleClass}
                  onClick={() => setRevRating(n)}
                >
                  ★{n}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              placeholder="ความคิดเห็น"
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              className={cn(drinkPosFieldClass, "min-h-[88px] py-3")}
            />
            <AppGalleryCameraFileInputs
              galleryInputRef={revGalleryRef}
              cameraInputRef={revCamera.cameraInputRef}
              onChange={(e) => {
                const files = e.target.files;
                e.target.value = "";
                if (!files?.length) return;
                void (async () => {
                  const added: string[] = [];
                  for (const file of Array.from(files).slice(0, 5 - revPhotos.length)) {
                    added.push(await uploadPublicImage(file));
                  }
                  setRevPhotos((p) => [...p, ...added].slice(0, 5));
                })().catch((err) => setRevMsg(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"));
              }}
            />
            <AppImagePickCameraButtons
              onPickGallery={() => revGalleryRef.current?.click()}
              onPickCamera={() =>
                revCamera.openCamera(async (file) => {
                  try {
                    const url = await uploadPublicImage(file);
                    setRevPhotos((p) => [...p, url].slice(0, 5));
                  } catch (err) {
                    setRevMsg(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
                  }
                })
              }
            />
            {revPhotos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {revPhotos.map((u) => (
                  <AppImageThumb key={u} src={u} alt="แนบรีวิว" onOpen={() => lb.open(u)} />
                ))}
              </div>
            ) : null}
            {revMsg ? <p className="text-sm font-semibold text-[#4d47b6]">{revMsg}</p> : null}
            <button
              type="submit"
              disabled={revBusy}
              className="app-btn-primary min-h-11 rounded-xl px-5 text-sm font-black disabled:opacity-60"
            >
              ส่งรีวิว
            </button>
          </form>
        </section>

        <section id="contact" className="scroll-mt-8">
          <h2 className={portalSectionTitleClass}>ติดต่อ</h2>
          <div className={cn(appPublicCheckInGlassCardClass, "mt-6 grid gap-4 p-4 sm:grid-cols-2 sm:p-5")}>
            <div className="space-y-2 text-sm font-semibold text-[#66638c]">
              <p className="text-lg font-black text-[#1e1b4b]">{title}</p>
              {info.address ? <p>{info.address}</p> : null}
              {info.contactPhone ? (
                <p>
                  <a className="font-bold text-[#4d47b6] hover:underline" href={`tel:${info.contactPhone}`}>
                    {info.contactPhone}
                  </a>
                </p>
              ) : null}
              <p className="text-[#8b87b8]">
                เปิด {info.openTime}–{info.closeTime}
              </p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {info.contactLine ? (
                <a
                  href={`https://line.me/ti/p/~${encodeURIComponent(info.contactLine.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                >
                  LINE
                </a>
              ) : null}
              {info.facebookUrl ? (
                <a
                  href={info.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
                >
                  Facebook
                </a>
              ) : null}
              {info.mapUrl ? (
                <a
                  href={info.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-white/70 bg-white/80 px-4 text-sm font-bold text-[#4d47b6]"
                >
                  แผนที่
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </AppPublicCheckInGlassPage>
  );
}
