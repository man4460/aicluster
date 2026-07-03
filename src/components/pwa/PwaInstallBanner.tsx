"use client";

import Image from "next/image";
import { usePwaInstall } from "@/components/pwa/pwa-install-context";
import { MAWELL_PWA_ICON_192 } from "@/lib/pwa/brand-assets";
import { cn } from "@/lib/cn";

/** แบนเนอร์ติดตั้งแอป — แสดงบนมือถือ/iPad เมื่อยังไม่ติดตั้ง (เทียบ MelodyWebapp) */
export function PwaInstallBanner({ className }: { className?: string }) {
  const { showBanner, platform, canNativeInstall, installing, install, dismiss } = usePwaInstall();

  if (!showBanner) return null;

  const isIos = platform === "ios";
  const primaryLabel = isIos
    ? "วิธีติดตั้งแอป"
    : canNativeInstall
      ? installing
        ? "กำลังติดตั้ง…"
        : "ติดตั้งแอป"
      : "วิธีติดตั้งแอป";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[1.4rem] border border-emerald-400/30 bg-gradient-to-r from-emerald-500/12 via-sky-500/10 to-indigo-500/12 px-4 py-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Image
          src={MAWELL_PWA_ICON_192}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full shadow-md"
          unoptimized
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#1f2240]">ติดตั้ง MAWELL บนหน้าจอโฮม</div>
          <div className="mt-0.5 text-xs leading-relaxed text-[#5f6287]">
            ใช้งานเต็มจอเหมือนแอปจริง ไม่มีแถบ URL
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => void install()}
          disabled={installing}
          className="min-h-[40px] min-w-[40px] flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-60 sm:flex-none sm:min-w-0"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-[40px] flex-1 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs font-medium text-[#4d47b6] hover:bg-white/90 sm:flex-none"
          aria-label="ปิดคำแนะนำติดตั้งแอป"
        >
          ไว้ทีหลัง
        </button>
      </div>
    </div>
  );
}
