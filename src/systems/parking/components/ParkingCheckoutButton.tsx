"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AppPaymentMethodPanel,
  type AppPaymentInfo,
  type AppPaymentMethod,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { parkingBtnPrimary } from "@/systems/parking/parking-ui";
import { printParkingReceipt } from "@/systems/parking/lib/parking-print-docs";
import { useParkingApiFetch } from "@/systems/parking/lib/staff-api-fetch";

export function ParkingCheckoutButton({
  sessionId,
  label = "เช็คเอาต์ / คิดเงิน",
  onComplete,
}: {
  sessionId: number;
  label?: string;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const apiFetch = useParkingApiFetch();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payNowBaht, setPayNowBaht] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<AppPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [printReceipt, setPrintReceipt] = useState(true);

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
    if (!res.ok || typeof data.imageUrl !== "string") throw new Error(data.error ?? "อัปโหลดสลิปไม่สำเร็จ");
    return data.imageUrl;
  }, [apiFetch]);

  async function openCheckout() {
    setErr(null);
    const res = await apiFetch(`/api/parking/sessions/${sessionId}/checkout`);
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "คำนวณยอดไม่สำเร็จ");
      return;
    }
    setPayNowBaht(Number(data.payNowBaht) || 0);
    setOpen(true);
  }

  async function confirm() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch(`/api/parking/sessions/${sessionId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaidBaht: payNowBaht, paymentMethod, paymentSlipUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        session?: { id: number; licensePlate: string; amountPaidBaht: number | null };
      };
      if (!res.ok) {
        setErr(data.error ?? "ไม่สำเร็จ");
        return;
      }
      setOpen(false);
      if (data.session && payNowBaht > 0 && printReceipt) {
        printParkingReceipt({
          sessionId: data.session.id,
          licensePlate: data.session.licensePlate,
          amountPaidBaht: payNowBaht,
          paymentMethod,
        });
      }
      router.refresh();
      onComplete?.();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className={parkingBtnPrimary} onClick={() => void openCheckout()} disabled={loading}>
        {label}
      </button>
      <FormModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="ยืนยันเช็คเอาต์?"
        description="คำนวณค่าจอดตามอัตราที่บันทึกตอนเช็คอิน และปิดเซสชันนี้"
        appearance="glass"
        footer={
          <FormModalFooterActions
            cancelLabel="ยกเลิก"
            onCancel={() => setOpen(false)}
            submitLabel="เช็คเอาต์"
            onSubmit={confirm}
            loading={loading}
            submitDisabled={loading}
          />
        }
      >
        <div className="space-y-3">
          <AppPaymentMethodPanel
            amountBaht={payNowBaht}
            method={paymentMethod}
            slipUrl={paymentSlipUrl}
            onMethodChange={setPaymentMethod}
            onSlipUrlChange={setPaymentSlipUrl}
            fetchPayInfo={fetchPayInfo}
            uploadSlip={uploadSlip}
            disabled={loading}
          />
          <label className="flex items-center gap-2 text-xs font-bold text-[#4d47b6]">
            <input type="checkbox" checked={printReceipt} onChange={(event) => setPrintReceipt(event.target.checked)} />
            พิมพ์ใบเสร็จหลังเช็คเอาต์
          </label>
          {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
        </div>
      </FormModal>
    </div>
  );
}
