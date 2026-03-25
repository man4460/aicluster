"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DormPaymentProofBlock({
  paymentId,
  initialUrl,
}: {
  paymentId: number;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch(`/api/dorm/payments/${paymentId}/proof`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { proofSlipUrl?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      if (data.proofSlipUrl) setUrl(data.proofSlipUrl);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    if (!confirm("ลบสลิปออกจากระบบ?")) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/dorm/payments/${paymentId}/proof`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "ลบไม่สำเร็จ");
        return;
      }
      setUrl(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
      <p className="font-semibold text-slate-800">สลิปโอนเงิน</p>
      {err ? <p className="mt-1 text-red-600">{err}</p> : null}
      {url ? (
        <div className="mt-2 space-y-2">
          <a href={url} target="_blank" rel="noreferrer" className="text-[#0000BF] underline">
            เปิดดูสลิป
          </a>
          <div className="max-h-40 max-w-[200px] overflow-hidden rounded border border-slate-200 bg-white">
            <img src={url} alt="" className="h-full w-full object-contain" />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onClear()}
            className="text-red-600 hover:underline disabled:opacity-50"
          >
            ลบสลิป
          </button>
        </div>
      ) : (
        <label className="mt-2 inline-flex cursor-pointer text-[#0000BF] hover:underline">
          {busy ? "กำลังอัปโหลด…" : "อัปโหลดสลิป (แทนผู้พัก)"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        </label>
      )}
    </div>
  );
}
