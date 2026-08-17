"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { attendanceLinkActionBtnClass } from "@/systems/attendance/attendance-ui";

type Tone = "violet" | "emerald";

const toneShell: Record<Tone, string> = {
  violet:
    "border-white/50 bg-gradient-to-br from-white/55 via-indigo-50/35 to-violet-200/25",
  emerald:
    "border-white/50 bg-gradient-to-br from-white/55 via-emerald-50/35 to-teal-100/30",
};

const toneIcon: Record<Tone, string> = {
  violet: "bg-gradient-to-br from-[#5b61ff] to-[#7c66ff]",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600",
};

/** เตือนเมื่อลิงก์ยังใช้งานจริงไม่ได้ (เช่น ยังไม่เปิดสแกนใบหน้า / ยังไม่มีใบหน้าในระบบ) */
export type PublicCheckInLinkNotice = {
  text: string;
  tone?: "warn" | "info";
  href?: string;
  hrefLabel?: string;
};

export function PublicCheckInLinkCopy({
  url,
  title,
  description,
  tone = "violet",
  notice,
}: {
  url: string;
  title?: string;
  /** คำอธิบายสั้น — ตัดด้วย line-clamp */
  description?: string;
  tone?: Tone;
  notice?: PublicCheckInLinkNotice;
}) {
  const [done, setDone] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const hasUrl = Boolean(url?.trim());

  const copy = useCallback(async () => {
    if (!hasUrl) return;
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      // เบราว์เซอร์บล็อกคลิปบอร์ด (เช่นเปิดผ่าน http) — โชว์ลิงก์ให้คัดลอกมือ
      setShowUrl(true);
    }
  }, [url, hasUrl]);

  const noticeWarn = notice?.tone !== "info";

  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col rounded-[1.5rem] border p-3 shadow-[0_14px_32px_-24px_rgba(30,27,75,0.28)] ring-1 ring-inset ring-white/55 backdrop-blur-xl sm:p-4",
        toneShell[tone],
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md sm:h-11 sm:w-11",
            toneIcon[tone],
          )}
          aria-hidden
        >
          {tone === "emerald" ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="9" r="3" />
              <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-balance text-sm font-black leading-snug text-[#1e1b4b] line-clamp-2 sm:text-base">
            {title ?? "ลิงก์เช็คอิน"}
          </p>
          <p className="mt-1 text-[11px] font-medium leading-snug text-[#66638c] line-clamp-2 sm:text-xs">
            {description ?? "คัดลอกลิงก์ไปใช้"}
          </p>
        </div>
      </div>

      {notice ? (
        <div
          className={cn(
            "mt-2.5 rounded-xl border px-2.5 py-2",
            noticeWarn ? "border-amber-300/80 bg-amber-50/90" : "border-[#d8d6ec] bg-white/70",
          )}
        >
          <p
            className={cn(
              "text-[11px] font-semibold leading-snug",
              noticeWarn ? "text-amber-950" : "text-[#5f5a8a]",
            )}
          >
            {notice.text}
          </p>
          {notice.href ? (
            <a
              href={notice.href}
              className={cn(
                "mt-1 inline-block text-[11px] font-black underline",
                noticeWarn ? "text-amber-900" : "text-[#4d47b6]",
              )}
            >
              {notice.hrefLabel ?? "ไปตั้งค่า"}
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!hasUrl}
          className={cn(attendanceLinkActionBtnClass, "min-w-0 flex-1")}
          aria-label={done ? "คัดลอกแล้ว" : `คัดลอก ${title ?? "ลิงก์"}`}
        >
          {done ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </button>
        {hasUrl ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={cn(attendanceLinkActionBtnClass, "shrink-0 px-3")}
            aria-label={`เปิด ${title ?? "ลิงก์"} ในแท็บใหม่`}
            title="เปิดลิงก์ในแท็บใหม่"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
              <path d="M14 4h6v6M20 4l-8 8" strokeLinecap="round" />
              <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" strokeLinecap="round" />
            </svg>
          </a>
        ) : null}
      </div>
      {showUrl && hasUrl ? (
        <p className="mt-2 break-all rounded-lg border border-[#e8e6fc] bg-white/80 px-2 py-1.5 font-mono text-[10px] text-[#4d47b6]">
          {url}
        </p>
      ) : null}
    </div>
  );
}
