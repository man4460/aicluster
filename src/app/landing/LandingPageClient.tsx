"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { cn } from "@/lib/cn";
import { displayAppModuleTitle } from "@/lib/modules/config";
import {
  LANDING_DAILY_MODULE_SHOWCASE,
  LANDING_FREE_MODULE_SHOWCASE,
  type LandingModuleShowcaseItem,
} from "@/app/landing/landing-module-showcase-data";

function ModuleShowcaseCard({ item, tier }: { item: LandingModuleShowcaseItem; tier: "free" | "daily" }) {
  const title = displayAppModuleTitle(item.slug, item.slug);
  return (
    <li className="h-full">
      <Link
        href="/login"
        aria-label={`${title} — เข้าสู่ระบบเพื่อทดลองใช้`}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/55 bg-white/75 shadow-[0_22px_55px_-30px_rgba(30,27,75,0.35)] ring-1 ring-inset ring-white/55 backdrop-blur-xl transition duration-500",
          "hover:-translate-y-1 hover:border-[#5b61ff]/30 hover:shadow-[0_28px_64px_-26px_rgba(91,97,255,0.38)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f4ff]",
          "sm:rounded-[1.75rem]",
        )}
      >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#ecebff] to-indigo-100/40">
        <img
          src={item.coverSrc}
          alt=""
          className="h-full w-full object-cover object-center transition duration-700 ease-out will-change-transform group-hover:scale-[1.045]"
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
            "absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-md backdrop-blur-md sm:right-4 sm:top-4 sm:text-xs",
            tier === "free"
              ? "border border-emerald-300/50 bg-emerald-500/90 text-white"
              : "border border-amber-200/60 bg-amber-400/95 text-[#1a0d3a]",
          )}
        >
          {tier === "free" ? "ฟรี" : "1 บาท/วัน"}
        </span>
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
          <p className="text-pretty text-base font-black leading-snug text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] sm:text-lg">
            {title}
          </p>
        </div>
      </div>
      <div className="border-t border-white/50 bg-gradient-to-br from-white/90 to-indigo-50/20 px-4 py-3.5 sm:px-5 sm:py-4">
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

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

export function LandingPageClient() {
  const heroCta = useReveal<HTMLDivElement>();
  const valueBlock = useReveal<HTMLDivElement>();
  const moduleShowcase = useReveal<HTMLDivElement>();
  const logos = useReveal<HTMLDivElement>();
  const features = useReveal<HTMLDivElement>();
  const social = useReveal<HTMLDivElement>();
  const bottomCta = useReveal<HTMLDivElement>();

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-[#1e1b4b]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--mawell-page-gradient)]"
        aria-hidden
      />
      <div
        className="landing-float-slow pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-[#5b61ff]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="landing-float-slow pointer-events-none absolute -left-20 top-[60%] h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl [animation-delay:-1.2s]"
        aria-hidden
      />

      <header className="sticky top-0 z-50 border-b border-white/50 bg-white/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center leading-none">
            <MawellLogo size="md" />
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-2xl px-3 py-2 text-sm font-bold text-[#5f5a8a] transition hover:bg-white/80 hover:text-[#1e1b4b] sm:px-4"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/login"
              className={cn(
                "rounded-2xl px-3 py-2 text-sm font-black shadow-md transition sm:px-4",
                "bg-gradient-to-r from-amber-400 to-orange-400 text-[#1e0f4a] ring-2 ring-amber-200/80 hover:brightness-105 hover:shadow-lg",
                "motion-safe:transition motion-safe:duration-300",
              )}
            >
              ขอสาธิตฟรี
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#5b61ff]/25 bg-white/70 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#4d47b6] shadow-sm backdrop-blur-sm sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              โมดูลฟรีหลายระบบ · สายรายวัน 1 บาท/วันต่อระบบ
            </p>
            <h1 className="mt-6 text-2xl font-black leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.08]">
              <span className="bg-gradient-to-r from-[#312e81] via-[#5b61ff] to-[#a855f7] bg-clip-text text-transparent">
                แพลตฟอร์มเดียว — ครบทุกระบบหลังบ้าน
              </span>
              <br />
              <span className="text-[#1e1b4b]">องค์กร · ธุรกิจ · โรงเรียน — ในคลิกเดียว</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-relaxed text-[#5f5a8a] sm:text-lg">
              ทรัพย์สิน การเงิน หอพัก POS คิว พาร์จ คาร์แคร์ สารบรรณ คลัง โรงเรียน และอื่น ๆ — บางโมดูล
              <strong className="font-black text-[#059669]"> ใช้งานฟรี </strong>
              ไม่หักโทเคนรายวัน ส่วนสายรายวันเริ่ม
              <strong className="font-black text-[#b45309]"> 1 บาทต่อวัน </strong>
              ต่อระบบเมื่อเข้าใช้ (กทม.) — ไม่ต้องต่อหลาย SaaS
            </p>

            <div
              ref={heroCta.ref}
              className={cn(
                "mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4",
                heroCta.visible && "landing-cta-micro",
              )}
            >
              <Link
                href="/login"
                className={cn(
                  "landing-cta-primary inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-[1.25rem] px-8 py-3.5 text-base font-black shadow-lg transition",
                  "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-[#1a0d3a]",
                  "ring-2 ring-white/90 ring-offset-2 ring-offset-transparent hover:brightness-105 hover:shadow-xl",
                )}
              >
                ขอสาธิตฟรี
              </Link>
              <Link
                href="/login"
                className={cn(
                  "inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-[1.25rem] border-2 border-[#5b61ff]/35 bg-white/80 px-8 py-3.5 text-base font-black text-[#4d47b6] backdrop-blur-sm",
                  "transition hover:border-[#5b61ff]/55 hover:bg-white",
                )}
              >
                เริ่มใช้งาน
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/40 bg-white/30 py-14 backdrop-blur-md sm:py-20">
          <div
            ref={valueBlock.ref}
            className={cn(
              "mx-auto max-w-6xl px-4 transition duration-700 sm:px-6",
              valueBlock.visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            <h2 className="text-center text-2xl font-black text-[#1e1b4b] sm:text-3xl">ทำไมถึงคุ้ม</h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm font-medium text-[#66638c] sm:text-base">
              ออกแบบให้ SME และองค์กรเริ่มได้จริง — ลดต้นทุนรายเดือน แต่ได้ฟีเจอร์ระดับองค์กร
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {[
                {
                  t: "โมดูลใช้งานฟรี",
                  d: "หลายระบบไม่หักโทเคนรายวัน — เริ่มใช้งานจริงได้ทันทีหลังเปิดสิทธิ์โมดูล",
                },
                {
                  t: "1 บาทต่อวัน",
                  d: "โมดูลสายรายวัน: เข้าใช้แต่ละระบบวันละ 1 โทเคน (เทียบ 1 บาท) ต่อวันกรุงเทพ — จ่ายเท่าที่เปิด",
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div
            ref={moduleShowcase.ref}
            className={cn(
              "transition duration-700",
              moduleShowcase.visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            <h2 className="text-center text-2xl font-black text-[#1e1b4b] sm:text-3xl">โมดูลในแพลตฟอร์ม</h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm font-medium text-[#66638c] sm:text-base">
              แถวบน: ระบบที่<strong className="text-[#059669]"> ไม่หักโทเคนรายวัน</strong> — แถวล่าง: สายรายวัน{" "}
              <strong className="text-[#b45309]">1 บาทต่อวัน</strong> ต่อ 1 โมดูล เมื่อเข้าใช้
            </p>

            <div className="mt-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-700">ใช้งานฟรี — ไม่หักรายวัน</h3>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {LANDING_FREE_MODULE_SHOWCASE.map((item) => (
                  <ModuleShowcaseCard key={item.slug} item={item} tier="free" />
                ))}
              </ul>
            </div>

            <div className="mt-12 border-t border-[#5b61ff]/15 pt-12">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-800">สายรายวัน — 1 บาทต่อวันต่อระบบ</h3>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {LANDING_DAILY_MODULE_SHOWCASE.map((item) => (
                  <ModuleShowcaseCard key={item.slug} item={item} tier="daily" />
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div
            ref={logos.ref}
            className={cn(
              "transition duration-700",
              logos.visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            <h2 className="text-center text-xl font-black text-[#1e1b4b] sm:text-2xl">องค์กรที่ไว้วางใจใช้งาน</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#66638c]">
              ตัวอย่างประเภทธุรกิจในเครือข่าย — ข้อมูลเป็นการจำลองเพื่อแสดง social proof เชิงดีไซน์
            </p>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {trustLogos.map((logo, i) => (
                <li
                  key={logo.abbr}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md transition duration-500 hover:-translate-y-0.5 hover:shadow-md motion-reduce:duration-0",
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
          </div>
        </section>

        <section className="bg-gradient-to-b from-transparent to-white/40 py-14 sm:py-20">
          <div
            ref={features.ref}
            className={cn(
              "mx-auto max-w-6xl px-4 transition duration-700 sm:px-6",
              features.visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            <h2 className="text-center text-2xl font-black sm:text-3xl">ฟีเจอร์ที่โฟกัสผลลัพธ์</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "แดชบอร์ดรวม", desc: "เมนูชัด สลับโมดูลเร็ว รองรับมือถือ" },
                { title: "สิทธิ์และความปลอดภัย", desc: "ล็อกอินมาตรฐาน แยกโมดูลตามสิทธิ์" },
                { title: "รายงานและส่งออก", desc: "สรุปยอด กรองช่วงเวลา พร้อมพิมพ์" },
                { title: "ขยายตามร้าน", desc: "เพิ่มโมดูลเมื่อธุรกิจโต ไม่ต้องย้ายระบบ" },
              ].map((f, i) => (
                <div
                  key={f.title}
                  className={cn(
                    "rounded-[1.25rem] border border-white/55 bg-white/60 p-5 shadow-sm backdrop-blur-md transition hover:border-[#5b61ff]/25 sm:p-6",
                    "motion-safe:hover:-translate-y-0.5",
                  )}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <p className="font-black text-[#4d47b6]">{f.title}</p>
                  <p className="mt-2 text-sm font-medium text-[#66638c]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div
            ref={social.ref}
            className={cn(
              "transition duration-700",
              social.visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
            )}
          >
            <h2 className="text-center text-2xl font-black sm:text-3xl">เสียงจากผู้ใช้งาน</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
              {reviews.map((r) => (
                <blockquote
                  key={r.quote}
                  className="mawell-card-surface relative overflow-hidden rounded-[1.5rem] p-6 sm:rounded-[2rem] sm:p-8"
                >
                  <p className="text-lg font-bold leading-relaxed text-[#312e81]">&ldquo;{r.quote}&rdquo;</p>
                  <footer className="mt-4 text-sm font-semibold text-[#66638c]">
                    <span className="text-[#4d47b6]">{r.role}</span> · {r.org}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

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
                href="/login"
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
      </main>

      <footer className="border-t border-white/40 bg-white/40 py-10 text-[#66638c] backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 text-center text-xs font-medium leading-relaxed sm:text-sm">
          <address className="not-italic">
            <p className="font-black text-[#1e1b4b]">ห้างหุ้นส่วนจำกัด มาเวล</p>
            <p className="mt-2 text-pretty">เลขประจำตัวผู้เสียภาษี 0103564008119</p>
            <p className="mt-1 text-pretty">
              เลขที่ 222/285 ม.1 ต.บางคูวัด อ.เมือง จ.ปทุมธานี 12000
            </p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <a
                href="tel:0966646914"
                className="font-semibold text-[#5b61ff] underline-offset-2 hover:underline"
              >
                โทร. 0966646914
              </a>
              <span className="text-[#66638c]/80" aria-hidden>
                ·
              </span>
              <a
                href="https://line.me/R/ti/p/@mawell"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#5b61ff] underline-offset-2 hover:underline"
              >
                Line: @mawell
              </a>
            </p>
          </address>
          <div className="mt-6 border-t border-white/50 pt-6 text-xs font-semibold sm:text-sm">
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
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
