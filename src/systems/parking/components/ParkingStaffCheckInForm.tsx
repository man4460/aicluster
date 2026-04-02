"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";

export function ParkingStaffCheckInForm({ spotId }: { spotId: number }) {
  const router = useRouter();
  const [licensePlate, setLicensePlate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shuttleFrom, setShuttleFrom] = useState("");
  const [shuttleTo, setShuttleTo] = useState("");
  const [shuttleNote, setShuttleNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/parking/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId,
          licensePlate: licensePlate.trim(),
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          shuttleFrom: shuttleFrom.trim() || null,
          shuttleTo: shuttleTo.trim() || null,
          shuttleNote: shuttleNote.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "เช็คอินไม่สำเร็จ");
        return;
      }
      setLicensePlate("");
      setCustomerName("");
      setCustomerPhone("");
      setShuttleFrom("");
      setShuttleTo("");
      setShuttleNote("");
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-xs font-semibold text-slate-700">เช็คอิน (พนักงาน)</p>
      <input
        required
        className={parkingField}
        value={licensePlate}
        onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
        placeholder="ทะเบียนรถ"
        maxLength={24}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className={parkingField}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="ชื่อลูกค้า"
          maxLength={100}
        />
        <input
          className={parkingField}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="เบอร์โทร"
          maxLength={32}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className={parkingField}
          value={shuttleFrom}
          onChange={(e) => setShuttleFrom(e.target.value)}
          placeholder="รับจาก"
          maxLength={255}
        />
        <input
          className={parkingField}
          value={shuttleTo}
          onChange={(e) => setShuttleTo(e.target.value)}
          placeholder="ไปที่"
          maxLength={255}
        />
      </div>
      <textarea
        className={`${parkingField} min-h-[64px]`}
        value={shuttleNote}
        onChange={(e) => setShuttleNote(e.target.value)}
        placeholder="หมายเหตุรับส่ง"
        maxLength={2000}
      />
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      <button type="submit" disabled={loading} className={parkingBtnPrimary}>
        {loading ? "กำลังบันทึก…" : "บันทึกเช็คอิน"}
      </button>
    </form>
  );
}
