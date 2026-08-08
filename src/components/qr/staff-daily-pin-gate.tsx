"use client";

import { useState } from "react";
import { shopQrTemplatePageBgClass } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import {
  storeStaffDailyUnlock,
  type StaffDailyPinModule,
} from "@/lib/modules/staff-daily-pin";

type Props = {
  module: StaffDailyPinModule;
  ownerId: string;
  shopLabel: string;
  unlockApiPath: string;
  staffQuery: string;
  onUnlocked: (token: string) => void;
};

/**
 * หน้าใส่รหัสเข้าลิงก์พนักงาน — ต้องใส่ทุกวันตามปฏิทินไทย
 */
export function StaffDailyPinGate({
  module,
  ownerId,
  shopLabel,
  unlockApiPath,
  staffQuery,
  onUnlocked,
}: Props) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${unlockApiPath}?${staffQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ pin }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        unlockToken?: string;
        error?: string;
      };
      if (!res.ok || !j.unlockToken?.trim()) {
        throw new Error(j.error ?? "รหัสไม่ถูกต้อง");
      }
      const token = j.unlockToken.trim();
      storeStaffDailyUnlock(module, ownerId, token);
      onUnlocked(token);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "รหัสไม่ถูกต้อง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(shopQrTemplatePageBgClass, "flex min-h-dvh items-center justify-center p-6")}>
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/60 bg-white/85 p-6 shadow-sm backdrop-blur-md"
      >
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/80">
            รหัสเข้าใช้งานประจำวัน
          </p>
          <h1 className="mt-1 text-lg font-black text-[#1e1b4b]">{shopLabel}</h1>
          <p className="mt-2 text-xs font-medium text-[#66638c]">
            ใส่รหัสที่เจ้าของตั้งในเมนูตั้งค่า — ใช้ได้ถึงสิ้นวันนี้ แล้วต้องใส่ใหม่ทุกวัน
          </p>
        </div>
        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {err}
          </p>
        ) : null}
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">รหัส</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="app-input w-full rounded-xl"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            disabled={busy}
            autoFocus
          />
        </label>
        <button
          type="submit"
          disabled={busy || pin.trim().length < 4}
          className="app-btn-primary min-h-[48px] w-full rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {busy ? "กำลังตรวจสอบ…" : "เข้าใช้งาน"}
        </button>
      </form>
    </div>
  );
}
