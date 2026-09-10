"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Globe,
  Images,
  Link2,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
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
import { LANDING_HOME_MODULES_HREF, markLandingRestorePending } from "@/lib/landing/landing-visit-state";

const navLinkClass =
  "rounded-full px-2.5 py-1 text-[11px] font-bold text-white/90 transition hover:bg-white/25 sm:px-3 sm:py-1.5 sm:text-xs";

const tryPromoCtaClass = cn(
  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md transition active:scale-[0.99] disabled:opacity-50",
  appDashboardBrandGradientFillClass,
);

const videoGridClass = "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3";

const FEATURE_TONES = [
  { tile: "bg-violet-100 text-violet-700 ring-violet-200/80", border: "border-l-violet-400" },
  { tile: "bg-sky-100 text-sky-700 ring-sky-200/80", border: "border-l-sky-400" },
  { tile: "bg-emerald-100 text-emerald-700 ring-emerald-200/80", border: "border-l-emerald-400" },
  { tile: "bg-amber-100 text-amber-800 ring-amber-200/80", border: "border-l-amber-400" },
  { tile: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200/80", border: "border-l-fuchsia-400" },
  { tile: "bg-rose-100 text-rose-700 ring-rose-200/80", border: "border-l-rose-400" },
] as const;

const FALLBACK_ICONS = [Sparkles, Package, Users, Wallet, Globe, CalendarDays, FileText, Link2] as const;

function featureIcon(title: string, index: number): ReactNode {
  const t = title.toLowerCase();
  const cls = "h-4 w-4";
  const sw = 2.2;
  if (/กำหนด|ตาราง|จอง|คิว|ปฏิทิน|ย้อนหลัง/.test(t)) return <CalendarDays className={cls} strokeWidth={sw} aria-hidden />;
  if (/รายละเอียด|ข้อมูล|เอกสาร|หนังสือ|เรซูเม่|โปรไฟล์/.test(t)) return <FileText className={cls} strokeWidth={sw} aria-hidden />;
  if (/ลงทะเบียน|เช็ค|ลงชื่อ|ตรวจนับ|audit/.test(t)) return <ClipboardCheck className={cls} strokeWidth={sw} aria-hidden />;
  if (/ค่าบำรุง|การเงิน|รายรับ|รายจ่าย|บิล|ชำระ|ฝาก|ถอน|ปันผล/.test(t)) return <Wallet className={cls} strokeWidth={sw} aria-hidden />;
  if (/สมาชิก|ลูกค้า|นักเรียน|พนักงาน|ช่าง|หมอนวด/.test(t)) return <Users className={cls} strokeWidth={sw} aria-hidden />;
  if (/สมัคร|เพิ่มบัญชี|ลูกค้าใหม่/.test(t)) return <UserPlus className={cls} strokeWidth={sw} aria-hidden />;
  if (/โครงสร้าง|กรรมการ|องค์กร|หอ|หมู่บ้าน|อาคาร/.test(t)) return <Building2 className={cls} strokeWidth={sw} aria-hidden />;
  if (/ทรัพย์|สินค้า|คลัง|สต๊อก|แพ็ก|เมนู/.test(t)) return <Package className={cls} strokeWidth={sw} aria-hidden />;
  if (/เว็บ|พอร์ทัล|\/club|\/resume|สาธารณะ/.test(t)) return <Globe className={cls} strokeWidth={sw} aria-hidden />;
  if (/qr|ลิงก์|แชร์/.test(t)) return <QrCode className={cls} strokeWidth={sw} aria-hidden />;
  if (/แกลเลอรี|รูป|สื่อ|ภาพ/.test(t)) return <Images className={cls} strokeWidth={sw} aria-hidden />;
  if (/ตั้งค่า|ระบบ/.test(t)) return <Settings className={cls} strokeWidth={sw} aria-hidden />;
  if (/ออเดอร์|ขาย|pos|หน้าร้าน/.test(t)) return <ShoppingBag className={cls} strokeWidth={sw} aria-hidden />;
  if (/เงิน|ยอด|ราคา/.test(t)) return <Banknote className={cls} strokeWidth={sw} aria-hidden />;
  if (/ลิงก์|เชื่อม/.test(t)) return <Link2 className={cls} strokeWidth={sw} aria-hidden />;
  const Icon = FALLBACK_ICONS[index % FALLBACK_ICONS.length]!;
  return <Icon className={cls} strokeWidth={sw} aria-hidden />;
}

function shortenHint(hint: string, max = 42): string {
  const t = hint.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

type Props = {
  moduleTitle: string;
  moduleSlug: string;
  tryHref: string;
  registerHref: string;
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href={LANDING_HOME_MODULES_HREF}
              onClick={() => markLandingRestorePending()}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-white/45 bg-white/20 px-2.5 py-1.5 text-xs font-black text-white backdrop-blur-md transition hover:bg-white/30 sm:min-h-10 sm:px-3 sm:text-sm"
              aria-label="กลับหน้าแรก"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">กลับหน้าแรก</span>
              <span className="sm:hidden">หน้าแรก</span>
            </Link>
            <p className="truncate text-sm font-black tracking-tight text-white drop-shadow sm:text-base">
              MAWELL · {moduleTitle}
            </p>
          </div>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
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

      {/* ชื่อระบบอยู่ในรูปแบนเนอร์ — แบบเดิม */}
      <section className="relative isolate min-h-[58vh] overflow-hidden sm:min-h-[72vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(banner)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/35 via-[#1e1b4b]/15 to-[#faf9ff]/95" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/80 to-transparent sm:h-44" />

        <div
          className={cn(
            "relative z-10 mx-auto flex min-h-[58vh] max-w-6xl flex-col justify-end px-4 pb-8 sm:min-h-[72vh] sm:px-6 sm:pb-12",
            appSafeAreaPortalHeroTopPadClass,
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 drop-shadow sm:text-xs">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1.5 max-w-3xl text-3xl font-black tracking-tight text-white drop-shadow-md sm:mt-2 sm:text-5xl md:text-6xl">
            {moduleTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-snug text-white/90 drop-shadow sm:mt-3 sm:text-lg sm:leading-relaxed">
            {copy.tagline}
          </p>

          <div id="cta" className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              href={tryHref}
              className={cn(tryPromoCtaClass, "min-h-11 px-7 text-sm shadow-lg shadow-[#0000BF]/25 sm:min-h-12 sm:px-8")}
            >
              ทดลองใช้งาน
            </Link>
            <Link
              href={registerHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/70 bg-white/95 px-7 text-sm font-black text-[#4d47b6] shadow-md backdrop-blur sm:min-h-12 sm:px-8"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 pb-14 pt-1 sm:space-y-12 sm:px-6 sm:pb-20 sm:pt-2">
        <section id="features" className="scroll-mt-6">
          <h2 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">ฟังก์ชันหลัก</h2>
          <p className="mt-1.5 line-clamp-2 max-w-3xl text-xs font-medium leading-snug text-[#66638c] sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-relaxed">
            {copy.pitch}
          </p>

          <ul className="mt-4 grid list-none grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
            {features.map((f, i) => {
              const tone = FEATURE_TONES[i % FEATURE_TONES.length]!;
              return (
                <li
                  key={`${f.title}-${i}`}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border border-white/70 bg-white/85 px-2.5 py-2 shadow-sm ring-1 ring-inset ring-white/50",
                    "border-l-[3px]",
                    tone.border,
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                      tone.tile,
                    )}
                    aria-hidden
                  >
                    {featureIcon(f.title, i)}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate text-[13px] font-black leading-tight text-[#1e1b4b] sm:text-sm">
                      {f.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium leading-snug text-[#66638c] sm:text-xs">
                      {shortenHint(f.hint)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="videos" className="scroll-mt-6">
          <h2 className="text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">วิดีโอเรียนรู้</h2>
          <p className="mt-1 text-xs font-medium text-[#66638c] sm:text-sm">กดการ์ดเพื่อเล่นคลิปบนหน้านี้</p>
          {videos.length === 0 ? (
            <div
              className={cn(
                appPublicCheckInGlassCardClass,
                "mt-3 rounded-2xl border border-dashed border-[#cfc9f0]/80 px-4 py-5 text-center",
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
          <p className="mt-1 text-xs font-medium text-[#66638c] sm:text-sm">
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
          <div className="mt-3 text-[11px] font-semibold text-[#66638c] sm:mt-4 sm:text-xs">
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
