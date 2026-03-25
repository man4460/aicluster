"use client";

import { useCallback, useState } from "react";

export function PublicCheckInLinkCopy({ url, title }: { url: string; title?: string }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);

  const copy = useCallback(async () => {
    setErr(false);
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setErr(true);
    }
  }, [url]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">
        {title ?? "ลิงก์เช็คชื่อสาธารณะ (แขก / พนักงานไม่ล็อกอิน)"}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        แชร์ลิงก์นี้หรือทำ QR — ไม่ต้องจำรหัส <code className="rounded bg-slate-100 px-1">ownerId</code>{" "}
        (อยู่ในท้าย URL แล้ว)
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="block flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a6]"
        >
          {done ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </button>
      </div>
      {err ? <p className="mt-2 text-xs text-red-600">คัดลอกไม่สำเร็จ — ลองเลือกข้อความแล้วคัดลอกเอง</p> : null}
    </div>
  );
}
