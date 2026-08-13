"use client";

import { useCallback, useEffect, useState } from "react";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  normalizeCarWashPortalPaymentMode,
  type CarWashPortalBookingPaymentMode,
} from "@/lib/car-wash/portal-booking";
import {
  carWashFieldClass,
  carWashPrimaryTabPillClass,
  carWashPrimaryTabShellClass,
} from "@/systems/car-wash/car-wash-ui-tokens";

const MODES: { value: CarWashPortalBookingPaymentMode; label: string; hint: string }[] = [
  { value: "NONE", label: "ไม่ต้องชำระ", hint: "จองคิวได้เลย ไม่บังคับมัดจำ" },
  { value: "DEPOSIT", label: "มัดจำ", hint: "ต้องชำระมัดจำตอนจองจากลิงก์ลูกค้า" },
  { value: "FULL", label: "ชำระเต็มยอด", hint: "ต้องชำระเต็มราคาก่อนยืนยันคิว" },
];

export function CarWashBookingPaymentSettings() {
  const [mode, setMode] = useState<CarWashPortalBookingPaymentMode>("NONE");
  const [deposit, setDeposit] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/car-wash/session/booking-payment", { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as {
        bookingPayment?: { portalBookingPaymentMode?: string; depositAmountBaht?: number | null };
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "โหลดไม่สำเร็จ");
        return;
      }
      setMode(normalizeCarWashPortalPaymentMode(j.bookingPayment?.portalBookingPaymentMode));
      setDeposit(j.bookingPayment?.depositAmountBaht ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/car-wash/session/booking-payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          portalBookingPaymentMode: mode,
          depositAmountBaht: mode === "DEPOSIT" ? (deposit === "" ? null : Number(deposit)) : null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        bookingPayment?: { portalBookingPaymentMode?: string; depositAmountBaht?: number | null };
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMode(normalizeCarWashPortalPaymentMode(j.bookingPayment?.portalBookingPaymentMode));
      setDeposit(j.bookingPayment?.depositAmountBaht ?? "");
      setMsg("บันทึกการชำระตอนจองแล้ว");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppDashboardSection tone="violet" className="space-y-4">
      <AppSectionHeader
        tone="violet"
        title="ชำระตอนจองคิว"
        description="ใช้กับลิงก์จองลูกค้า — แบบเดียวกับสนามฟุตบอล"
      />
      {loading ? (
        <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : (
        <div className="space-y-4">
          {err ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{err}</p> : null}
          {msg ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{msg}</p> : null}
          <div
            className={cn(carWashPrimaryTabShellClass, "flex flex-wrap gap-1.5")}
            role="radiogroup"
            aria-label="โหมดชำระตอนจอง"
          >
            {MODES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={mode === opt.value}
                disabled={saving}
                onClick={() => setMode(opt.value)}
                className={carWashPrimaryTabPillClass(mode === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#5f5a8a]">{MODES.find((m) => m.value === mode)?.hint}</p>
          {mode === "DEPOSIT" ? (
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">จำนวนมัดจำ (บาท)</span>
              <input
                type="number"
                min={1}
                className={carWashFieldClass}
                value={deposit}
                disabled={saving}
                onChange={(e) => setDeposit(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold"
          >
            {saving ? "กำลังบันทึก…" : "บันทึกโหมดชำระจอง"}
          </button>
        </div>
      )}
    </AppDashboardSection>
  );
}
