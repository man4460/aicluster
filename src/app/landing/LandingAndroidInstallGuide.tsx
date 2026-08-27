"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
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
import { MAWELL_IOS_APP_VERSION } from "@/lib/mobile/ios-app";

type Tab = "android" | "ios";

type Props = {
  variant?: "section" | "page";
  className?: string;
  /** บังคับแท็บเริ่มต้น (เช่น #ios จาก URL) */
  initialTab?: Tab;
};

function iosInstallUrlFromEnv(): string | null {
  const u = process.env.NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL?.trim();
  return u || null;
}

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
      <DownloadIcon />
      ดาวน์โหลดติดตั้ง Android
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
        v{MAWELL_ANDROID_APK_VERSION}
      </span>
    </a>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="m7 11 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}

function ClickHereBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#1a0d3a]">
      กดตรงนี้
    </span>
  );
}

export function LandingAndroidInstallGuide({ variant = "section", className, initialTab }: Props) {
  const iosUrl = iosInstallUrlFromEnv();
  const iosReady = Boolean(iosUrl);
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab ?? "android");

  useEffect(() => {
    const p = detectPwaPlatform();
    setPlatform(p);
    if (initialTab) return;
    if (p === "ios") setTab("ios");
    else if (p === "android") setTab("android");
  }, [initialTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash === "ios") setTab("ios");
    if (hash === "android") setTab("android");
  }, []);

  const titleClass =
    variant === "page"
      ? "text-3xl font-black tracking-tight text-[#1e1b4b] sm:text-4xl"
      : "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

  return (
    <div className={cn("space-y-6", className)}>
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b61ff]">แอปมือถือ</p>
        <h2 className={cn(titleClass, "mt-2")}>ติดตั้ง MAWELL บนมือถือ</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c] sm:text-base">
          เลือกระบบด้านล่าง — ปุ่มสีม่วงที่มีป้าย{" "}
          <span className="font-black text-[#7a5b10]">กดตรงนี้</span> คือจุดดาวน์โหลด/ติดตั้ง
        </p>
        {platform === "ios" || platform === "android" ? (
          <p className="mt-1 text-xs font-semibold text-[#5b61ff]">
            ตรวจจับอุปกรณ์: {platform === "ios" ? "iPhone / iPad" : "Android"} — เปิดแท็บที่เหมาะให้อัตโนมัติ
          </p>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="เลือกระบบมือถือ"
        className="inline-flex flex-wrap gap-1 rounded-2xl border border-white/60 bg-white/70 p-1 shadow-sm"
      >
        {(
          [
            { id: "android" as const, label: "Android" },
            { id: "ios" as const, label: "iPhone / iPad" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            id={`install-tab-${t.id}`}
            className={cn(
              "min-h-10 rounded-xl px-4 text-sm font-black transition",
              tab === t.id
                ? cn("text-white shadow-md", appDashboardBrandGradientFillClass)
                : "text-[#5f5a8a] hover:bg-white",
            )}
            onClick={() => {
              setTab(t.id);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", `#${t.id}`);
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-labelledby={`install-tab-${tab}`} className="space-y-5">
        {tab === "android" ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="inline-flex flex-col gap-1">
                <AndroidDownloadButton />
                <p className="text-[11px] font-bold text-amber-700">
                  <ClickHereBadge /> ← ปุ่มดาวน์โหลดไฟล์ .apk
                </p>
              </div>
              {variant === "section" ? (
                <Link
                  href="/download-app#android"
                  className={cn(appTemplateOutlineButtonClass, "min-h-12 px-5 text-sm font-bold")}
                >
                  เปิดคู่มือเต็มหน้า
                </Link>
              ) : null}
            </div>

            <ol className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "กดปุ่มม่วงด้านบน",
                  hint: "ป้าย «กดตรงนี้» — บันทึกไฟล์ mawell-android.apk",
                },
                {
                  n: "2",
                  title: "อนุญาตติดตั้ง",
                  hint: "ตั้งค่า → แอป → ติดตั้งแอปที่ไม่รู้จัก → เปิดให้ Chrome/ไฟล์",
                },
                {
                  n: "3",
                  title: "เปิดไฟล์แล้วกดติดตั้ง",
                  hint: "เปิดจากดาวน์โหลด → ติดตั้ง → เปิดแอป MAWELL",
                },
              ].map((s) => (
                <StepCard key={s.n} {...s} />
              ))}
            </ol>

            <NoteCard tone="amber">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
                <li>ใช้ได้กับมือถือ / แท็บเล็ต Android เท่านั้น</li>
                <li>ถ้าเครื่องเตือนแหล่งที่ไม่รู้จัก — กดอนุญาตเฉพาะครั้งนี้</li>
                <li>หลังติดตั้ง แอปชี้เว็บ app.ma-well.com — แก้เว็บแล้วแอปเห็นตาม</li>
              </ul>
            </NoteCard>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {iosReady && iosUrl ? (
                <div className="inline-flex flex-col gap-1">
                  <a
                    href={iosUrl}
                    className={cn(
                      "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-md",
                      appDashboardBrandGradientFillClass,
                    )}
                  >
                    <DownloadIcon />
                    ดาวน์โหลดติดตั้ง iOS
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                      v{MAWELL_IOS_APP_VERSION}
                    </span>
                  </a>
                  <p className="text-[11px] font-bold text-amber-700">
                    <ClickHereBadge /> ← เปิดด้วย Safari เท่านั้น
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    appPublicCheckInGlassCardClass,
                    "w-full max-w-xl rounded-[1.25rem] border-sky-200/70 bg-sky-50/90 p-4 sm:p-5",
                  )}
                >
                  <p className="text-sm font-black text-[#0369a1]">แอป iOS กำลังเตรียม — ใช้เว็บได้ก่อน</p>
                  <p className="mt-1 text-xs font-medium text-[#0c4a6e]">
                    เมื่อทีมอัปโหลดจาก Mac แล้ว ปุ่มดาวน์โหลดจะโผล่ตรงนี้เอง
                  </p>
                  <Link
                    href="/login"
                    className={cn(
                      "mt-3 inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-black text-white",
                      appDashboardBrandGradientFillClass,
                    )}
                  >
                    เปิดใช้งานในเบราว์เซอร์
                    <ClickHereBadge />
                  </Link>
                </div>
              )}
              {variant === "section" ? (
                <Link
                  href="/download-app#ios"
                  className={cn(appTemplateOutlineButtonClass, "min-h-12 px-5 text-sm font-bold")}
                >
                  เปิดคู่มือเต็มหน้า
                </Link>
              ) : null}
            </div>

            <ol className="grid gap-3 sm:grid-cols-3">
              {(iosReady
                ? [
                    {
                      n: "1",
                      title: "เปิดหน้านี้ด้วย Safari",
                      hint: "Chrome บน iOS อาจติดตั้ง OTA ไม่ได้ — ใช้ Safari",
                    },
                    {
                      n: "2",
                      title: "กดปุ่มม่วง «ดาวน์โหลดติดตั้ง iOS»",
                      hint: "มีป้าย กดตรงนี้ — ยืนยันติดตั้งตามที่เครื่องถาม",
                    },
                    {
                      n: "3",
                      title: "ตั้งค่า → ทั่วไป → VPN และการจัดการอุปกรณ์",
                      hint: "ถ้าเป็นโปรไฟล์องค์กร: กดเชื่อถือแอป MAWELL แล้วเปิดแอป",
                    },
                  ]
                : [
                    {
                      n: "1",
                      title: "เปิด Safari → app.ma-well.com",
                      hint: "หรือกด «เปิดใช้งานในเบราว์เซอร์» ด้านบน",
                    },
                    {
                      n: "2",
                      title: "แชร์ → เพิ่มไปยังหน้าจอโฮม",
                      hint: "ไอคอนแชร์กลางล่าง → เลื่อนหา «เพิ่มไปยังหน้าจอโฮม»",
                    },
                    {
                      n: "3",
                      title: "เปิดไอคอน MAWELL จากโฮม",
                      hint: "ใช้งานเหมือนแอป · แอป native จาก Mac จะมาแทนเมื่อพร้อม",
                    },
                  ]
              ).map((s) => (
                <StepCard key={s.n} {...s} />
              ))}
            </ol>

            <NoteCard tone="sky">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
                <li>iOS ติดตั้งจากเว็บได้เมื่อมี TestFlight / App Store / Enterprise OTA</li>
                <li>ทีม build บน Mac: ดูไฟล์คู่มือ <code className="font-mono text-[11px]">docs/ios-capacitor-mac.md</code></li>
                <li>ตั้ง <code className="font-mono text-[11px]">NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL</code> บนเซิร์ฟเวอร์แล้วรีสตาร์ทเว็บ</li>
              </ul>
            </NoteCard>
          </>
        )}
      </div>
    </div>
  );
}

function StepCard({ n, title, hint }: { n: string; title: string; hint: string }) {
  return (
    <li className={cn(appPublicCheckInGlassCardClass, "rounded-[1.25rem] p-4 sm:p-5")}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5b61ff]/15 text-sm font-black text-[#4d47b6]">
        {n}
      </span>
      <p className="mt-3 text-sm font-black text-[#1e1b4b]">{title}</p>
      <p className="mt-1 text-xs font-medium leading-relaxed text-[#66638c]">{hint}</p>
    </li>
  );
}

function NoteCard({
  tone,
  children,
}: {
  tone: "amber" | "sky";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        appPublicCheckInGlassCardClass,
        "rounded-[1.25rem] p-4 text-sm font-medium sm:p-5",
        tone === "sky"
          ? "border-sky-200/80 bg-sky-50/90 text-[#0c4a6e]"
          : "border-amber-200/70 bg-amber-50/80 text-[#5c4a1a]",
      )}
    >
      <p className={cn("font-black", tone === "sky" ? "text-[#0369a1]" : "text-[#7a5b10]")}>หมายเหตุ</p>
      {children}
    </div>
  );
}

/** ปุ่ม CTA หน้าแรก — Android โหลด APK · iOS ไปคู่มือหรือลิงก์ติดตั้งเมื่อพร้อม */
export function LandingMobileInstallHeroCta({ className }: { className?: string }) {
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null);
  const iosUrl = iosInstallUrlFromEnv();

  useEffect(() => {
    setPlatform(detectPwaPlatform());
  }, []);

  if (platform === "ios") {
    if (iosUrl) {
      return (
        <a
          href={iosUrl}
          className={cn(
            "inline-flex min-h-[52px] items-center justify-center rounded-[1rem] px-6 text-sm font-black text-white shadow-md",
            appDashboardBrandGradientFillClass,
            className,
          )}
        >
          ติดตั้งแอป iOS
        </a>
      );
    }
    return (
      <Link
        href="/download-app#ios"
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
