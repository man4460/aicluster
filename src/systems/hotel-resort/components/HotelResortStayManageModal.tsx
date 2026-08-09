"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortPaymentPanel } from "@/systems/hotel-resort/components/HotelResortPaymentPanel";
import {
  hotelResortFetchErrorMessage,
  type HotelResortBookingRow,
  type HotelResortRoomRow,
} from "@/systems/hotel-resort/lib/client-data";
import {
  printHotelResortCheckInDocs,
  type HotelResortPrintDocInput,
} from "@/systems/hotel-resort/lib/hotel-resort-print-docs";
import {
  hotelResortPaymentMethodLabel,
  hotelResortPaymentRequiresSlip,
  isHotelResortPaymentMethod,
  type HotelResortPaymentMethod,
} from "@/systems/hotel-resort/lib/payment-method";
import type { HotelResortPropertyPrintMeta } from "@/systems/hotel-resort/lib/property-print-meta";
import { useHotelResortApiFetch } from "@/systems/hotel-resort/lib/staff-api-fetch";
import { hotelResortFieldClass, hotelResortFormLabelClass } from "@/systems/hotel-resort/lib/ui-tokens";

type BookingDetail = HotelResortBookingRow & {
  guestAddress?: string | null;
  guestTaxId?: string | null;
  nationalId?: string | null;
  nationality?: string | null;
};

type Props = {
  open: boolean;
  room: HotelResortRoomRow | null;
  onClose: () => void;
  onDone: () => void;
};

function ymdFromIso(iso: string) {
  return iso.slice(0, 10);
}

export function HotelResortStayManageModal({ open, room, onClose, onDone }: Props) {
  const apiFetch = useHotelResortApiFetch();
  const slipLb = useAppImageLightbox();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [property, setProperty] = useState<HotelResortPropertyPrintMeta | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkInAt, setCheckInAt] = useState("");
  const [checkOutAt, setCheckOutAt] = useState("");
  const [totalBaht, setTotalBaht] = useState("");
  const [amountPaidBaht, setAmountPaidBaht] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<HotelResortPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [guestAddress, setGuestAddress] = useState("");
  const [guestTaxId, setGuestTaxId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !room?.bookingId) {
      setBooking(null);
      setProperty(null);
      setError(null);
      setInfo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfo(null);
    void (async () => {
      try {
        const res = await apiFetch(`/api/hotel-resort/bookings/${room.bookingId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
        const j = (await res.json()) as {
          booking?: BookingDetail;
          property?: HotelResortPropertyPrintMeta;
        };
        if (cancelled) return;
        const b = j.booking ?? null;
        if (!b || b.status !== "CHECKED_IN") {
          setError("แก้ไขได้เฉพาะห้องที่เข้าพักอยู่");
          setBooking(null);
          return;
        }
        setBooking(b);
        setProperty(j.property ?? null);
        setGuestName(b.guestName);
        setGuestPhone(b.guestPhone);
        setCheckInAt(ymdFromIso(b.checkInAt));
        setCheckOutAt(ymdFromIso(b.checkOutAt));
        setTotalBaht(String(b.totalBaht ?? 0));
        setAmountPaidBaht(String(b.amountPaidBaht ?? 0));
        setPaymentMethod(isHotelResortPaymentMethod(b.paymentMethod) ? b.paymentMethod : "CASH");
        setPaymentSlipUrl(b.paymentSlipUrl ?? null);
        setGuestAddress(b.guestAddress ?? "");
        setGuestTaxId(b.guestTaxId ?? "");
        setNote(b.note ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดการเช็คอินไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, open, room?.bookingId]);

  const total = useMemo(() => Math.max(0, Math.round(Number(totalBaht || 0))), [totalBaht]);
  const paid = useMemo(() => Math.max(0, Math.round(Number(amountPaidBaht || 0))), [amountPaidBaht]);
  const slipMissing = hotelResortPaymentRequiresSlip(paymentMethod, paid) && !paymentSlipUrl;

  function buildPrintData(override?: Partial<BookingDetail>): HotelResortPrintDocInput {
    const b = { ...booking!, ...override };
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
      guestName: guestName.trim() || b.guestName,
      guestPhone: guestPhone.trim() || b.guestPhone,
      guestAddress: guestAddress.trim() || b.guestAddress || null,
      guestTaxId: guestTaxId.trim() || b.guestTaxId || null,
      roomNumber: b.roomNumber || room?.roomNumber || null,
      roomTypeName: b.roomTypeName || room?.roomTypeName || null,
      checkInAt: checkInAt || b.checkInAt,
      checkOutAt: checkOutAt || b.checkOutAt,
      totalBaht: total,
      amountPaidBaht: paid,
      paymentMethodLabel: hotelResortPaymentMethodLabel(paymentMethod),
      note: note.trim() || null,
      docNo: b.id.slice(-8).toUpperCase(),
    };
  }

  function printDocs(kind: "receipt" | "taxInvoice" | "folio") {
    if (!booking) return;
    if (kind === "taxInvoice" && (!guestAddress.trim() || !guestTaxId.trim())) {
      setError("พิมพ์ใบกำกับภาษีต้องมีที่อยู่และเลขผู้เสียภาษีลูกค้า");
      return;
    }
    setError(null);
    printHotelResortCheckInDocs({
      receipt: kind === "receipt",
      taxInvoice: kind === "taxInvoice",
      folio: kind === "folio",
      data: buildPrintData(),
    });
    setInfo(
      kind === "receipt"
        ? "ส่งพิมพ์ใบเสร็จธรรมดาแล้ว"
        : kind === "taxInvoice"
          ? "ส่งพิมพ์ใบกำกับภาษีแล้ว"
          : "ส่งพิมพ์โฟลิโอแล้ว",
    );
  }

  async function save() {
    if (!booking) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      setError("กรอกชื่อและเบอร์ลูกค้า");
      return;
    }
    if (!checkInAt || !checkOutAt) {
      setError("เลือกวันเช็คอินและเช็คเอาต์");
      return;
    }
    if (checkOutAt <= checkInAt) {
      setError("วันเช็คเอาต์ต้องหลังวันเช็คอิน");
      return;
    }
    if (slipMissing) {
      setError("แนบสลิปชำระเงินก่อนบันทึก");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiFetch(`/api/hotel-resort/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          checkInAt,
          checkOutAt,
          totalBaht: total,
          amountPaidBaht: paid,
          paymentMethod,
          ...(paymentMethod === "CASH"
            ? { paymentSlipUrl: null }
            : paymentSlipUrl
              ? { paymentSlipUrl }
              : {}),
          guestAddress: guestAddress.trim() || null,
          guestTaxId: guestTaxId.trim() || null,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as { booking?: BookingDetail; property?: HotelResortPropertyPrintMeta };
      if (j.booking) setBooking(j.booking);
      if (j.property) setProperty(j.property);
      setInfo("บันทึกการเช็คอินแล้ว");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      title="แก้ไขการเช็คอิน"
      description={
        room
          ? `ห้อง ${room.roomNumber}${booking ? ` · ${booking.guestName}` : ""}`
          : undefined
      }
      footer={
        <FormModalFooterActions
          onCancel={() => onClose()}
          onSubmit={() => void save()}
          submitLabel={saving ? "กำลังบันทึก…" : "บันทึก"}
          loading={saving}
          submitDisabled={saving || loading || !booking || slipMissing}
        />
      }
    >
      {loading ? (
        <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
      ) : error && !booking ? (
        <p className="text-sm font-semibold text-rose-600">{error}</p>
      ) : booking ? (
        <div className="space-y-4">
          <div>
            <p className={hotelResortFormLabelClass}>ข้อมูลผู้เข้าพัก</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">ชื่อลูกค้า</span>
                <input
                  className={hotelResortFieldClass}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="ชื่อ-นามสกุล"
                  aria-label="ชื่อลูกค้า"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">เบอร์โทร</span>
                <input
                  className={hotelResortFieldClass}
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  aria-label="เบอร์โทร"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">วันเช็คอิน</span>
                <input
                  className={hotelResortFieldClass}
                  type="date"
                  value={checkInAt}
                  onChange={(e) => setCheckInAt(e.target.value)}
                  aria-label="วันเช็คอิน"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">วันเช็คเอาต์</span>
                <input
                  className={hotelResortFieldClass}
                  type="date"
                  value={checkOutAt}
                  onChange={(e) => setCheckOutAt(e.target.value)}
                  aria-label="วันเช็คเอาต์"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">ยอดรวม (บาท)</span>
                <input
                  className={hotelResortFieldClass}
                  type="number"
                  min={0}
                  value={totalBaht}
                  onChange={(e) => setTotalBaht(e.target.value)}
                  placeholder="0"
                  aria-label="ยอดรวม"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">ชำระแล้ว (บาท)</span>
                <input
                  className={hotelResortFieldClass}
                  type="number"
                  min={0}
                  value={amountPaidBaht}
                  onChange={(e) => setAmountPaidBaht(e.target.value)}
                  placeholder="0"
                  aria-label="ยอดชำระแล้ว"
                />
              </label>
            </div>
          </div>

          {booking.depositSlipUrl?.trim() ? (
            <div className="rounded-[1rem] border border-white/60 bg-white/70 p-3">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">
                สลิปมัดจำ (จากลิงก์จอง)
              </p>
              <AppImageThumb
                src={booking.depositSlipUrl.trim()}
                alt="สลิปมัดจำ"
                onOpen={() => slipLb.open(booking.depositSlipUrl!.trim())}
                className="h-16 w-16"
              />
            </div>
          ) : null}

          <HotelResortPaymentPanel
            amountBaht={paid}
            method={paymentMethod}
            slipUrl={paymentSlipUrl}
            onMethodChange={setPaymentMethod}
            onSlipUrlChange={setPaymentSlipUrl}
            disabled={saving}
          />

          <div>
            <p className={hotelResortFormLabelClass}>ที่อยู่ / เลขผู้เสียภาษี (ใบกำกับ · โฟลิโอ)</p>
            <div className="mt-2 space-y-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">ที่อยู่ลูกค้า</span>
                <textarea
                  className={cn(hotelResortFieldClass, "min-h-[72px]")}
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
                  aria-label="ที่อยู่ลูกค้า"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#66638c]">เลขผู้เสียภาษี</span>
                <input
                  className={hotelResortFieldClass}
                  value={guestTaxId}
                  onChange={(e) => setGuestTaxId(e.target.value)}
                  placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก"
                  aria-label="เลขผู้เสียภาษีลูกค้า"
                />
              </label>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-[#66638c]">หมายเหตุ</span>
            <textarea
              className={cn(hotelResortFieldClass, "min-h-[64px]")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              aria-label="หมายเหตุ"
            />
          </label>

          <div>
            <p className={hotelResortFormLabelClass}>พิมพ์เอกสาร (A4)</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <HotelResortButton
                type="button"
                disabled={saving}
                onClick={() => printDocs("receipt")}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                )}
                aria-label="พิมพ์ใบเสร็จธรรมดา"
              >
                ใบเสร็จธรรมดา
              </HotelResortButton>
              <HotelResortButton
                type="button"
                disabled={saving}
                onClick={() => printDocs("taxInvoice")}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                )}
                aria-label="พิมพ์ใบกำกับภาษี"
              >
                ใบกำกับภาษี
              </HotelResortButton>
              <HotelResortButton
                type="button"
                disabled={saving}
                onClick={() => printDocs("folio")}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                )}
                aria-label="พิมพ์โฟลิโอ"
              >
                โฟลิโอ
              </HotelResortButton>
            </div>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}
        </div>
      ) : null}
      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปชำระ" />
    </FormModal>
  );
}
