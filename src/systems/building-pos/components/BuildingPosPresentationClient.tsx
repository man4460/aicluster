"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  appDashboardBrandGradientBarClass,
  appDashboardBrandGradientFillClass,
} from "@/components/app-templates/dashboard-tokens";
import { BUILDING_POS_BASE } from "@/systems/building-pos/building-pos-nav";

type PresentationVariant = "embedded" | "public";

type SlideDef = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** รายละเอียดเพิ่ม (ขึ้นบรรทัดใหม่ได้) */
  details?: string[];
  tone: "violet" | "indigo" | "emerald" | "amber" | "sky" | "rose" | "slate" | "fuchsia";
  highlight: string;
  features?: { icon: string; label: string; hint?: string }[];
  stats?: { label: string; value: string; tone?: string }[];
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  heroEmoji?: string;
  featuresHeading?: string;
};

const SLIDES: SlideDef[] = [
  {
    id: "cover",
    eyebrow: "หจก.มาเวล",
    title: "MAWELL PLATFORM",
    subtitle: "แพลตฟอร์มจัดการธุรกิจครบวงจร — รวมโมดูลหน้าร้าน หลังร้าน และการเงินไว้ในที่เดียว",
    tone: "violet",
    highlight: "หนึ่งแพลตฟอร์ม หลายระบบงาน",
    heroEmoji: "✨",
    featuresHeading: "ทำไมต้อง MAWELL",
    features: [
      { icon: "🧩", label: "โมดูลแยกตามธุรกิจ", hint: "เปิดใช้เฉพาะที่ร้านต้องการ ไม่ยุ่งเกินจำเป็น" },
      { icon: "📱", label: "ใช้ได้ทุกอุปกรณ์", hint: "มือถือ แท็บเล็ต คอมพิวเตอร์ — UI เดียวกัน" },
      { icon: "🔐", label: "สิทธิ์พนักงานชัดเจน", hint: "แยกเจ้าของร้านกับหน้างาน ลดแก้ข้อมูลผิด" },
      { icon: "📊", label: "ดูยอดและรายงาน", hint: "สรุปวันนี้ กราฟ และประวัติการขาย" },
    ],
    ctaPrimaryLabel: "ดูสไลด์ถัดไป →",
  },
  {
    id: "module",
    eyebrow: "โมดูลแนะนำ",
    title: "POS ร้านอาหาร",
    subtitle: "ระบบหน้าร้าน–หลังร้านสำหรับร้านอาหาร ครบตั้งแต่เมนูจนปิดยอด",
    details: [
      "รับออเดอร์จากพนักงานหรือให้ลูกค้าสแกน QR สั่งเองที่โต๊ะ",
      "แยกแผนกครัวหลายจุด · คิวเรียลไทม์ · เสิร์ฟและชำระเงินในที่เดียว",
      "ดูยอดขาย รายจ่าย และพิมพ์ใบเสร็จ/สลิปได้ทันที",
    ],
    tone: "indigo",
    highlight: "ครบวงจรในโมดูลเดียว",
    heroEmoji: "🍽️",
    featuresHeading: "ครอบคลุมงานร้าน",
    features: [
      { icon: "🛒", label: "รับออเดอร์", hint: "โต๊ะ · ช่องทาง · ตะกร้าเมนู" },
      { icon: "👨‍🍳", label: "ครัวหลายแผนก", hint: "จานหลัก · ของหวาน · เครื่องดื่ม" },
      { icon: "🟦", label: "QR สั่งเอง", hint: "ลูกค้าสแกนที่โต๊ะ ไม่ต้องคีย์ซ้ำ" },
      { icon: "💳", label: "ปิดบิล", hint: "เงินสด · พร้อมเพย์ · โอน" },
    ],
    ctaPrimaryLabel: "ดูสไลด์ถัดไป →",
  },
  {
    id: "overview",
    eyebrow: "1 · ภาพรวม",
    title: "ภาพรวมโมดูล",
    subtitle: "ทุกแท็บเชื่อมกันเป็นสายงานเดียว ตั้งแต่เปิดกะจนปิดยอด",
    details: [
      "แดชบอร์ดสรุปยอดวันนี้ ออเดอร์ค้าง และทางลัดสำคัญ",
      "ออร์เดอร์ + คิวออเดอร์ ติดตามสถานะแบบเรียลไทม์",
      "เมนู/หมวด · QR · การเงิน ครบในแถบเมนูเดียว",
    ],
    tone: "sky",
    highlight: "ไม่ต้องสลับหลายระบบ",
    featuresHeading: "6 ส่วนหลัก",
    stats: [
      { label: "แดชบอร์ด", value: "01", tone: "violet" },
      { label: "ออร์เดอร์", value: "02", tone: "sky" },
      { label: "คิวครัว", value: "03", tone: "emerald" },
      { label: "เมนู", value: "04", tone: "amber" },
      { label: "QR", value: "05", tone: "rose" },
      { label: "การเงิน", value: "06", tone: "fuchsia" },
    ],
    features: [
      { icon: "📊", label: "แดชบอร์ด", hint: "รายรับวันนี้ · หมวดขายดี · ลูกค้า · โต๊ะค้างบิล" },
      { icon: "🍽️", label: "ออร์เดอร์", hint: "พนักงานสั่งแทนลูกค้า เลือกโต๊ะและเมนู" },
      { icon: "📋", label: "คิวออเดอร์", hint: "รับ → กำลังทำ → เสิร์ฟ → เสร็จ" },
      { icon: "🍜", label: "เมนูและหมวด", hint: "ราคา รูป เปิด–ปิดขาย จัดกลุ่มชัด" },
      { icon: "📱", label: "QR", hint: "ลูกค้า · พนักงาน · แผนกครัว/เสิร์ฟ" },
      { icon: "💰", label: "การเงิน", hint: "ยอดขาย กราฟ รายจ่าย สลิป" },
    ],
  },
  {
    id: "menus",
    eyebrow: "2 · เมนูทีละแท็บ",
    title: "รายละเอียดเมนู",
    subtitle: "รู้หน้าที่แต่ละแท็บ ทีมจะสลับงานหน้าร้าน–หลังร้านได้เร็วขึ้น",
    details: [
      "แดชบอร์ด — ดูภาพรวมก่อนเปิดกะและติดตามโต๊ะที่มีออเดอร์",
      "ออร์เดอร์ / คิว — สั่งอาหารและขยับสถานะตามขั้นตอนจริง",
      "เมนู · QR · การเงิน — ตั้งค่าขาย แชร์ลิงก์ และปิดบัญชี",
    ],
    tone: "emerald",
    highlight: "เมนูชัด ทีมทำงานเร็ว",
    featuresHeading: "ทำอะไรได้บ้าง",
    features: [
      { icon: "🏠", label: "แดชบอร์ด", hint: "สรุปยอด · ออเดอร์ค้าง · ทางลัดรับออเดอร์/QR" },
      { icon: "🛒", label: "ออร์เดอร์", hint: "เลือกโต๊ะ ช่องทาง เมนู แล้วส่งเข้าครัวทันที" },
      { icon: "📋", label: "คิวออเดอร์", hint: "กระดาน 4 ขั้น อัปเดตสถานะได้จากหลายจอ" },
      { icon: "🍜", label: "เมนู / หมวด", hint: "เพิ่มรายการ ราคา รูป และปิดขายเมื่อหมด" },
      { icon: "📱", label: "QR", hint: "พิมพ์ติดโต๊ะ · ลิงก์พนักงาน · จอครัว/เสิร์ฟ" },
      { icon: "💰", label: "การเงิน", hint: "ตรวจยอด ปิดบิล พิมพ์สลิป บันทึกรายจ่าย" },
    ],
  },
  {
    id: "howto",
    eyebrow: "3 · เริ่มใช้จริง",
    title: "วิธีใช้งาน",
    subtitle: "เตรียมเมนูให้พร้อม แล้วเลือกรับออเดอร์เอง หรือให้ลูกค้าสแกน QR",
    details: [
      "ตั้งชื่อร้าน โลโก้ และช่องทางรับชำระก่อนเปิดขาย",
      "สร้างหมวด → เพิ่มเมนู → เปิดสถานะขาย",
      "ทดสอบอย่างน้อย 1 ออเดอร์ (พนักงานหรือ QR) ก่อนเปิดรอบจริง",
    ],
    tone: "amber",
    highlight: "เตรียมดี ขายวันแรกได้",
    featuresHeading: "ลำดับแนะนำ",
    features: [
      { icon: "1️⃣", label: "ตั้งค่าร้าน", hint: "ชื่อ · โลโก้ · เงินสด/พร้อมเพย์/โอน" },
      { icon: "2️⃣", label: "สร้างหมวดหมู่", hint: "เช่น จานหลัก · เครื่องดื่ม · ของหวาน" },
      { icon: "3️⃣", label: "เพิ่มเมนู", hint: "ชื่อ ราคา รูป แล้วเปิดขาย" },
      { icon: "4️⃣", label: "รับออเดอร์", hint: "เปิดแท็บออร์เดอร์ เลือกโต๊ะและเมนู" },
      { icon: "5️⃣", label: "QR ลูกค้า", hint: "คัดลอกลิงก์หรือพิมพ์โปสเตอร์ติดโต๊ะ" },
      { icon: "6️⃣", label: "ทดสอบปิดบิล", hint: "ส่งครัว เสิร์ฟ แล้วชำระเงินให้ครบ" },
    ],
  },
  {
    id: "workflow",
    eyebrow: "4 · สายงานจริง",
    title: "ไหลงานถึงบิล",
    subtitle: "ออเดอร์ใหม่ถูกส่งต่ออัตโนมัติ — ครัว เสิร์ฟ และชำระเงินอัปเดตร่วมกัน",
    details: [
      "ระบบแยกเมนูไปแผนกครัวที่เกี่ยวข้องทันทีที่รับออเดอร์",
      "จอครัวและจอหน้าร้านเห็นสถานะเดียวกันแบบเรียลไทม์",
      "เมื่อเสร็จแล้วปิดบิล พิมพ์ใบเสร็จ และบันทึกลงยอดขาย",
    ],
    tone: "rose",
    highlight: "ไม่ต้องวิ่งส่งใบ",
    featuresHeading: "4 ขั้นหลัก",
    features: [
      { icon: "📥", label: "รับออเดอร์", hint: "เข้าคิว · แยกแผนกครัวอัตโนมัติ" },
      { icon: "🔥", label: "แผนกครัว", hint: "ทำอาหาร แล้วอัปเดตกำลังทำ/พร้อมเสิร์ฟ" },
      { icon: "🛎️", label: "แผนกเสิร์ฟ", hint: "รับจานเสิร์ฟโต๊ะ แล้วขยับสถานะบนคิว" },
      { icon: "💳", label: "ชำระเงิน", hint: "ปิดบิล เงินสด/พร้อมเพย์/โอน + พิมพ์ใบเสร็จ" },
      { icon: "⚡", label: "หลายจอพร้อมกัน", hint: "แท็บเล็ตครัว + จอหน้าร้านอัปเดตพร้อมกัน" },
      { icon: "📈", label: "บันทึกยอด", hint: "ยอดขายและประวัติดูย้อนหลังได้ทันที" },
    ],
  },
  {
    id: "cta",
    eyebrow: "เริ่มต้น",
    title: "เริ่มใช้งาน",
    subtitle: "สมัครหรือเข้าสู่ระบบ เพื่อสร้างเมนูและรับออเดอร์แรกของคุณ",
    tone: "violet",
    highlight: "พร้อมใช้วันนี้",
    heroEmoji: "🚀",
    featuresHeading: "ขั้นถัดไป",
    ctaPrimaryLabel: "เข้าสู่ระบบ / สมัคร",
    ctaPrimaryHref: "/login",
    ctaSecondaryLabel: "หน้าแรก MAWELL",
    ctaSecondaryHref: "/",
    features: [
      { icon: "🧭", label: "เข้าแดชบอร์ด", hint: "เปิดโมดูล POS ร้านอาหาร" },
      { icon: "🍜", label: "เพิ่มเมนูแรก", hint: "หมวด + ราคา + เปิดขาย" },
      { icon: "📲", label: "ทดลองออเดอร์", hint: "สั่งเองหรือสแกน QR" },
      { icon: "📘", label: "อ่านคู่มือ", hint: "ปุ่มคู่มือในหัวโมดูล" },
    ],
  },
];

function slidesForVariant(variant: PresentationVariant): SlideDef[] {
  if (variant !== "embedded") return SLIDES;
  return SLIDES.map((s) =>
    s.id === "cta"
      ? {
          ...s,
          subtitle: "กลับไปแดชบอร์ด เพิ่มเมนูแรก หรือเปิด QR ให้ลูกค้าทดลองสั่งได้เลย",
          ctaPrimaryLabel: "ไปหน้า Dashboard",
          ctaPrimaryHref: BUILDING_POS_BASE,
          ctaSecondaryLabel: "ดู QR ลูกค้า",
          ctaSecondaryHref: `${BUILDING_POS_BASE}/settings?tab=link`,
        }
      : s,
  );
}
const AUTO_PLAY_MS = 8500;

function toneGradientBg(tone: SlideDef["tone"]): string {
  switch (tone) {
    case "violet":
      return "from-[#5b61ff]/[0.22] via-[#8b5cf6]/[0.18] to-[#ec4899]/[0.18]";
    case "indigo":
      return "from-[#3b82f6]/[0.22] via-[#6366f1]/[0.2] to-[#8b5cf6]/[0.16]";
    case "emerald":
      return "from-[#10b981]/[0.22] via-[#14b8a6]/[0.2] to-[#0ea5e9]/[0.15]";
    case "amber":
      return "from-[#f59e0b]/[0.22] via-[#fb923c]/[0.2] to-[#ef4444]/[0.14]";
    case "sky":
      return "from-[#0ea5e9]/[0.22] via-[#06b6d4]/[0.2] to-[#6366f1]/[0.16]";
    case "rose":
      return "from-[#f43f5e]/[0.22] via-[#ec4899]/[0.2] to-[#f59e0b]/[0.14]";
    case "fuchsia":
      return "from-[#d946ef]/[0.22] via-[#a855f7]/[0.2] to-[#6366f1]/[0.16]";
    case "slate":
    default:
      return "from-slate-500/[0.18] via-slate-400/[0.16] to-slate-300/[0.12]";
  }
}

function toneBubbleGlow(tone: SlideDef["tone"]): string {
  switch (tone) {
    case "violet":
      return "bg-[#8b5cf6]/30";
    case "indigo":
      return "bg-[#6366f1]/30";
    case "emerald":
      return "bg-[#10b981]/30";
    case "amber":
      return "bg-[#f59e0b]/30";
    case "sky":
      return "bg-[#0ea5e9]/30";
    case "rose":
      return "bg-[#ec4899]/30";
    case "fuchsia":
      return "bg-[#d946ef]/30";
    case "slate":
    default:
      return "bg-slate-400/30";
  }
}

function toneStatGradient(tone?: string): string {
  switch (tone) {
    case "violet":
      return "from-white/65 via-[#c4b5fd]/40 to-[#e9d5ff]/30";
    case "emerald":
      return "from-white/65 via-[#a7f3d0]/40 to-[#6ee7b7]/30";
    case "amber":
      return "from-white/65 via-[#fde68a]/40 to-[#fed7aa]/30";
    case "sky":
      return "from-white/65 via-[#bae6fd]/40 to-[#bfdbfe]/30";
    case "rose":
      return "from-white/65 via-[#fecdd3]/40 to-[#fbcfe8]/30";
    case "fuchsia":
      return "from-white/65 via-[#f5d0fe]/40 to-[#e9d5ff]/30";
    default:
      return "from-white/65 via-[#c7d2fe]/40 to-[#ddd6fe]/30";
  }
}

export function BuildingPosPresentationClient({
  variant = "public",
}: {
  variant?: PresentationVariant;
}) {
  const slides = slidesForVariant(variant);
  const slideCount = slides.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      const clamped = ((next % slideCount) + slideCount) % slideCount;
      setIdx(clamped);
    },
    [slideCount],
  );

  const next = useCallback(() => go(idx + 1), [idx, go]);
  const prev = useCallback(() => go(idx - 1), [idx, go]);

  useEffect(() => {
    if (paused) return undefined;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % slideCount);
    }, AUTO_PLAY_MS);
    intervalRef.current = id;
    return () => {
      window.clearInterval(id);
      intervalRef.current = null;
    };
  }, [paused, slideCount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = slides[idx] ?? slides[0];
  const isPublic = variant === "public";

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    if (touchStartX.current == null) return;
    const dx = endX - touchStartX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
    touchStartX.current = null;
    window.setTimeout(() => setPaused(false), 500);
  };

  const progressPct = (idx / slideCount) * 100;

  return (
    <div
      className={cn(
        "relative w-full",
        isPublic
          ? "mx-auto flex min-h-dvh max-w-none flex-col px-0 py-0"
          : "mx-auto max-w-[1280px] px-3 py-4 sm:px-6 sm:py-6",
      )}
      suppressHydrationWarning
    >
      <div
        className={cn(
          "group relative overflow-hidden border-white/50",
          "bg-gradient-to-br from-white/55 via-indigo-50/30 to-violet-100/20",
          "backdrop-blur-2xl ring-1 ring-inset ring-white/55",
          isPublic
            ? "flex min-h-dvh flex-1 flex-col rounded-none border-0 shadow-none"
            : "rounded-[2rem] border shadow-[0_34px_80px_-30px_rgba(30,27,75,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)]",
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition-all duration-700",
            toneGradientBg(slide.tone),
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full blur-3xl transition-all duration-700",
            toneBubbleGlow(slide.tone),
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full blur-3xl opacity-80 transition-all duration-700",
            toneBubbleGlow(slide.tone),
          )}
          aria-hidden
        />

        <div className={cn("relative z-10", isPublic && "flex min-h-dvh flex-1 flex-col")}>
          <div className="flex items-start justify-between px-5 pt-5 sm:px-8 sm:pt-[max(1.5rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/60 bg-white/60 text-xl shadow-sm backdrop-blur-md ring-1 ring-inset ring-white/55 sm:h-12 sm:w-12">
                <span aria-hidden>🍽️</span>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#5b61ff]/80">
                  {slide.eyebrow}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  สไลด์ <span className="font-black text-[#4d47b6]">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="text-slate-400">/{String(slideCount).padStart(2, "0")}</span>
                </p>
              </div>
            </div>

            {!isPublic ? (
              <div className="hidden gap-2 sm:flex">
                <Link
                  href={BUILDING_POS_BASE}
                  className={cn(
                    "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[1rem] border border-white/60 bg-white/70 px-3 text-xs font-black text-[#4d47b6] backdrop-blur-sm transition hover:bg-white",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M3 12l9-9 9 9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Dashboard
                </Link>
              </div>
            ) : (
              <p className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-[#4d47b6]/80 sm:block">
                MAWELL
              </p>
            )}
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-6 px-5 pb-6 pt-4 sm:grid-cols-2 sm:gap-8 sm:px-8 sm:pb-10 sm:pt-6 lg:gap-10",
              isPublic && "flex-1 content-center",
            )}
          >
            <div className="flex min-h-[22rem] flex-col justify-center sm:min-h-[26rem]">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/65 bg-white/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6] shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#5b61ff] to-[#ec4899]" aria-hidden />
                {slide.highlight}
              </div>

              <h1
                className={cn(
                  "mt-4 whitespace-nowrap font-black leading-none tracking-tight text-[#1e1b4b]",
                  "text-[1.65rem] sm:mt-5 sm:text-[2.15rem] lg:text-[2.75rem]",
                )}
              >
                <span
                  className="bg-gradient-to-r from-[#1e1b4b] via-[#4d47b6] to-[#7c3aed] bg-clip-text text-transparent"
                  suppressHydrationWarning
                >
                  {slide.title}
                </span>
              </h1>

              {slide.subtitle ? (
                <p className="mt-3 max-w-xl text-[14px] font-medium leading-relaxed text-slate-600 sm:mt-4 sm:text-[15px] lg:text-base">
                  {slide.subtitle}
                </p>
              ) : null}

              {slide.details && slide.details.length > 0 ? (
                <ul className="mt-3 space-y-1.5 sm:mt-4">
                  {slide.details.map((line) => (
                    <li key={line} className="flex gap-2 text-[13px] font-medium leading-snug text-[#5f5a8a] sm:text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b61ff]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {slide.stats && slide.stats.length > 0 ? (
                <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
                  {slide.stats.map((s) => (
                    <div
                      key={s.label}
                      className={cn(
                        "relative overflow-hidden rounded-[1rem] border border-white/60 p-3 text-center shadow-[0_14px_32px_-24px_rgba(30,27,75,0.3)] backdrop-blur-md ring-1 ring-inset ring-white/55 transition hover:-translate-y-0.5 sm:p-4",
                        "bg-gradient-to-br",
                        toneStatGradient(s.tone),
                      )}
                    >
                      <div
                        className={cn(
                          "bg-gradient-to-br from-[#1e1b4b] via-[#4d47b6] to-[#c026d3] bg-clip-text text-lg font-black text-transparent sm:text-2xl",
                        )}
                      >
                        {s.value}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold leading-tight text-slate-600 sm:text-xs">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {slide.heroEmoji ? (
                <div className="mt-5 flex items-end gap-3 sm:mt-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/60 bg-white/60 text-4xl shadow-sm backdrop-blur-md ring-1 ring-inset ring-white/55 sm:h-20 sm:w-20 sm:text-5xl">
                    <span aria-hidden>{slide.heroEmoji}</span>
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-[1rem] border border-white/60 bg-white/55 px-3 py-2.5 text-xs font-semibold text-slate-600 backdrop-blur-sm sm:text-sm">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#5b61ff]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                    </svg>
                    ใช้ปุ่มลูกศรซ้าย-ขวา หรือเลื่อนหน้าจอ เพื่อเปลี่ยนสไลด์
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-8">
                {slide.ctaPrimaryHref ? (
                  <Link
                    href={slide.ctaPrimaryHref}
                    className={cn(
                      "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[1rem] px-4 text-xs font-black text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99] sm:px-5 sm:text-sm",
                      appDashboardBrandGradientFillClass,
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {slide.ctaPrimaryLabel ?? "เริ่มต้นใช้งาน"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    className={cn(
                      "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[1rem] px-4 text-xs font-black text-white shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.99] sm:px-5 sm:text-sm",
                      appDashboardBrandGradientFillClass,
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {slide.ctaPrimaryLabel ?? "สไลด์ถัดไป"}
                  </button>
                )}

                {slide.ctaSecondaryHref && slide.ctaSecondaryLabel ? (
                  <Link
                    href={slide.ctaSecondaryHref}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[1rem] border border-white/65 bg-white/70 px-4 text-xs font-black text-[#4d47b6] backdrop-blur-sm transition hover:bg-white sm:px-5 sm:text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
                    </svg>
                    {slide.ctaSecondaryLabel}
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="inline-flex min-h-[44px] w-11 items-center justify-center rounded-[1rem] border border-white/65 bg-white/60 text-[#4d47b6] backdrop-blur-sm transition hover:bg-white"
                  aria-label={paused ? "เล่นอัตโนมัติต่อ" : "หยุดเล่นอัตโนมัติ"}
                  title={paused ? "เล่นอัตโนมัติต่อ" : "หยุดเล่นอัตโนมัติ"}
                >
                  {paused ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-center min-h-[22rem] sm:min-h-[26rem]">
              {slide.features && slide.features.length > 0 ? (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/65 via-indigo-50/25 to-violet-100/20 p-4 shadow-[0_18px_44px_-26px_rgba(30,27,75,0.32)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:p-5 lg:p-6",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {slide.featuresHeading ?? "คุณสมบัติหลัก"}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-[10px] font-black text-[#5b61ff] backdrop-blur-sm">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {slide.features.length} รายการ
                    </span>
                  </div>

                  <ul
                    className={cn(
                      "grid gap-2.5 sm:gap-3",
                      slide.features.length <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
                    )}
                  >
                    {slide.features.map((f) => (
                      <li
                        key={f.label}
                        className={cn(
                          "group relative flex items-start gap-3 overflow-hidden rounded-[1rem] border border-white/60 bg-white/60 p-3 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/75 hover:bg-white/80 hover:shadow-md sm:p-3.5",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-violet-50/50 text-xl shadow-sm ring-1 ring-inset ring-white/60 sm:h-12 sm:w-12 sm:text-2xl",
                          )}
                        >
                          <span aria-hidden>{f.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="truncate whitespace-nowrap text-sm font-black text-[#1e1b4b] sm:text-[15px]">
                            {f.label}
                          </div>
                          {f.hint ? (
                            <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
                              {f.hint}
                            </p>
                          ) : null}
                        </div>
                        <svg viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-[#5b61ff]/40 transition group-hover:translate-x-0.5 group-hover:text-[#5b61ff]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {slide.id === "cta" && slide.stats && slide.stats.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  {slide.stats.map((s, si) => (
                    <div
                      key={`${s.label}-${si}`}
                      className={cn(
                        "relative overflow-hidden rounded-[1rem] border border-white/60 p-3 text-left backdrop-blur-md ring-1 ring-inset ring-white/55 transition hover:-translate-y-0.5 sm:p-4",
                        si === 0 && "bg-gradient-to-br from-white/65 via-emerald-50/45 to-teal-100/30",
                        si === 1 && "bg-gradient-to-br from-white/65 via-violet-50/45 to-fuchsia-100/25",
                        si === 2 && "bg-gradient-to-br from-white/65 via-amber-50/45 to-orange-100/25",
                        si === 3 && "bg-gradient-to-br from-white/65 via-sky-50/45 to-indigo-100/25",
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {s.label}
                      </p>
                      <p className="mt-1.5 text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-[28px]">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative z-10 border-t border-white/45 bg-white/25 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:order-2">
                <button
                  type="button"
                  onClick={prev}
                  className="inline-flex min-h-[44px] w-11 items-center justify-center rounded-[1rem] border border-white/65 bg-white/70 text-[#4d47b6] backdrop-blur-sm transition hover:bg-white"
                  aria-label="สไลด์ก่อนหน้า"
                  title="สไลด์ก่อนหน้า"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/60 px-2.5 py-1 backdrop-blur-sm">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`ไปสไลด์ ${i + 1} ${s.title}`}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        i === idx
                          ? cn("w-7", appDashboardBrandGradientFillClass)
                          : "w-2 bg-slate-300 hover:bg-slate-400",
                      )}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={next}
                  className="inline-flex min-h-[44px] w-11 items-center justify-center rounded-[1rem] border border-white/65 bg-white/70 text-[#4d47b6] backdrop-blur-sm transition hover:bg-white"
                  aria-label="สไลด์ถัดไป"
                  title="สไลด์ถัดไป"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="w-full sm:order-1 sm:max-w-[55%]">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    ความคืบหน้า
                  </p>
                  <p className="text-[10px] font-black text-[#4d47b6]">
                    {Math.round(progressPct)}%
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60 ring-1 ring-inset ring-white/60">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", appDashboardBrandGradientBarClass)}
                    style={{ width: `${progressPct + (100 / slideCount) * 0.05}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isPublic ? (
        <div className="mt-3 text-center text-[11px] font-medium text-slate-400 sm:text-xs">
          ทิปส์ · Arrow Keys เลื่อนสไลด์ · Space หยุด/เล่นต่อ · Swipe บนมือถือได้
        </div>
      ) : null}
    </div>
  );
}
