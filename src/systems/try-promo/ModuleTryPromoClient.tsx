"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AppImageLightbox,
  AppPublicCheckInGlassPage,
  AppYoutubeLightbox,
  appDashboardBrandGradientFillClass,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
  useAppYoutubeLightbox,
  appSafeAreaPortalHeaderClass,
  appSafeAreaPortalHeroTopPadClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { TryPromoVideoPublic } from "@/lib/modules/try-promo";
import {
  getModuleTryPromoCopy,
  type ModuleTryPromoFallbackVideo,
  type ModuleTryPromoFeature,
} from "@/lib/modules/try-promo-page";
import { extractYoutubeVideoId } from "@/lib/youtube-url";

const navLinkClass =
  "rounded-full px-2.5 py-1 text-[11px] font-bold text-white/90 transition hover:bg-white/25 sm:px-3 sm:py-1.5 sm:text-xs";

const tryPromoCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

const videoGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

type Props = {
  moduleTitle: string;
  moduleSlug: string;
  tryHref: string;
  registerHref: string;
  /** รูปปกจาก DB / landing — ทับ default ถ้ามี */
  initialBanner?: string | null;
};

type DisplayVideo = {
  id: string;
  title: string;
  hint: string;
  thumbUrl: string;
  videoId: string | null;
  href: string;
};

function mapFallback(list: ModuleTryPromoFallbackVideo[]): DisplayVideo[] {
  return list.map((v) => ({
    id: v.id,
    title: v.title,
    hint: v.hint,
    thumbUrl: v.thumb,
    videoId: extractYoutubeVideoId(v.href),
    href: v.href,
  }));
}

export function ModuleTryPromoClient({
  moduleTitle,
  moduleSlug,
  tryHref,
  registerHref,
  initialBanner,
}: Props) {
  const copy = useMemo(() => getModuleTryPromoCopy(moduleSlug, moduleTitle), [moduleSlug, moduleTitle]);
  const lb = useAppImageLightbox();
  const ytLb = useAppYoutubeLightbox();
  const [banner, setBanner] = useState(
    () => (initialBanner?.trim() || copy.defaultBanner).trim(),
  );
  const [videos, setVideos] = useState<DisplayVideo[]>(() => mapFallback(copy.fallbackVideos));

  const features: ModuleTryPromoFeature[] = copy.features;
  const fallbackVideos = useMemo(
    () => mapFallback(getModuleTryPromoCopy(moduleSlug, moduleTitle).fallbackVideos),
    [moduleSlug, moduleTitle],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/public/module-try-promo/${encodeURIComponent(moduleSlug)}`);
        const j = (await res.json().catch(() => ({}))) as {
          bannerUrl?: string | null;
          videos?: TryPromoVideoPublic[];
        };
        if (cancelled) return;
        if (!res.ok) {
          setVideos(fallbackVideos);
          return;
        }
        if (j.bannerUrl?.trim()) setBanner(j.bannerUrl.trim());
        const list = j.videos ?? [];
        if (list.length === 0) {
          setVideos(fallbackVideos);
          return;
        }
        setVideos(
          list.map((v) => ({
            id: v.id,
            title: v.title,
            hint: v.hint,
            thumbUrl: v.thumbUrl,
            videoId: v.videoId,
            href: v.watchUrl,
          })),
        );
      } catch {
        if (!cancelled) setVideos(fallbackVideos);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleSlug, fallbackVideos]);

  function onOpenVideo(v: DisplayVideo) {
    const id = v.videoId ?? extractYoutubeVideoId(v.href);
    if (id) {
      ytLb.open(`https://www.youtube.com/watch?v=${id}`, v.title);
    }
  }

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="แบนเนอร์" />
      <AppYoutubeLightbox youtubeUrl={ytLb.youtubeUrl} title={ytLb.title} onClose={ytLb.close} />

      <header className={appSafeAreaPortalHeaderClass}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5 sm:max-w-6xl sm:gap-3 sm:px-6 sm:py-3">
          <p className="truncate text-xs font-black tracking-tight text-white drop-shadow sm:text-sm">
            MAWELL · {moduleTitle}
          </p>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl sm:flex"
            aria-label="เมนูหน้าโฆษณา"
          >
            <a href="#features" className={navLinkClass}>
              ความสามารถ
            </a>
            <a href="#videos" className={navLinkClass}>
              วิดีโอ
            </a>
            <a href="#cta" className={navLinkClass}>
              เริ่มใช้
            </a>
          </nav>
        </div>
      </header>

      {/* ฮีโร่กระชับบนมือถือ — ไม่กินจอทั้งหน้า */}
      <section className="relative isolate overflow-hidden">
        <button
          type="button"
          className="relative block aspect-[16/10] w-full max-h-[42vh] sm:aspect-[21/9] sm:max-h-[min(52vh,420px)]"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/85 via-[#1e1b4b]/35 to-[#1e1b4b]/20" />
        </button>
        <div
          className={cn(
            "relative z-10 -mt-16 px-4 pb-3 sm:-mt-20 sm:px-6 sm:pb-4",
            appSafeAreaPortalHeroTopPadClass,
          )}
        >
          <div className="mx-auto max-w-3xl sm:max-w-6xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 drop-shadow sm:text-xs">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-4xl">
              {moduleTitle}
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs font-semibold leading-snug text-white/95 drop-shadow sm:mt-2 sm:text-base sm:leading-relaxed">
              {copy.tagline}
            </p>
            <div id="cta" className="mt-3 flex gap-2 sm:mt-4 sm:gap-3">
              <Link
                href={tryHref}
                className={cn(tryPromoCtaClass, "min-h-10 flex-1 px-4 text-xs shadow-lg shadow-[#0000BF]/20 sm:min-h-11 sm:flex-none sm:px-6 sm:text-sm")}
              >
                ทดลองใช้งาน
              </Link>
              <Link
                href={registerHref}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-white/70 bg-white/95 px-4 text-xs font-black text-[#4d47b6] shadow-md backdrop-blur sm:min-h-11 sm:flex-none sm:px-6 sm:text-sm"
              >
                สมัครสมาชิก
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-1 sm:max-w-6xl sm:space-y-10 sm:px-6 sm:pb-16 sm:pt-2">
        <section id="features" className="scroll-mt-6">
          <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ฟังก์ชันหลัก</h2>
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-[#66638c] sm:mt-2 sm:max-w-3xl sm:text-sm sm:leading-relaxed">
            {copy.pitch}
          </p>

          {/* รายการแนวโพส — แถวกระชับ ไม่ใช้การ์ดใหญ่ */}
          <ol
            className={cn(
              appPublicCheckInGlassCardClass,
              "mt-3 list-none divide-y divide-[#e8e6fc]/90 rounded-2xl p-0 sm:mt-4 sm:rounded-[1.25rem]",
            )}
          >
            {features.map((f, i) => (
              <li key={`${f.title}-${i}`} className="flex gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#5b61ff]/12 text-[11px] font-black tabular-nums text-[#4d47b6] sm:h-7 sm:w-7 sm:text-xs"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="min-w-0 text-[13px] leading-snug text-[#5f5a8a] sm:text-sm sm:leading-relaxed">
                  <span className="font-black text-[#1e1b4b]">{f.title}</span>
                  <span className="font-semibold text-[#66638c]">: {f.hint}</span>
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/90 px-3 py-2 text-center text-xs font-black text-amber-950 sm:mt-4 sm:text-sm">
            คุ้มค่า — เปิดใช้งานเพียงวันละ 1 บาท
          </p>
        </section>

        <section id="videos" className="scroll-mt-6">
          <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-2xl">วิดีโอเรียนรู้</h2>
          <p className="mt-1 text-xs font-medium text-[#66638c] sm:mt-1.5 sm:text-sm">
            กดการ์ดเพื่อเล่นคลิปบนหน้านี้
          </p>
          {videos.length === 0 ? (
            <div
              className={cn(
                appPublicCheckInGlassCardClass,
                "mt-3 rounded-2xl border border-dashed border-[#cfc9f0]/80 px-4 py-5 text-center sm:mt-4",
              )}
            >
              <p className="text-sm font-bold text-[#5f5a8a]">ยังไม่มีคลิป YouTube</p>
              <p className="mt-1 text-xs font-medium text-[#66638c]">
                แอดมินเพิ่มลิงก์ได้ที่ ศูนย์แอดมิน → ลิงก์ทดลอง → ปุ่มวิดีโอของโมดูล
              </p>
            </div>
          ) : (
            <div className={cn("mt-3", videoGridClass)}>
              {videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onOpenVideo(v)}
                  className="group relative overflow-hidden rounded-xl border border-white/70 bg-white/80 text-left shadow-sm ring-1 ring-inset ring-white/50"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center bg-[#1e1b4b]/25"
                      aria-hidden
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#4d47b6] shadow-lg">
                        <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </div>
                  <div className="space-y-0.5 p-2 sm:p-2.5">
                    <p className="line-clamp-2 text-[11px] font-black leading-snug text-[#1e1b4b] sm:text-xs">
                      {v.title}
                    </p>
                    {v.hint ? (
                      <p className="line-clamp-1 text-[10px] font-medium text-[#66638c]">{v.hint}</p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section
          className={cn(
            appPublicCheckInGlassCardClass,
            "rounded-2xl p-4 text-center sm:rounded-[1.5rem] sm:p-6",
          )}
        >
          <h2 className="text-base font-black text-[#1e1b4b] sm:text-xl">พร้อมทดลองแล้วหรือยัง</h2>
          <p className="mt-1 text-xs font-medium text-[#66638c] sm:mt-1.5 sm:text-sm">
            เข้าแดชบอร์ดจริง หรือสมัครเปิดใช้ {moduleTitle}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:justify-center sm:gap-3">
            <Link href={tryHref} className={cn(tryPromoCtaClass, "min-h-10 px-5 text-xs sm:min-h-11 sm:text-sm")}>
              ทดลองใช้งาน
            </Link>
            <Link
              href={registerHref}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#5b61ff]/30 bg-white px-5 text-xs font-black text-[#4d47b6] sm:min-h-11 sm:text-sm"
            >
              สมัครสมาชิก
            </Link>
          </div>
          <div className="mt-3 space-y-0.5 text-[11px] font-semibold text-[#66638c] sm:mt-4 sm:text-xs">
            <p>
              สอบถาม:{" "}
              <a href="tel:0966646914" className="font-black text-[#4d47b6]">
                096-664-6914
              </a>
              {" · "}
              <a
                href="https://line.me/R/ti/p/@mawell"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-emerald-700"
              >
                LINE @mawell
              </a>
            </p>
          </div>
        </section>
      </main>
    </AppPublicCheckInGlassPage>
  );
}
