"use client";

import { useState } from "react";

export function DormPublicSlipForm({ token }: { token: string }) {
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
      const res = await fetch("/api/dorm/public/payment-proof", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center text-emerald-900">
        <p className="font-semibold">อัปโหลดสลิปเรียบร้อย</p>
        <p className="mt-2 text-sm text-emerald-800">เจ้าของหอจะตรวจสอบและยืนยันการชำระให้ครับ/ค่ะ</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">แนบสลิปการโอน</h1>
      <p className="mt-2 text-sm text-slate-600">
        เลือกรูปสลิป (JPG / PNG / WEBP) ไม่เกิน 3MB — หลังอัปโหลดเจ้าของหอจะตรวจก่อนยืนยันว่ารับเงินแล้ว
      </p>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      <label className="mt-6 flex min-h-[52px] cursor-pointer items-center justify-center rounded-xl bg-[#0000BF] px-4 text-sm font-semibold text-white hover:bg-[#0000a6]">
        {busy ? "กำลังอัปโหลด…" : "เลือกไฟล์สลิป"}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
      </label>
    </div>
  );
}
