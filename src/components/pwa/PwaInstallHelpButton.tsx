"use client";

import { usePwaInstall } from "@/components/pwa/pwa-install-context";
import { cn } from "@/lib/cn";

/** ปุ่มเปิดคู่มือติดตั้ง — แสดงบนมือถือ/iPad ตลอดเมื่อยังไม่ได้ติดตั้ง (แม้กดไว้ทีหลังแล้ว) */
export function PwaInstallHelpButton({ className }: { className?: string }) {
  const { isStandalone, isMobile, openInstallGuide, installing } = usePwaInstall();

  if (isStandalone || !isMobile) return null;

  return (
    <button
      type="button"
      onClick={() => openInstallGuide()}
      disabled={installing}
      aria-label="วิธีติดตั้งแอปบนหน้าจอโฮม"
      title="ติดตั้งแอป"
      className={cn(
        "inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/45 bg-white/20 px-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-white/30 active:scale-95 disabled:opacity-60 sm:min-h-[40px] sm:px-3 sm:text-xs",
        className,
      )}
    >
      <svg
        className="h-4 w-4 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.85}
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 3v13.5m0 0 4.5-4.5M12 16.5 7.5 12"
        />
      </svg>
      <span className="sr-only sm:not-sr-only">ติดตั้งแอป</span>
    </button>
  );
}
