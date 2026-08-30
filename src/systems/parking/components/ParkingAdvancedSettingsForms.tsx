"use client";

import { useState } from "react";
import { AppModuleShopPaymentFields } from "@/components/app-templates";
import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { cn } from "@/lib/cn";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";
import { parkingPrimaryTabPillClass } from "@/systems/parking/parking-ui-tokens";

const BOOKING_PAYMENT_MODES: { value: "NONE" | "DEPOSIT" | "FULL"; label: string }[] = [
  { value: "NONE", label: "ไม่เก็บมัดจำ" },
  { value: "DEPOSIT", label: "มัดจำ" },
  { value: "FULL", label: "เต็ม" },
];

export function ParkingPaymentAccountForm({
  initial,
}: {
  initial: Pick<ModuleShopPaymentDto, "promptPayPhone" | "bankName" | "bankAccountNumber" | "bankAccountName">;
}) {
  const [value, setValue] = useState<ModuleShopPaymentDto>({
    ...initial,
    promptPayQrImageUrl: null,
    taxId: null,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/parking/site", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    setMessage(res.ok ? "บันทึกบัญชีรับชำระแล้ว" : "บันทึกไม่สำเร็จ");
    setBusy(false);
  }
  return (
    <div className="space-y-3">
      <AppModuleShopPaymentFields value={value} onChange={setValue} fieldClassName={`${parkingField} mt-1`} />
      {message ? <p className="text-xs font-semibold text-[#4d47b6]">{message}</p> : null}
      <button type="button" className={parkingBtnPrimary} disabled={busy} onClick={() => void save()}>
        {busy ? "กำลังบันทึก…" : "บันทึกบัญชีรับชำระ"}
      </button>
    </div>
  );
}

export function ParkingBookingPaymentSettings({
  initialMode,
  initialPercent,
}: {
  initialMode: "NONE" | "DEPOSIT" | "FULL";
  initialPercent: number | null;
}) {
  const [mode, setMode] = useState(initialMode);
  const [percent, setPercent] = useState(String(initialPercent ?? 30));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    const res = await fetch("/api/parking/site", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingPaymentMode: mode, depositPercent: mode === "DEPOSIT" ? Number(percent) : null }),
    });
    setMessage(res.ok ? "บันทึกการรับชำระการจองแล้ว" : "บันทึกไม่สำเร็จ");
    setBusy(false);
  }
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-[#66638c]">การจองใหม่คิดแบบเหมารายวัน และคำนวณจากราคาต่อวันของลาน</p>
      <div className="rounded-2xl border border-white/60 bg-white/40 p-3 sm:p-4">
        <p className="text-xs font-bold text-[#5f5a8a]">ชำระตอนจอง</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="โหมดชำระตอนจอง">
          {BOOKING_PAYMENT_MODES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={mode === opt.value}
              disabled={busy}
              onClick={() => setMode(opt.value)}
              className={parkingPrimaryTabPillClass(mode === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {mode === "DEPOSIT" ? (
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-bold text-[#5f5a8a]">มัดจำ (%)</span>
            <input
              className={cn(parkingField, "mt-1")}
              type="number"
              min={0}
              max={100}
              disabled={busy}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </label>
        ) : null}
      </div>
      {message ? <p className="text-xs font-semibold text-[#4d47b6]">{message}</p> : null}
      <button type="button" className={parkingBtnPrimary} disabled={busy} onClick={() => void save()}>
        {busy ? "กำลังบันทึก…" : "บันทึกการจอง"}
      </button>
    </div>
  );
}

export function ParkingLoyaltySettings({
  initialEnabled,
  initialBahtPerPoint,
  initialPointsPerUnit,
}: {
  initialEnabled: boolean;
  initialBahtPerPoint: number;
  initialPointsPerUnit: number;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [baht, setBaht] = useState(String(initialBahtPerPoint));
  const [points, setPoints] = useState(String(initialPointsPerUnit));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    const res = await fetch("/api/parking/session/loyalty", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, baht_per_point: Number(baht), points_per_unit: Number(points) }),
    });
    setMessage(res.ok ? "บันทึกระบบสะสมคะแนนแล้ว" : "บันทึกไม่สำเร็จ");
    setBusy(false);
  }
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-bold text-[#4d47b6]">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        เปิดระบบสะสมคะแนน
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-[#5f5a8a]">ยอดชำระต่อหน่วยคะแนน (บาท)<input className={`${parkingField} mt-1`} type="number" min={1} value={baht} onChange={(e) => setBaht(e.target.value)} /></label>
        <label className="text-xs font-bold text-[#5f5a8a]">คะแนนที่ได้รับต่อหน่วย<input className={`${parkingField} mt-1`} type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} /></label>
      </div>
      <p className="text-xs font-semibold text-[#66638c]">ทุก {Number(baht || 0).toLocaleString("th-TH")} บาท ได้ {Number(points || 0).toLocaleString("th-TH")} คะแนน</p>
      {message ? <p className="text-xs font-semibold text-[#4d47b6]">{message}</p> : null}
      <button type="button" className={parkingBtnPrimary} disabled={busy} onClick={() => void save()}>
        {busy ? "กำลังบันทึก…" : "บันทึกคะแนน"}
      </button>
    </div>
  );
}
