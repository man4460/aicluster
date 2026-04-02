"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parkingBtnSecondary, parkingField } from "@/systems/parking/parking-ui";

export function ParkingAddSpotForm() {
  const router = useRouter();
  const [spotCode, setSpotCode] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/parking/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotCode: spotCode.trim(),
          zoneLabel: zoneLabel.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setSpotCode("");
      setZoneLabel("");
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[140px] flex-1">
        <label className="block text-xs font-semibold text-slate-700">รหัสช่อง</label>
        <input
          className={`${parkingField} mt-1`}
          value={spotCode}
          onChange={(e) => setSpotCode(e.target.value)}
          placeholder="เช่น B-12"
          maxLength={24}
          required
        />
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="block text-xs font-semibold text-slate-700">โซน (ไม่บังคับ)</label>
        <input
          className={`${parkingField} mt-1`}
          value={zoneLabel}
          onChange={(e) => setZoneLabel(e.target.value)}
          placeholder="โซน B"
          maxLength={80}
        />
      </div>
      <button type="submit" disabled={loading} className={parkingBtnSecondary}>
        {loading ? "กำลังเพิ่ม…" : "+ เพิ่มช่อง"}
      </button>
      {err ? <p className="w-full text-sm text-red-700">{err}</p> : null}
    </form>
  );
}
