"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type Step = { n: string; title: string; hint: string };

type PlatformPanel = {
  id: Tab;
  tabLabel: string;
  /** ปุ่มหลัก */
  ctaLabel: string;
  ctaHref: string;
  ctaDownload?: boolean;
  versionBadge: string;
  ctaHint: string;
  fullGuideHash: string;
  steps: Step[];
  notes: string[];
};

type Props = {
  variant?: "section" | "page";
  className?: string;
  initialTab?: Tab;
};

function iosInstallUrlFromEnv(): string | null {
  const u = process.env.NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL?.trim();
  return u || null;
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="m7 11 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}

function ClickHereBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#1a0d3a]">
      กดตรงนี้
    </span>
  );
}

function buildPanels(iosUrl: string | null): Record<Tab, PlatformPanel> {
  const iosReady = Boolean(iosUrl);
  return {
    android: {
      id: "android",
      tabLabel: "Android",
      ctaLabel: "ดาวน์โหลดติดตั้ง Android",
      ctaHref: MAWELL_ANDROID_APK_PATH,
      ctaDownload: true,
      versionBadge: `v${MAWELL_ANDROID_APK_VERSION}`,
      ctaHint: "ปุ่มดาวน์โหลดไฟล์ .apk",
      fullGuideHash: "android",
      steps: [
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
      ],
      notes: [
        "ใช้ได้กับมือถือ / แท็บเล็ต Android เท่านั้น",
        "ถ้าเครื่องเตือนแหล่งที่ไม่รู้จัก — กดอนุญาตเฉพาะครั้งนี้",
        "หลังติดตั้ง แอปชี้เว็บ app.ma-well.com — แก้เว็บแล้วแอปเห็นตาม",
      ],
    },
    ios: {
      id: "ios",
      tabLabel: "iPhone / iPad",
      ctaLabel: iosReady ? "ดาวน์โหลดติดตั้ง iOS" : "เปิดใช้งานในเบราว์เซอร์",
      ctaHref: iosReady && iosUrl ? iosUrl : "/login",
      ctaDownload: false,
      versionBadge: iosReady ? `v${MAWELL_IOS_APP_VERSION}` : "เว็บ",
      ctaHint: iosReady
        ? "เปิดด้วย Safari เท่านั้น"
        : "แอป iOS กำลังเตรียม — ใช้เว็บได้ก่อน",
      fullGuideHash: "ios",
      steps: iosReady
        ? [
            {
              n: "1",
              title: "เปิดหน้านี้ด้วย Safari",
              hint: "Chrome บน iOS อาจติดตั้งไม่ได้ — ใช้ Safari",
            },
            {
              n: "2",
              title: "กดปุ่มม่วงด้านบน",
              hint: "ป้าย «กดตรงนี้» — ยืนยันติดตั้งตามที่เครื่องถาม",
            },
            {
              n: "3",
              title: "เชื่อถือแอป (ถ้ามี)",
              hint: "ตั้งค่า → ทั่วไป → VPN และการจัดการอุปกรณ์ → เชื่อถือ MAWELL",
            },
          ]
        : [
            {
              n: "1",
              title: "กดปุ่มม่วงด้านบน",
              hint: "ป้าย «กดตรงนี้» — เข้าใช้งานผ่านเบราว์เซอร์",
            },
            {
              n: "2",
              title: "แชร์ → เพิ่มไปยังหน้าจอโฮม",
              hint: "ไอคอนแชร์กลางล่าง → เลื่อนหา «เพิ่มไปยังหน้าจอโฮม»",
            },
            {
              n: "3",
              title: "เปิดไอคอน MAWELL จากโฮม",
              hint: "ใช้งานเหมือนแอป · แอป native จะมาแทนเมื่อพร้อม",
            },
          ],
      notes: iosReady
        ? [
            "ติดตั้งจากเว็บได้ผ่าน TestFlight / App Store / Enterprise OTA",
            "แนะนำเปิดลิงก์ด้วย Safari",
            "หลังติดตั้ง แอปชี้เว็บ app.ma-well.com — แก้เว็บแล้วแอปเห็นตาม",
          ]
        : [
            "แอป native iOS กำลังเตรียมบน Mac — ปุ่มดาวน์โหลดจะโผล่เมื่อพร้อม",
            "ตอนนี้ใช้ Safari หรือเพิ่มไอคอนที่หน้าจอโฮมได้",
            "ฟีเจอร์แดชบอร์ดหลักใช้งานผ่านเว็บได้ตามปกติ",
          ],
    },
  };
}

/** แผงเดียวใช้ทั้ง Android / iOS */
function PlatformInstallTemplate({
  panel,
  variant,
}: {
  panel: PlatformPanel;
  variant: "section" | "page";
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="inline-flex min-w-0 flex-col gap-1.5">
          {panel.ctaDownload || panel.ctaHref.startsWith("http") || panel.ctaHref.startsWith("itms-services:") ? (
            <a
              href={panel.ctaHref}
              {...(panel.ctaDownload ? { download: true } : {})}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-md transition active:scale-[0.99]",
                appDashboardBrandGradientFillClass,
              )}
            >
              <DownloadIcon />
              {panel.ctaLabel}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {panel.versionBadge}
              </span>
            </a>
          ) : (
            <Link
              href={panel.ctaHref}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black text-white shadow-md transition active:scale-[0.99]",
                appDashboardBrandGradientFillClass,
              )}
            >
              <DownloadIcon />
              {panel.ctaLabel}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {panel.versionBadge}
              </span>
            </Link>
          )}
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-amber-700">
            <ClickHereBadge />
            <span>← {panel.ctaHint}</span>
          </p>
        </div>
        {variant === "section" ? (
          <Link
            href={`/download-app#${panel.fullGuideHash}`}
            className={cn(appTemplateOutlineButtonClass, "min-h-12 px-5 text-sm font-bold")}
          >
            เปิดคู่มือเต็มหน้า
          </Link>
        ) : null}
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {panel.steps.map((s) => (
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
          {panel.notes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function LandingAndroidInstallGuide({ variant = "section", className, initialTab }: Props) {
  const iosUrl = iosInstallUrlFromEnv();
  const panels = useMemo(() => buildPanels(iosUrl), [iosUrl]);
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
    if (hash === "ios" || hash === "android") setTab(hash);
  }, []);

  const titleClass =
    variant === "page"
      ? "text-3xl font-black tracking-tight text-[#1e1b4b] sm:text-4xl"
      : "text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl";

  const active = panels[tab];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b61ff]">แอปมือถือ</p>
        <h2 className={cn(titleClass, "mt-2")}>ติดตั้ง MAWELL บนมือถือ</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#66638c] sm:text-base">
          เลือกระบบด้านล่าง — โครงคู่มือ Android และ iOS แบบเดียวกัน ปุ่มม่วงที่มีป้าย{" "}
          <span className="font-black text-[#7a5b10]">กดตรงนี้</span> คือจุดเริ่มติดตั้ง
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
        {(["android", "ios"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            id={`install-tab-${id}`}
            className={cn(
              "min-h-10 rounded-xl px-4 text-sm font-black transition",
              tab === id
                ? cn("text-white shadow-md", appDashboardBrandGradientFillClass)
                : "text-[#5f5a8a] hover:bg-white",
            )}
            onClick={() => {
              setTab(id);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", `#${id}`);
              }
            }}
          >
            {panels[id].tabLabel}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-labelledby={`install-tab-${tab}`}>
        <PlatformInstallTemplate panel={active} variant={variant} />
      </div>
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

  const shared = cn(
    "inline-flex min-h-[52px] items-center justify-center rounded-[1rem] px-6 text-sm font-black shadow-md",
    className,
  );

  if (platform === "ios") {
    if (iosUrl) {
      return (
        <a href={iosUrl} className={cn(shared, "text-white", appDashboardBrandGradientFillClass)}>
          ติดตั้งแอป iOS
        </a>
      );
    }
    return (
      <Link
        href="/download-app#ios"
        className={cn(shared, "border-2 border-white/80 bg-white/90 text-[#4d47b6]")}
      >
        คู่มือ iPhone / iPad
      </Link>
    );
  }

  return (
    <a
      href={MAWELL_ANDROID_APK_PATH}
      download
      className={cn(shared, "text-white", appDashboardBrandGradientFillClass)}
    >
      {platform === "android" ? "ติดตั้งแอป Android" : "ติดตั้งบนมือถือ"}
    </a>
  );
}
