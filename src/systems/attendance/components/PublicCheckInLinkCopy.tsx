"use client";

import { useCallback, useState } from "react";
import { attendanceLinkActionBtnClass } from "@/systems/attendance/attendance-ui";

export function PublicCheckInLinkCopy({ url, title }: { url: string; title?: string }) {
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
    <div className="app-surface rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#2e2a58]">
            {title ?? "ลิงก์เช็คอินสาธารณะ (แขก / พนักงานไม่ล็อกอิน)"}
          </p>
          <p className="mt-1 text-xs leading-snug text-[#66638c]">แชร์ลิงก์หรือทำ QR — กดคัดลอกแล้วส่งต่อ</p>
        </div>
        <button type="button" onClick={() => void copy()} disabled={!hasUrl} className={attendanceLinkActionBtnClass}>
          {done ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </button>
      </div>
      {err ? (
        <p className="mt-2 text-xs text-red-600">คัดลอกไม่สำเร็จ — ลองอนุญาตคลิปบอร์ดหรือเปิดหน้าใน HTTPS</p>
      ) : null}
    </div>
  );
}
