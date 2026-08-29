"use client";

import { useState } from "react";

export function VillagePublicSlipForm({ token, hasPendingSlip }: { token: string; hasPendingSlip?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("token", token);
      fd.set("file", f);
      const res = await fetch("/api/village/public/payment-proof", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      setDone(true);
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center text-emerald-900">
        <p className="font-semibold">ส่งสลิปแล้ว รอแอดมินตรวจสอบ</p>
        <p className="mt-2 text-sm text-emerald-800">
          นิติบุคคลจะตรวจสลิปและอนุมัติรับชำระ — ยอดจะอัปเดตหลังอนุมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">แนบสลิปการโอน</h2>
      <p className="mt-2 text-sm text-slate-600">
        เลือกรูปสลิป (JPG / PNG / WEBP) ไม่เกิน 4MB — หลังส่งแล้วนิติบุคคลจะตรวจสอบและอนุมัติรับชำระ
      </p>
      {hasPendingSlip ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          มีสลิปของงวดนี้รอตรวจอยู่แล้ว — ส่งใหม่ได้ถ้าต้องการแก้รูป
        </p>
      ) : null}
      {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}
      <label className="mt-6 flex min-h-[52px] cursor-pointer items-center justify-center rounded-xl bg-[#0000BF] px-4 text-sm font-semibold text-white hover:bg-[#0000a6]">
        {busy ? "กำลังอัปโหลด…" : "เลือกไฟล์สลิป"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={busy}
          onChange={onFile}
        />
      </label>
    </div>
  );
}
