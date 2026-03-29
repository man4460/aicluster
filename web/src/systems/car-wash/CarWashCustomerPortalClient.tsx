"use client";

import { useMemo, useState } from "react";
import type { WashBundle } from "@/systems/car-wash/car-wash-service";

export function CarWashCustomerPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId?: string;
  trialSessionId?: string;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [bundles, setBundles] = useState<WashBundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const selected = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) ?? null,
    [bundles, selectedBundleId],
  );

  function normalizePlate(value: string): string {
    // Keep only Thai/English letters and digits so formats like "กข-1234", "กข 1234" match the same key.
    return value.trim().toLowerCase().replace(/[^0-9a-zA-Zก-๙]/g, "");
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBundles([]);
    setSelectedBundleId(null);
    const raw = query.trim();
    const digits = raw.replace(/\D/g, "");
    const plate = normalizePlate(raw);
    const canSearchPhone = digits.length >= 9;
    const canSearchPlate = plate.length >= 2;
    if (!canSearchPhone && !canSearchPlate) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก หรือทะเบียนรถอย่างน้อย 2 ตัวอักษร");
      return;
    }
    setLoading(true);
    try {
      if (!ownerId) {
        setErr("ไม่พบข้อมูลเจ้าของร้าน");
        return;
      }
      const res = await fetch("/api/car-wash/public/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          query: raw,
          trialSessionId: trialSessionId ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; bundles?: WashBundle[] };
      if (!res.ok) {
        setErr(data.error || "ค้นหาไม่สำเร็จ");
        return;
      }
      const found = data.bundles ?? [];
      if (found.length === 0) {
        setErr("ไม่พบแพ็กเกจเหมาจากข้อมูลที่ค้นหา");
        return;
      }
      setBundles(found);
      const firstActive = found.find((b) => b.is_active && b.used_uses < b.total_uses) ?? found[0] ?? null;
      setSelectedBundleId(firstActive?.id ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function onCheckIn() {
    setErr(null);
    setMsg(null);
    if (!selectedBundleId || !selected) {
      setErr("เลือกแพ็กเกจก่อน");
      return;
    }
    if (!selected.is_active || selected.used_uses >= selected.total_uses) {
      setErr("แพ็กเกจนี้หมดสิทธิ์หรือไม่พร้อมใช้งาน");
      return;
    }
    setCheckInLoading(true);
    try {
      if (!ownerId) {
        setErr("ไม่พบข้อมูลเจ้าของร้าน");
        return;
      }
      const res = await fetch("/api/car-wash/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          bundleId: selectedBundleId,
          trialSessionId: trialSessionId ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; bundle?: WashBundle };
      if (!res.ok || !data.ok || !data.bundle) {
        setErr(data.error || "ไม่สามารถตัดสิทธิ์ได้");
        return;
      }
      const consumed = data.bundle;
      const remain = Math.max(0, consumed.total_uses - consumed.used_uses);
      setBundles((prev) => prev.map((b) => (b.id === consumed.id ? consumed : b)));
      setMsg(`บันทึกการใช้บริการแล้ว เหลืออีก ${remain} ครั้ง`);
    } finally {
      setCheckInLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md space-y-5 px-4 pb-16 pt-8">
      <header className="text-center">
        <h1 className="text-xl font-bold text-slate-900">คาร์แคร์สมาชิก</h1>
        <p className="mt-1 text-sm text-slate-600">กรอกเบอร์โทรหรือทะเบียนรถ แล้วกดยืนยันใช้งานแพ็กเกจเหมา</p>
      </header>

      <form onSubmit={onSearch} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
          placeholder="เบอร์โทรลูกค้า หรือทะเบียนรถ"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 40))}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#4d47b6] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "กำลังค้นหา..." : "ค้นหาแพ็กเกจ"}
        </button>
      </form>

      {bundles.length > 0 ? (
        <section className="space-y-2 rounded-2xl border border-[#e1e3ff] bg-[#f8f8ff] p-3">
          {bundles.map((b) => {
            const remain = Math.max(0, b.total_uses - b.used_uses);
            const canUse = b.is_active && remain > 0;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBundleId(b.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left ${
                  selectedBundleId === b.id ? "border-[#4d47b6] bg-white" : "border-[#e1e3ff] bg-white/70"
                }`}
              >
                <p className="text-sm font-semibold text-[#2e2a58]">{b.package_name}</p>
                <p className="text-xs text-[#66638c]">
                  {b.customer_name} / {b.plate_number}
                </p>
                <p className={`mt-1 text-sm font-bold ${canUse ? "text-emerald-700" : "text-amber-800"}`}>
                  คงเหลือ {remain} ครั้ง
                </p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void onCheckIn()}
            disabled={!selected || checkInLoading}
            className="mt-2 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {checkInLoading ? "กำลังบันทึก..." : "ยืนยันใช้บริการ (หัก 1 ครั้ง)"}
          </button>
        </section>
      ) : null}

      {msg ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p> : null}
      {err ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p> : null}
    </div>
  );
}

