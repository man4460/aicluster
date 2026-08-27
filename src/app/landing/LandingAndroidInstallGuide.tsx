"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  appDashboardBrandGradientFillClass,
  appPublicCheckInGlassCardClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { detectPwaPlatform, type PwaInstallPlatform } from "@/components/pwa/pwa-install-context";
import { cn } from "@/lib/cn";
import {
  MAWELL_ANDROID_APK_PATH,
  MAWELL_ANDROID_APK_VERSION,
} from "@/lib/mobile/android-apk";

const androidSteps = [
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

const iosSteps = [
  {
    n: "1",
    title: "เปิดด้วย Safari",
    hint: "เข้า app.ma-well.com ด้วย Safari บน iPhone / iPad",
  },
  {
    n: "2",
    title: "เพิ่มที่หน้าจอโฮม (ถ้าต้องการ)",
    hint: "แชร์ → เพิ่มไปยังหน้าจอโฮม — เปิดใช้งานเหมือนแอป",
  },
  {
    n: "3",
    title: "ใช้งานผ่านเว็บ",
    hint: "iOS ยังไม่มีไฟล์ติดตั้งจากเว็บ — ใช้เบราว์เซอร์ได้ครบฟีเจอร์หลัก",
  },
] as const;

type Props = {
  variant?: "section" | "page";
  className?: string;
};

function AndroidDownloadButton({ className }: { className?: string }) {
  return (
    <a
      href={MAWELL_ANDROID_APK_PATH}
      download
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-md transition active:scale-[0.99]",
        appDashboardBrandGradientFillClass,
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M12 3v12" strokeLinecap="round" />
        <path d="m7 11 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 21h14" strokeLinecap="round" />
      </svg>
      ดาวน์โหลดติดตั้ง Android
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
        v{MAWELL_ANDROID_APK_VERSION}
      </span>
    </a>
  );
}

export function LandingAndroidInstallGuide({ variant = "section", className }: Props) {
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);

  useEffect(() => {
    setPlatform(detectPwaPlatform());
  }, []);

  const titleClass =
    variant === "page"
      ? "text-3xl font-black tracking-tight text-[#1e1b4b] sm:text-4xl"
      : "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

  const isIos = platform === "ios";
  const isAndroid = platform === "android";
  const isDesktop = platform === "other" || platform === null;

  const eyebrow = isIos ? "iPhone / iPad" : isAndroid ? "Android" : "แอปมือถือ";
  const title = isIos
    ? "ใช้งาน MAWELL บน iPhone / iPad"
    : isAndroid
      ? "ติดตั้งแอป MAWELL บน Android"
      : "ติดตั้งแอป MAWELL บนมือถือ";
  const blurb = isIos
    ? "อุปกรณ์ของคุณเป็น iOS — ไม่สามารถติดตั้งไฟล์ APK ได้ ให้ใช้ Safari หรือเพิ่มไอคอนที่หน้าจอโฮม"
    : isAndroid
      ? "ตรวจพบ Android — ดาวน์โหลดไฟล์ติดตั้งจากเว็บนี้ได้เลย ไม่ต้องผ่าน Play Store"
      : "Android ดาวน์โหลด APK ติดตั้งเองได้ · iPhone / iPad ใช้ผ่าน Safari (ยังไม่มีไฟล์ติดตั้งจากเว็บ)";

  const steps = isIos ? iosSteps : androidSteps;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b61ff]">{eyebrow}</p>
        <h2 className={cn(titleClass, "mt-2")}>{title}</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c] sm:text-base">{blurb}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {isIos ? (
          <Link
            href="/login"
            className={cn(
              "inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-black text-white shadow-md",
              appDashboardBrandGradientFillClass,
            )}
          >
            เปิดใช้งานในเบราว์เซอร์
          </Link>
        ) : (
          <AndroidDownloadButton />
        )}
        {variant === "section" ? (
          <Link
            href="/download-app"
            className={cn(appTemplateOutlineButtonClass, "min-h-12 px-5 text-sm font-bold")}
          >
            คู่มือติดตั้งละเอียด
          </Link>
        ) : null}
        {isDesktop && variant === "page" ? (
          <p className="text-xs font-semibold text-[#66638c]">
            เปิดหน้านี้บนมือถือ Android เพื่อดาวน์โหลดและติดตั้งได้ทันที
          </p>
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
          isIos
            ? "rounded-[1.25rem] border-sky-200/80 bg-sky-50/90 p-4 text-sm font-medium text-[#0c4a6e] sm:p-5"
            : "rounded-[1.25rem] border-amber-200/70 bg-amber-50/80 p-4 text-sm font-medium text-[#5c4a1a] sm:p-5",
        )}
      >
        <p className={cn("font-black", isIos ? "text-[#0369a1]" : "text-[#7a5b10]")}>หมายเหตุ</p>
        {isIos ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            <li>Apple ไม่อนุญาตให้ติดตั้งแอปจากไฟล์เว็บแบบ Android</li>
            <li>พิมพ์บลูทูธพกพาบน iOS ต้องใช้แอป native จาก App Store (ยังไม่เปิดให้บริการ)</li>
            <li>ฟีเจอร์แดชบอร์ดหลักใช้งานผ่าน Safari / Chrome ได้ตามปกติ</li>
          </ul>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            <li>ไฟล์ติดตั้งใช้ได้กับมือถือ / แท็บเล็ต Android เท่านั้น</li>
            <li>ถ้าเครื่องเตือน “แอปจากแหล่งที่ไม่รู้จัก” ให้กดอนุญาตเฉพาะครั้งนี้</li>
            <li>หลังติดตั้ง แอปจะเปิดเว็บ MAWELL โปรดักชัน — อัปเดตเว็บแล้วแอปเห็นตาม</li>
          </ul>
        )}
      </div>
    </div>
  );
}

/** ปุ่ม CTA หน้าแรก — โชว์ดาวน์โหลดเฉพาะ Android · iOS ลิงก์ไปคู่มือ */
export function LandingMobileInstallHeroCta({ className }: { className?: string }) {
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);

  useEffect(() => {
    setPlatform(detectPwaPlatform());
  }, []);

  if (platform === "ios") {
    return (
      <Link
        href="/download-app"
        className={cn(
          "inline-flex min-h-[52px] items-center justify-center rounded-[1rem] border-2 border-white/80 bg-white/90 px-6 text-sm font-black text-[#4d47b6] shadow-md",
          className,
        )}
      >
        คู่มือ iPhone / iPad
      </Link>
    );
  }

  return (
    <a
      href={MAWELL_ANDROID_APK_PATH}
      download
      className={cn(
        "inline-flex min-h-[52px] items-center justify-center rounded-[1rem] px-6 text-sm font-black text-white shadow-md",
        appDashboardBrandGradientFillClass,
        className,
      )}
    >
      {platform === "android" ? "ติดตั้งแอป Android" : "ติดตั้งบนมือถือ"}
    </a>
  );
}
