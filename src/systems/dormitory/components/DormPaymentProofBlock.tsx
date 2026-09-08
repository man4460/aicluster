"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppImageLightbox, AppLabeledImageThumb, useAppImageLightbox } from "@/components/app-templates";
import { useDormitoryApiFetch } from "@/systems/dormitory/lib/staff-api-fetch";

export function DormPaymentProofBlock({
  paymentId,
  initialUrl,
  onChanged,
}: {
  paymentId: number;
  initialUrl: string | null;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const apiFetch = useDormitoryApiFetch();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lb = useAppImageLightbox();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await apiFetch(`/api/dorm/payments/${paymentId}/proof`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { proofSlipUrl?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      if (data.proofSlipUrl) setUrl(data.proofSlipUrl);
      if (onChanged) onChanged();
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    if (!confirm("ลบสลิปออกจากระบบ?")) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await apiFetch(`/api/dorm/payments/${paymentId}/proof`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "ลบไม่สำเร็จ");
        return;
      }
      setUrl(null);
      if (onChanged) onChanged();
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
      <p className="font-semibold text-slate-800">สลิปโอนเงิน</p>
      {err ? <p className="mt-1 text-red-600">{err}</p> : null}
      {url ? (
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <AppLabeledImageThumb
            src={url}
            kind="slip"
            alt="สลิปโอนเงิน"
            onOpen={() => lb.open(url)}
            className="h-20 w-20"
          />
          <div className="min-w-0 space-y-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onClear()}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              ลบสลิป
            </button>
          </div>
          <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปโอนเงิน" />
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
