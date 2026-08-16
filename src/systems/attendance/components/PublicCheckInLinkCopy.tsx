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

export function PublicCheckInLinkCopy({
  url,
  title,
  description,
  tone = "violet",
}: {
  url: string;
  title?: string;
  /** คำอธิบายสั้น — ตัดด้วย line-clamp */
  description?: string;
  tone?: Tone;
}) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const hasUrl = Boolean(url?.trim());

  const copy = useCallback(async () => {
    if (!hasUrl) return;
    setErr(false);
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setErr(true);
    }
  }, [url, hasUrl]);

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
      <button
        type="button"
        onClick={() => void copy()}
        disabled={!hasUrl}
        className={cn(attendanceLinkActionBtnClass, "mt-3 w-full sm:mt-4")}
        aria-label={done ? "คัดลอกแล้ว" : `คัดลอก ${title ?? "ลิงก์"}`}
      >
        {done ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
      </button>
      {err ? (
        <p className="mt-2 text-[11px] font-medium text-red-600 line-clamp-2">คัดลอกไม่สำเร็จ — ลองใหม่</p>
      ) : null}
    </div>
  );
}
