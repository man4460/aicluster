"use client";

import { useState } from "react";

export function DormInvoiceCopyLink({
  url,
  qrDataUrl,
}: {
  url: string;
  /** data:image/png;base64,... จาก buildUrlQrDataUrl */
  qrDataUrl?: string | null;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {qrDataUrl ? (
          <div className="mx-auto shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:mx-0">
            <img
              src={qrDataUrl}
              alt="สแกนเพื่อเปิดหน้าอัปโหลดสลิป"
              width={112}
              height={112}
              className="h-28 w-28 object-contain"
            />
            <p className="mt-1 text-center text-[10px] font-medium text-slate-600">สแกนแนบสลิป</p>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-600">ลิงก์ให้ผู้พักอัปโหลดสลิป</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-800">{url}</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setMsg("คัดลอกแล้ว");
                setTimeout(() => setMsg(null), 2000);
              } catch {
                setMsg("คัดลอกไม่ได้ — ลองเลือกข้อความด้วยมือ");
              }
            }}
            className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            คัดลอกลิงก์
          </button>
          {msg ? <p className="mt-2 text-xs text-emerald-700">{msg}</p> : null}
        </div>
      </div>
    </div>
  );
}
