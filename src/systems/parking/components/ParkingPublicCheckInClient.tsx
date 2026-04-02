"use client";

import { useEffect, useState } from "react";
import { parkingBtnPrimary, parkingCard, parkingField } from "@/systems/parking/parking-ui";

type SpotInfo = {
  spotCode: string;
  zoneLabel: string | null;
  siteName: string;
  pricingMode: string;
  hourlyRateBaht: number | null;
  dailyRateBaht: number | null;
  occupied: boolean;
};

export function ParkingPublicCheckInClient({ token }: { token: string }) {
  const [info, setInfo] = useState<SpotInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ spotCode: string; at: string } | null>(null);

  const [licensePlate, setLicensePlate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shuttleFrom, setShuttleFrom] = useState("");
  const [shuttleTo, setShuttleTo] = useState("");
  const [shuttleNote, setShuttleNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/parking/public/spot?token=${encodeURIComponent(token)}`, {
          signal: AbortSignal.timeout(20_000),
        });
        const data = (await res.json().catch(() => ({}))) as SpotInfo & { error?: string };
        if (!res.ok) {
          if (!cancelled) setErr(data.error ?? "โหลดไม่สำเร็จ");
          return;
        }
        if (!cancelled) setInfo(data as SpotInfo);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof DOMException && e.name === "AbortError" ? "หมดเวลารอ — ลองรีเฟรช" : "เชื่อมต่อไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/parking/public/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          token,
          licensePlate: licensePlate.trim(),
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          shuttleFrom: shuttleFrom.trim() || null,
          shuttleTo: shuttleTo.trim() || null,
          shuttleNote: shuttleNote.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        spotCode?: string;
        checkInAt?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "เช็คอินไม่สำเร็จ");
        return;
      }
      if (data.spotCode && data.checkInAt) {
        setDone({ spotCode: data.spotCode, at: data.checkInAt });
      }
    } catch {
      setErr("ส่งข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`${parkingCard} p-8 text-center text-sm text-slate-500`}>กำลังโหลด…</div>
    );
  }

  if (err && !info) {
    return (
      <div className={`${parkingCard} border-red-200 bg-red-50/80 p-6 text-center text-sm text-red-800`}>
        {err}
      </div>
    );
  }

  if (done) {
    return (
      <div className={`${parkingCard} p-8 text-center`}>
        <p className="text-lg font-semibold text-emerald-800">เช็คอินสำเร็จ</p>
        <p className="mt-2 text-sm text-slate-600">
          ช่อง <span className="font-bold tabular-nums">{done.spotCode}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">เวลาเข้า {new Date(done.at).toLocaleString("th-TH")}</p>
      </div>
    );
  }

  if (!info) return null;

  if (info.occupied) {
    return (
      <div className={`${parkingCard} border-amber-200 bg-amber-50/90 p-6 text-center`}>
        <p className="font-semibold text-amber-950">ช่อง {info.spotCode} มีผู้ใช้บริการอยู่</p>
        <p className="mt-2 text-sm text-amber-900/90">กรุณาใช้ช่องอื่น หรือแจ้งพนักงาน</p>
      </div>
    );
  }

  const rateLabel =
    info.pricingMode === "DAILY"
      ? info.dailyRateBaht != null
        ? `เหมาวันละ ${info.dailyRateBaht.toLocaleString("th-TH")} บาท (ปฏิทินไทย)`
        : "—"
      : info.hourlyRateBaht != null
        ? `ชม. ละ ${info.hourlyRateBaht.toLocaleString("th-TH")} บาท (ปัดขึ้น)`
        : "—";

  return (
    <div className={`${parkingCard} p-6 sm:p-8`}>
      <div className="border-b border-slate-100 pb-4">
        <p className="text-xs font-semibold text-slate-500">{info.siteName}</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">เช็คอินเช่าที่จอดรถ</h1>
        <p className="mt-1 text-sm text-slate-600">
          ช่อง <span className="font-bold tabular-nums">{info.spotCode}</span>
          {info.zoneLabel ? ` · ${info.zoneLabel}` : ""}
        </p>
        <p className="mt-2 text-xs text-slate-500">อัตรา: {rateLabel}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="plate" className="block text-xs font-semibold text-slate-700">
            ทะเบียนรถ <span className="text-red-600">*</span>
          </label>
          <input
            id="plate"
            required
            className={`${parkingField} mt-1`}
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            placeholder="เช่น 1กข 1234"
            maxLength={24}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700">
              ชื่อ (ไม่บังคับ)
            </label>
            <input
              id="name"
              className={`${parkingField} mt-1`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
              เบอร์โทร (ไม่บังคับ)
            </label>
            <input
              id="phone"
              className={`${parkingField} mt-1`}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              maxLength={32}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700">รับ-ส่ง (ไม่บังคับ)</p>
          <p className="text-[11px] text-slate-500">ระบุจุดรับและปลายทางหากต้องการให้ไปรับจากที่จอด</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input
              className={parkingField}
              value={shuttleFrom}
              onChange={(e) => setShuttleFrom(e.target.value)}
              placeholder="รับจาก (เช่น ช่อง A-01)"
              maxLength={255}
            />
            <input
              className={parkingField}
              value={shuttleTo}
              onChange={(e) => setShuttleTo(e.target.value)}
              placeholder="ไปที่ (เช่น อาคาร B ชั้น 3)"
              maxLength={255}
            />
          </div>
          <textarea
            className={`${parkingField} mt-2 min-h-[72px]`}
            value={shuttleNote}
            onChange={(e) => setShuttleNote(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม"
            maxLength={2000}
          />
        </div>
        {err ? <p className="text-sm text-red-700">{err}</p> : null}
        <button type="submit" disabled={submitting} className={`${parkingBtnPrimary} w-full sm:w-auto`}>
          {submitting ? "กำลังบันทึก…" : "ยืนยันเช็คอิน"}
        </button>
      </form>
    </div>
  );
}
