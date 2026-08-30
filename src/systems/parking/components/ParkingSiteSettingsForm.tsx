"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";
import type { ParkingPricingMode } from "@/systems/parking/parking-module-nav";

export function ParkingSiteSettingsForm({
  initialName,
  initialMode,
  initialHourly,
  initialDaily,
  initialMonthly = null,
  siteId,
  showName = true,
  showPricing = true,
}: {
  initialName: string;
  initialMode: ParkingPricingMode;
  initialHourly: number | null;
  initialDaily: number | null;
  initialMonthly?: number | null;
  siteId?: number;
  showName?: boolean;
  showPricing?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pricingMode, setPricingMode] = useState<ParkingPricingMode>(initialMode);
  const [hourly, setHourly] = useState(initialHourly?.toString() ?? "");
  const [daily, setDaily] = useState(initialDaily?.toString() ?? "");
  const [monthly, setMonthly] = useState(initialMonthly?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    try {
      const body: Record<string, unknown> = {};
      if (siteId != null) body.siteId = siteId;
      if (showName) body.name = name.trim();
      if (showPricing) {
        body.pricingMode = pricingMode;
        body.hourlyRateBaht = hourly.trim() === "" ? null : Number(hourly);
        body.dailyRateBaht = daily.trim() === "" ? null : Number(daily);
        body.monthlyRateBaht = monthly.trim() === "" ? null : Number(monthly);
      }
      const res = await fetch("/api/parking/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      {showName ? (
        <div>
          <label className="block text-xs font-semibold text-[#5f5a8a]">ชื่อลานจอด</label>
          <input
            className={`${parkingField} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
          />
        </div>
      ) : null}
      {showPricing ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">โหมดคิดเงิน</label>
            <select
              className={`${parkingField} mt-1`}
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value as ParkingPricingMode)}
            >
              <option value="HOURLY">รายชั่วโมง (ปัดขึ้น)</option>
              <option value="DAILY">เหมารายวัน (ปฏิทินไทย)</option>
              <option value="MONTHLY">รายเดือน (ปฏิทินไทย)</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">บาท / ชั่วโมง</label>
              <input
                type="number"
                min={0}
                step={1}
                className={`${parkingField} mt-1 tabular-nums`}
                value={hourly}
                onChange={(e) => setHourly(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">บาท / วัน</label>
              <input
                type="number"
                min={0}
                step={1}
                className={`${parkingField} mt-1 tabular-nums`}
                value={daily}
                onChange={(e) => setDaily(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">บาท / เดือน</label>
              <input
                type="number"
                min={0}
                step={1}
                className={`${parkingField} mt-1 tabular-nums`}
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
              />
            </div>
          </div>
        </>
      ) : null}
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      <button type="submit" disabled={loading} className={parkingBtnPrimary}>
        {loading ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}
