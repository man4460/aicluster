"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";

export function ParkingSiteSettingsForm({
  initialName,
  initialMode,
  initialHourly,
  initialDaily,
}: {
  initialName: string;
  initialMode: "HOURLY" | "DAILY";
  initialHourly: number | null;
  initialDaily: number | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pricingMode, setPricingMode] = useState<"HOURLY" | "DAILY">(initialMode);
  const [hourly, setHourly] = useState(initialHourly?.toString() ?? "");
  const [daily, setDaily] = useState(initialDaily?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/parking/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          pricingMode,
          hourlyRateBaht: hourly.trim() === "" ? null : Number(hourly),
          dailyRateBaht: daily.trim() === "" ? null : Number(daily),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกแล้ว");
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700">ชื่อลานจอด</label>
        <input
          className={`${parkingField} mt-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700">โหมดคิดเงิน</label>
        <select
          className={`${parkingField} mt-1`}
          value={pricingMode}
          onChange={(e) => setPricingMode(e.target.value as "HOURLY" | "DAILY")}
        >
          <option value="HOURLY">รายชั่วโมง (ปัดขึ้น)</option>
          <option value="DAILY">เหมารายวัน (ปฏิทินไทย)</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">บาท / ชั่วโมง</label>
          <input
            type="number"
            min={0}
            step={1}
            className={`${parkingField} mt-1 tabular-nums`}
            value={hourly}
            onChange={(e) => setHourly(e.target.value)}
            disabled={pricingMode !== "HOURLY"}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">บาท / วัน</label>
          <input
            type="number"
            min={0}
            step={1}
            className={`${parkingField} mt-1 tabular-nums`}
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            disabled={pricingMode !== "DAILY"}
          />
        </div>
      </div>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      <button type="submit" disabled={loading} className={parkingBtnPrimary}>
        {loading ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}
