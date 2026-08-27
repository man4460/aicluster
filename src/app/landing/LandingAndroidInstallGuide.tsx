"use client";

import Link from "next/link";
import {
  appDashboardBrandGradientFillClass,
  appPublicCheckInGlassCardClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  MAWELL_ANDROID_APK_PATH,
  MAWELL_ANDROID_APK_VERSION,
} from "@/lib/mobile/android-apk";

const steps = [
  {
    n: "1",
    title: "กดดาวน์โหลด",
    hint: "บันทึกไฟล์ MAWELL (.apk) ลงมือถือ Android",
  },
  {
    n: "2",
    title: "อนุญาตติดตั้ง",
    hint: "ตั้งค่า → แอป → ติดตั้งแอปที่ไม่รู้จัก → เปิดให้เบราว์เซอร์/ไฟล์",
  },
  {
    n: "3",
    title: "เปิดไฟล์ติดตั้ง",
    hint: "เปิดไฟล์ที่ดาวน์โหลด → กดติดตั้ง → เปิดแอป MAWELL",
  },
] as const;

type Props = {
  /** โหมดหน้าเต็ม (/download-app) หรือบล็อกในหน้าแรก */
  variant?: "section" | "page";
  className?: string;
};

export function LandingAndroidInstallGuide({ variant = "section", className }: Props) {
  const titleClass =
    variant === "page"
      ? "text-3xl font-black tracking-tight text-[#1e1b4b] sm:text-4xl"
      : "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

  return (
    <div className={cn("space-y-6", className)}>
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b61ff]">Android</p>
        <h2 className={cn(titleClass, "mt-2")}>ติดตั้งแอป MAWELL บนมือถือ</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c] sm:text-base">
          ดาวน์โหลดไฟล์ติดตั้งจากเว็บนี้ได้เลย — ไม่ต้องผ่าน Play Store · รองรับ Android
          (iPhone ยังใช้ผ่าน Safari / Chrome ได้ตามปกติ)
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <a
          href={MAWELL_ANDROID_APK_PATH}
          download
          className={cn(
            "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-md transition active:scale-[0.99]",
            appDashboardBrandGradientFillClass,
          )}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 3v12" strokeLinecap="round" />
            <path d="m7 11 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 21h14" strokeLinecap="round" />
          </svg>
          ดาวน์โหลดติดตั้งบนมือถือ
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            v{MAWELL_ANDROID_APK_VERSION}
          </span>
        </a>
        {variant === "section" ? (
          <Link
            href="/download-app"
            className={cn(appTemplateOutlineButtonClass, "min-h-12 px-5 text-sm font-bold")}
          >
            คู่มือติดตั้งละเอียด
          </Link>
        ) : null}
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className={cn(appPublicCheckInGlassCardClass, "rounded-[1.25rem] p-4 sm:p-5")}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5b61ff]/15 text-sm font-black text-[#4d47b6]">
              {s.n}
            </span>
            <p className="mt-3 text-sm font-black text-[#1e1b4b]">{s.title}</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#66638c]">{s.hint}</p>
          </li>
        ))}
      </ol>

      <div
        className={cn(
          appPublicCheckInGlassCardClass,
          "rounded-[1.25rem] border-amber-200/70 bg-amber-50/80 p-4 text-sm font-medium text-[#5c4a1a] sm:p-5",
        )}
      >
        <p className="font-black text-[#7a5b10]">หมายเหตุ</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
          <li>ใช้ได้กับมือถือ / แท็บเล็ต Android เท่านั้น</li>
          <li>ถ้าเครื่องเตือน “แอปจากแหล่งที่ไม่รู้จัก” ให้กดอนุญาตเฉพาะครั้งนี้</li>
          <li>หลังติดตั้ง แอปจะเปิดเว็บ MAWELL โปรดักชันอัตโนมัติ — อัปเดตเว็บแล้วแอปเห็นตาม</li>
        </ul>
      </div>
    </div>
  );
}
