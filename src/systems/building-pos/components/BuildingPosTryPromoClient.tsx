"use client";

import Link from "next/link";
import {
  AppImageLightbox,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  BUILDING_POS_TRY_BANNER,
  BUILDING_POS_TRY_FEATURES,
  BUILDING_POS_TRY_VIDEOS,
} from "@/systems/building-pos/lib/try-promo-content";
import {
  buildingPosCtaClass,
  buildingPosPortalMenuGridClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

const navLinkClass =
  "rounded-full px-3 py-1.5 text-xs font-bold text-white/90 transition hover:bg-white/25";

type Props = {
  moduleTitle: string;
  tryHref: string;
  registerHref: string;
};

export function BuildingPosTryPromoClient({ moduleTitle, tryHref, registerHref }: Props) {
  const lb = useAppImageLightbox();

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="แบนเนอร์" />

      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="truncate text-sm font-black tracking-tight text-white drop-shadow sm:text-base">
            MAWELL · {moduleTitle}
          </p>
          <nav
            className="hidden items-center gap-1 rounded-full border border-white/40 bg-white/20 px-1 py-1 backdrop-blur-xl md:flex"
            aria-label="เมนูหน้าโฆษณา"
          >
            <a href="#features" className={navLinkClass}>
              ฟีเจอร์
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

      <section className="relative isolate min-h-[72vh] overflow-hidden sm:min-h-[80vh]">
        <button
          type="button"
          className="absolute inset-0 block"
          onClick={() => lb.open(BUILDING_POS_TRY_BANNER)}
          aria-label="ดูแบนเนอร์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BUILDING_POS_TRY_BANNER}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1e1b4b]/35 via-[#1e1b4b]/15 to-[#faf9ff]/95" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/80 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-10 pt-28 sm:min-h-[80vh] sm:px-6 sm:pb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85 drop-shadow">
            Restaurant POS
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
            {moduleTitle}
          </h1>
          <p className="mt-3 max-w-xl text-base font-semibold text-white/90 drop-shadow sm:text-lg">
            รับออเดอร์ · คิวครัว · QR สั่งที่โต๊ะ · จองออนไลน์ · การเงิน ในโมดูลเดียว
          </p>

          <div id="cta" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={tryHref}
              className={cn(buildingPosCtaClass, "min-h-12 px-8 text-sm shadow-lg shadow-[#0000BF]/25")}
            >
              ทดลองใช้งาน
            </Link>
            <Link
              href={registerHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/70 bg-white/95 px-8 text-sm font-black text-[#4d47b6] shadow-md backdrop-blur"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-14 px-4 pb-20 pt-2 sm:px-6">
        <section id="features" className="scroll-mt-8">
          <h2 className="text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl">ทำอะไรได้บ้าง</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUILDING_POS_TRY_FEATURES.map((f) => (
              <div
                key={f.title}
                className={cn(appPublicCheckInGlassCardClass, "rounded-[1.25rem] p-4 sm:p-5")}
              >
                <p className="text-sm font-black text-[#1e1b4b]">{f.title}</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-[#66638c]">{f.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="videos" className="scroll-mt-8">
          <h2 className="text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl">
            วิดีโอเรียนรู้
          </h2>
          <p className="mt-2 text-sm font-medium text-[#66638c]">
            กดการ์ดเพื่อเปิดคลิป / ค้นหาที่เกี่ยวข้องในแท็บใหม่
          </p>
          <div className={cn("mt-6", buildingPosPortalMenuGridClass)}>
            {BUILDING_POS_TRY_VIDEOS.map((v) => (
              <a
                key={v.id}
                href={v.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-sm ring-1 ring-inset ring-white/50 transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl"
              >
                <div className="relative aspect-square overflow-hidden sm:aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumb}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-[#1e1b4b]/25"
                    aria-hidden
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#4d47b6] shadow-lg sm:h-12 sm:w-12">
                      <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </div>
                <div className="space-y-0.5 p-2.5 sm:p-3">
                  <p className="line-clamp-2 text-[11px] font-black leading-snug text-[#1e1b4b] sm:text-xs">
                    {v.title}
                  </p>
                  <p className="line-clamp-1 text-[10px] font-medium text-[#66638c] sm:text-[11px]">
                    {v.hint}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section
          className={cn(
            appPublicCheckInGlassCardClass,
            "rounded-[1.5rem] p-6 text-center sm:rounded-[2rem] sm:p-8",
          )}
        >
          <h2 className="text-xl font-black text-[#1e1b4b] sm:text-2xl">พร้อมเริ่มแล้วหรือยัง</h2>
          <p className="mt-2 text-sm font-medium text-[#66638c]">
            ทดลองในแดชบอร์ดจริง หรือสมัครเพื่อเปิดร้านของคุณ
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={tryHref} className={cn(buildingPosCtaClass, "min-h-11 px-6 text-sm")}>
              ทดลองใช้งาน
            </Link>
            <Link
              href={registerHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#5b61ff]/30 bg-white px-6 text-sm font-black text-[#4d47b6]"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </section>
      </main>
    </AppPublicCheckInGlassPage>
  );
}
