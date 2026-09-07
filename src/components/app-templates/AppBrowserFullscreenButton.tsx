"use client";

import { cn } from "@/lib/cn";
import { useAppBrowserFullscreen } from "./useAppBrowserFullscreen";

function IconEnterFullscreen({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function IconExitFullscreen({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

export type AppBrowserFullscreenButtonProps = {
  className?: string;
  /** ซ่อนข้อความบน sm+ (header ใช้ไอคอนอย่างเดียวบนมือถือ) */
  iconOnly?: boolean;
};

/**
 * สลับโหมดเต็มจอของเบราว์เซอร์ (ซ่อนแถบ URL / แท็บบนเดสก์ท็อป · Android Chrome)
 * ต้องกดปุ่มเอง — iOS / เบราว์เซอร์ที่ไม่รองรับ Fullscreen API ใช้โหมด CSS สำรอง
 */
export function AppBrowserFullscreenButton({
  className,
  iconOnly = true,
}: AppBrowserFullscreenButtonProps) {
  const { pinned, hideControl, toggle } = useAppBrowserFullscreen();

  if (hideControl) return null;

  const label = pinned ? "ออกจากโหมดเต็มจอ" : "แสดงเต็มจอ";
  const hint = pinned
    ? "กดปุ่มนี้เพื่อออก — โหมดเต็มจอจะคงอยู่แม้พิมพ์เอกสาร"
    : "ซ่อนแถบ URL และเมนูของเบราว์เซอร์ (มือถือบางเครื่องใช้โหมดขยายเต็มพื้นที่)";

  return (
    <button
      type="button"
      suppressHydrationWarning
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-white/90 transition-colors hover:text-white active:scale-95 touch-manipulation",
        iconOnly ? "h-10 w-10 min-h-[40px] min-w-[40px]" : "min-h-[40px] gap-1.5 px-3 text-sm font-bold",
        className,
      )}
      aria-label={label}
      aria-pressed={pinned}
      title={`${label} — ${hint}`}
      onClick={() => {
        void toggle();
      }}
    >
      {pinned ? (
        <IconExitFullscreen className="h-[1.125rem] w-[1.125rem]" />
      ) : (
        <IconEnterFullscreen className="h-[1.125rem] w-[1.125rem]" />
      )}
      {!iconOnly ? <span className="hidden sm:inline">{label}</span> : null}
    </button>
  );
}
