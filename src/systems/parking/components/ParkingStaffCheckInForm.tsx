"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AppPaymentMethodPanel,
  type AppPaymentInfo,
  type AppPaymentMethod,
} from "@/components/app-templates";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";
import { printParkingReceipt } from "@/systems/parking/lib/parking-print-docs";
import { useParkingApiFetch } from "@/systems/parking/lib/staff-api-fetch";

export function ParkingStaffCheckInForm({
  spotId,
  estimatedAmountBaht,
}: {
  spotId: number;
  estimatedAmountBaht: number | null;
}) {
  const router = useRouter();
  const apiFetch = useParkingApiFetch();
  const [licensePlate, setLicensePlate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shuttleFrom, setShuttleFrom] = useState("");
  const [shuttleTo, setShuttleTo] = useState("");
  const [shuttleNote, setShuttleNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<AppPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const amountPaidBaht = Math.max(0, estimatedAmountBaht ?? 0);

  const fetchPayInfo = useCallback(async (amountBaht: number): Promise<AppPaymentInfo> => {
    const res = await apiFetch("/api/parking/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountBaht }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "โหลดข้อมูลชำระเงินไม่สำเร็จ");
    return data as AppPaymentInfo;
  }, [apiFetch]);

  const uploadSlip = useCallback(async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiFetch("/api/parking/upload", { method: "POST", body: form });
    const data = await res.json();
    const url = data.imageUrl ?? data.url;
    if (!res.ok || typeof url !== "string") throw new Error(data.error ?? "อัปโหลดสลิปไม่สำเร็จ");
    return url;
  }, [apiFetch]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch("/api/parking/sessions", {
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
          paymentMethod,
          paymentSlipUrl,
          amountPaidBaht,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        session?: { id: number; licensePlate: string; amountPaidBaht?: number };
      };
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
      setPaymentSlipUrl(null);
      if (data.session && amountPaidBaht > 0) {
        printParkingReceipt({
          sessionId: data.session.id,
          licensePlate: data.session.licensePlate,
          amountPaidBaht,
          paymentMethod,
        });
      }
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
      {estimatedAmountBaht != null ? (
        <AppPaymentMethodPanel
          amountBaht={amountPaidBaht}
          method={paymentMethod}
          slipUrl={paymentSlipUrl}
          onMethodChange={setPaymentMethod}
          onSlipUrlChange={setPaymentSlipUrl}
          fetchPayInfo={fetchPayInfo}
          uploadSlip={uploadSlip}
          disabled={loading}
          variant="staff"
        />
      ) : (
        <p className="rounded-xl bg-amber-50/80 p-3 text-xs font-semibold text-amber-800">
          รายชั่วโมงจะคิดยอดและรับชำระตอนเช็คเอาต์
        </p>
      )}
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      <button type="submit" disabled={loading} className={parkingBtnPrimary}>
        {loading ? "กำลังบันทึก…" : "บันทึกเช็คอิน"}
      </button>
    </form>
  );
}
