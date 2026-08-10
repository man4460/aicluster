"use client";

import { useEffect, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { hotelResortFetchErrorMessage } from "@/systems/hotel-resort/lib/client-data";
import {
  printHotelResortCheckInDocs,
  type HotelResortPrintDocInput,
} from "@/systems/hotel-resort/lib/hotel-resort-print-docs";
import { hotelResortPaymentMethodLabel } from "@/systems/hotel-resort/lib/payment-method";
import type { HotelResortPropertyPrintMeta } from "@/systems/hotel-resort/lib/property-print-meta";
import { hotelResortFieldClass, hotelResortFormLabelClass } from "@/systems/hotel-resort/lib/ui-tokens";
import {
  HOTEL_BOOKING_STATUS_LABELS,
  HOTEL_PAYMENT_STATUS_LABELS,
} from "@/systems/hotel-resort/lib/booking-status";
import type { HotelResortBookingStatus, HotelResortPaymentStatus } from "@/generated/prisma/client";

export type HotelResortStayPrintSource = {
  id: string;
  guestName: string;
  guestPhone: string | null;
  roomNumber: string | null;
  roomTypeName: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: HotelResortBookingStatus;
  totalBaht: number;
  amountPaidBaht: number;
  paymentStatus: HotelResortPaymentStatus;
  paymentMethod: string | null;
  note?: string | null;
  guestAddress?: string | null;
  guestTaxId?: string | null;
};

type Props = {
  open: boolean;
  stay: HotelResortStayPrintSource | null;
  onClose: () => void;
};

function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function formatThb(n: number): string {
  return Math.round(n).toLocaleString("th-TH");
}

export function HotelResortStayPrintModal({ open, stay, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [property, setProperty] = useState<HotelResortPropertyPrintMeta | null>(null);
  const [guestAddress, setGuestAddress] = useState("");
  const [guestTaxId, setGuestTaxId] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);
  const [printFolio, setPrintFolio] = useState(false);

  useEffect(() => {
    if (!open || !stay) {
      setProperty(null);
      setError(null);
      setInfo(null);
      return;
    }
    setGuestAddress(stay.guestAddress ?? "");
    setGuestTaxId(stay.guestTaxId ?? "");
    setPrintReceipt(true);
    setPrintTaxInvoice(false);
    setPrintFolio(false);
    setError(null);
    setInfo(null);

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/hotel-resort/bookings/${stay.id}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
        const j = (await res.json()) as {
          booking?: { guestAddress?: string | null; guestTaxId?: string | null };
          property?: HotelResortPropertyPrintMeta;
        };
        if (cancelled) return;
        setProperty(j.property ?? null);
        if (j.booking?.guestAddress != null) setGuestAddress(j.booking.guestAddress ?? "");
        if (j.booking?.guestTaxId != null) setGuestTaxId(j.booking.guestTaxId ?? "");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "โหลดข้อมูลพิมพ์ไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, stay]);

  function buildPrintData(): HotelResortPrintDocInput | null {
    if (!stay) return null;
    return {
      propertyName: property?.propertyName || "โรงแรม",
      propertyTaxId: property?.taxId,
      propertyAddress: property?.address,
      propertyPhone: property?.contactPhone,
      logoUrl: property?.logoUrl,
      bankName: property?.bankName,
      bankAccountNumber: property?.bankAccountNumber,
      bankAccountName: property?.bankAccountName,
      managerName: property?.managerName,
      guestName: stay.guestName,
      guestPhone: stay.guestPhone || "",
      guestAddress: guestAddress.trim() || null,
      guestTaxId: guestTaxId.trim() || null,
      roomNumber: stay.roomNumber,
      roomTypeName: stay.roomTypeName,
      checkInAt: stay.checkInAt,
      checkOutAt: stay.checkOutAt,
      totalBaht: stay.totalBaht,
      amountPaidBaht: stay.amountPaidBaht,
      paymentMethodLabel: hotelResortPaymentMethodLabel(stay.paymentMethod),
      note: stay.note ?? null,
      docNo: stay.id.slice(-8).toUpperCase(),
    };
  }

  function printSelected(opts: { receipt?: boolean; taxInvoice?: boolean; folio?: boolean }) {
    if (!stay) return;
    const receipt = Boolean(opts.receipt);
    const taxInvoice = Boolean(opts.taxInvoice);
    const folio = Boolean(opts.folio);
    if (!receipt && !taxInvoice && !folio) {
      setError("เลือกเอกสารอย่างน้อย 1 ประเภท");
      return;
    }
    if (taxInvoice && (!guestAddress.trim() || !guestTaxId.trim())) {
      setError("พิมพ์ใบกำกับภาษีต้องมีที่อยู่และเลขผู้เสียภาษีลูกค้า");
      return;
    }
    const data = buildPrintData();
    if (!data) return;
    setError(null);
    printHotelResortCheckInDocs({
      receipt,
      taxInvoice,
      folio,
      data,
    });
    const kinds = [
      receipt ? "ใบเสร็จ" : null,
      taxInvoice ? "ใบกำกับ" : null,
      folio ? "โฟลิโอ" : null,
    ].filter(Boolean);
    setInfo(`ส่งพิมพ์แล้ว: ${kinds.join(" · ")}`);
  }

  function submitPrint() {
    printSelected({
      receipt: printReceipt,
      taxInvoice: printTaxInvoice,
      folio: printFolio,
    });
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title="พิมพ์เอกสาร"
      description={stay ? `${stay.guestName}${stay.roomNumber ? ` · ห้อง ${stay.roomNumber}` : ""}` : undefined}
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={submitPrint}
          submitLabel="พิมพ์ที่เลือก"
          submitDisabled={loading || !stay || (!printReceipt && !printTaxInvoice && !printFolio)}
        />
      }
    >
      {!stay ? null : loading && !property ? (
        <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <p className="font-black text-[#1e1b4b]">{stay.guestName}</p>
            <p className="text-xs font-semibold text-[#66638c]">
              {stay.guestPhone || "—"}
              {stay.roomNumber ? ` · ห้อง ${stay.roomNumber}` : ""}
              {stay.roomTypeName ? ` · ${stay.roomTypeName}` : ""}
            </p>
            <p className="mt-1 text-xs font-medium text-[#8b87b8]">
              {formatThaiDate(stay.checkInAt)} → {formatThaiDate(stay.checkOutAt)} ·{" "}
              {HOTEL_BOOKING_STATUS_LABELS[stay.status]}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
              <span className="text-[#66638c]">
                ยอดรวม <span className="font-black text-[#1e1b4b]">฿{formatThb(stay.totalBaht)}</span>
              </span>
              <span className="text-emerald-700">
                ชำระแล้ว <span className="font-black">฿{formatThb(stay.amountPaidBaht)}</span>
              </span>
              <span className="text-[#66638c]">{HOTEL_PAYMENT_STATUS_LABELS[stay.paymentStatus]}</span>
              {stay.paymentMethod ? (
                <span className="text-[#4d47b6]">{hotelResortPaymentMethodLabel(stay.paymentMethod)}</span>
              ) : null}
            </div>
            {stay.note?.trim() ? (
              <p className="mt-2 text-[11px] font-medium text-[#8b87b8]">หมายเหตุ: {stay.note.trim()}</p>
            ) : null}
          </div>

          <div>
            <p className={hotelResortFormLabelClass}>เลือกเอกสารพิมพ์ (A4)</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { key: "receipt" as const, label: "ใบเสร็จธรรมดา", checked: printReceipt, set: setPrintReceipt },
                  { key: "tax" as const, label: "ใบกำกับภาษี", checked: printTaxInvoice, set: setPrintTaxInvoice },
                  { key: "folio" as const, label: "โฟลิโอ", checked: printFolio, set: setPrintFolio },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.key}
                  className={cn(
                    "flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition",
                    opt.checked
                      ? "border-[#5b61ff]/45 bg-[#ecebff]/70 ring-1 ring-[#5b61ff]/20"
                      : "border-white/60 bg-white/55 hover:bg-white/80",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#5b61ff]"
                    checked={opt.checked}
                    onChange={(e) => opt.set(e.target.checked)}
                  />
                  <span className="text-sm font-black text-[#1e1b4b]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {printTaxInvoice || printFolio ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
              <p className="text-xs font-bold text-[#4d47b6]">
                ที่อยู่ / เลขผู้เสียภาษี
                {printTaxInvoice ? (
                  <span className="ml-1 font-semibold text-rose-600">· บังคับเมื่อพิมพ์ใบกำกับ</span>
                ) : null}
              </p>
              <textarea
                className={cn(hotelResortFieldClass, "min-h-[72px]")}
                value={guestAddress}
                onChange={(e) => setGuestAddress(e.target.value)}
                placeholder="ที่อยู่ลูกค้า"
                aria-label="ที่อยู่ลูกค้า"
              />
              <input
                className={hotelResortFieldClass}
                value={guestTaxId}
                onChange={(e) => setGuestTaxId(e.target.value)}
                placeholder="เลขผู้เสียภาษี"
                aria-label="เลขผู้เสียภาษีลูกค้า"
              />
            </div>
          ) : null}

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}
        </div>
      )}
    </FormModal>
  );
}
