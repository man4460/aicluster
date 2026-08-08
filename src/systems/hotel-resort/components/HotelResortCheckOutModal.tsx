"use client";

import { useEffect, useMemo, useState } from "react";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortPaymentPanel } from "@/systems/hotel-resort/components/HotelResortPaymentPanel";
import {
  HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS,
  hotelResortMergeNoteWithExtras,
  hotelResortNewExtraId,
  hotelResortParseExtrasFromNote,
  hotelResortSumExtras,
  type HotelResortExtraCharge,
} from "@/systems/hotel-resort/lib/checkout-extras";
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
import {
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortGradientPriceClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import { IconRowRemove } from "@/systems/asset/components/AssetRowActionIcons";

type BookingDetail = HotelResortBookingRow & {
  guestAddress?: string | null;
  guestTaxId?: string | null;
};

type Props = {
  open: boolean;
  room: HotelResortRoomRow | null;
  onClose: () => void;
  onDone: () => void;
};

export function HotelResortCheckOutModal({ open, room, onClose, onDone }: Props) {
  const apiFetch = useHotelResortApiFetch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingExtras, setSavingExtras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [property, setProperty] = useState<HotelResortPropertyPrintMeta | null>(null);
  const [extras, setExtras] = useState<HotelResortExtraCharge[]>([]);
  const [presetList, setPresetList] = useState(HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [payNow, setPayNow] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<HotelResortPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [guestTaxId, setGuestTaxId] = useState("");

  useEffect(() => {
    if (!open || !room?.bookingId) {
      setBooking(null);
      setProperty(null);
      setExtras([]);
      setPresetList(HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS);
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
          setError("การจองนี้เช็คเอาต์ไม่ได้ (ต้องเป็นสถานะเข้าพัก)");
          setBooking(null);
          return;
        }
        setBooking(b);
        setProperty(j.property ?? null);
        setPresetList(
          j.property?.checkoutExtraPresets?.length
            ? j.property.checkoutExtraPresets
            : HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS,
        );
        setExtras([]);
        setNote((b.note ?? "").replace(/\n?\[HR_EXTRAS\][\s\S]*$/, "").trim());
        setPaymentMethod(isHotelResortPaymentMethod(b.paymentMethod) ? b.paymentMethod : "CASH");
        setPaymentSlipUrl(null);
        setGuestAddress(b.guestAddress ?? "");
        setGuestTaxId(b.guestTaxId ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดการจองไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiFetch, open, room?.bookingId]);

  const extrasSum = useMemo(() => hotelResortSumExtras(extras), [extras]);
  const stayTotal = booking?.totalBaht ?? 0;
  const alreadyPaid = booking?.amountPaidBaht ?? 0;
  const finalTotal = stayTotal + extrasSum;
  const remaining = Math.max(0, finalTotal - alreadyPaid);
  const payNowBaht = useMemo(() => Math.max(0, Math.round(Number(payNow || 0))), [payNow]);

  useEffect(() => {
    if (!booking) return;
    setPayNow(String(Math.max(0, stayTotal + extrasSum - alreadyPaid)));
  }, [booking, stayTotal, extrasSum, alreadyPaid]);

  const slipMissing = hotelResortPaymentRequiresSlip(paymentMethod, payNowBaht) && !paymentSlipUrl;

  function addPreset(label: string, amountBaht: number) {
    setExtras((prev) => [
      ...prev,
      { id: hotelResortNewExtraId(), label, amountBaht: Math.max(0, Math.round(amountBaht)) },
    ]);
  }

  function addCustom() {
    const label = customLabel.trim();
    const amountBaht = Math.max(0, Math.round(Number(customAmount || 0)));
    if (!label || amountBaht <= 0) return;
    setExtras((prev) => [...prev, { id: hotelResortNewExtraId(), label, amountBaht }]);
    setCustomLabel("");
    setCustomAmount("");
  }

  function buildPrintData(): HotelResortPrintDocInput | null {
    if (!booking) return null;
    const nextPaid = alreadyPaid + payNowBaht;
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
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestAddress: guestAddress.trim() || null,
      guestTaxId: guestTaxId.trim() || null,
      roomNumber: booking.roomNumber || room?.roomNumber || null,
      roomTypeName: booking.roomTypeName || room?.roomTypeName || null,
      checkInAt: booking.checkInAt,
      checkOutAt: booking.checkOutAt,
      roomChargeBaht: stayTotal,
      totalBaht: finalTotal,
      amountPaidBaht: nextPaid,
      paymentMethodLabel: hotelResortPaymentMethodLabel(paymentMethod),
      note: note.trim() || null,
      docNo: booking.id.slice(-8).toUpperCase(),
      extras: extras.map((e) => ({ label: e.label, amountBaht: e.amountBaht })),
    };
  }

  function printDocs(kind: "receipt" | "taxInvoice" | "folio") {
    const data = buildPrintData();
    if (!data) return;
    if (kind === "taxInvoice" && (!guestAddress.trim() || !guestTaxId.trim())) {
      setError("พิมพ์ใบกำกับภาษีต้องมีที่อยู่และเลขผู้เสียภาษีลูกค้า");
      return;
    }
    setError(null);
    printHotelResortCheckInDocs({
      receipt: kind === "receipt",
      taxInvoice: kind === "taxInvoice",
      folio: kind === "folio",
      data,
    });
    setInfo(
      kind === "receipt"
        ? "ส่งพิมพ์ใบเสร็จธรรมดาแล้ว"
        : kind === "taxInvoice"
          ? "ส่งพิมพ์ใบกำกับภาษีแล้ว"
          : "ส่งพิมพ์โฟลิโอแล้ว",
    );
  }

  async function saveExtrasOnly() {
    if (!booking || extras.length === 0) return;
    setSavingExtras(true);
    setError(null);
    setInfo(null);
    try {
      const existingExtras = hotelResortParseExtrasFromNote(booking.note);
      const combined = [...existingExtras, ...extras];
      const nextTotal = stayTotal + extrasSum;
      const mergedNote = hotelResortMergeNoteWithExtras(note, combined);
      const res = await apiFetch(`/api/hotel-resort/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalBaht: nextTotal,
          note: mergedNote,
          guestAddress: guestAddress.trim() || null,
          guestTaxId: guestTaxId.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as { booking?: BookingDetail };
      const nextBooking = j.booking
        ? { ...booking, ...j.booking, status: j.booking.status || booking.status }
        : {
            ...booking,
            totalBaht: nextTotal,
            note: mergedNote,
            guestAddress: guestAddress.trim() || null,
            guestTaxId: guestTaxId.trim() || null,
          };
      setBooking(nextBooking);
      setExtras([]);
      setNote((mergedNote ?? "").replace(/\n?\[HR_EXTRAS\][\s\S]*$/, "").trim());
      setInfo("บันทึกรายการเพิ่มแล้ว — ยังไม่ได้เช็คเอาต์");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกรายการเพิ่มไม่สำเร็จ");
    } finally {
      setSavingExtras(false);
    }
  }

  async function submitCheckout() {
    if (!booking || !room?.bookingId) return;
    if (slipMissing) {
      setError("แนบสลิปชำระเงินก่อนยืนยันเช็คเอาต์");
      return;
    }
    if (payNowBaht > remaining) {
      setError("ยอดชำระตอนนี้มากกว่ายอดค้าง");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const nextTotal = finalTotal;
      const nextPaid = alreadyPaid + payNowBaht;
      const existingExtras = hotelResortParseExtrasFromNote(booking.note);
      const combined = [...existingExtras, ...extras];
      const mergedNote = hotelResortMergeNoteWithExtras(note, combined);
      const res = await apiFetch(`/api/hotel-resort/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CHECKED_OUT",
          totalBaht: nextTotal,
          amountPaidBaht: nextPaid,
          note: mergedNote,
          guestAddress: guestAddress.trim() || null,
          guestTaxId: guestTaxId.trim() || null,
          ...(payNowBaht > 0
            ? {
                paymentMethod,
                paymentSlipUrl,
              }
            : {}),
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      onDone();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เช็คเอาต์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={() => !(saving || savingExtras) && onClose()}
      size="lg"
      title="เช็คเอาต์"
      description={
        room
          ? `ห้อง ${room.roomNumber}${booking ? ` · ${booking.guestName}` : ""}`
          : undefined
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={saving || savingExtras}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] disabled:opacity-50 sm:flex-none sm:px-8"
          >
            ยกเลิก
          </button>
          {extras.length > 0 ? (
            <button
              type="button"
              disabled={saving || savingExtras || loading || !booking}
              onClick={() => void saveExtrasOnly()}
              className={cn(
                "flex-1 rounded-2xl border border-[#5b61ff]/35 bg-white px-6 py-3 text-sm font-bold text-[#4d47b6] shadow-sm transition-all hover:bg-[#f5f4ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-8",
              )}
              aria-label="บันทึกรายการเพิ่ม โดยยังไม่เช็คเอาต์"
            >
              {savingExtras ? "กำลังบันทึก…" : "บันทึกรายการเพิ่ม"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={
              saving ||
              savingExtras ||
              loading ||
              !booking ||
              slipMissing ||
              Boolean(error && !booking)
            }
            onClick={() => void submitCheckout()}
            className="flex-1 rounded-2xl bg-[#5b61ff] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-[#4d47b6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-10"
          >
            {saving ? "กำลังบันทึก…" : "ยืนยันเช็คเอาต์"}
          </button>
        </div>
      }
    >
      {loading ? (
        <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
      ) : error && !booking ? (
        <p className="text-sm font-semibold text-rose-600">{error}</p>
      ) : booking ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <p className="font-black text-[#1e1b4b]">{booking.guestName}</p>
            <p className="text-xs font-semibold text-[#66638c]">{booking.guestPhone}</p>
            <p className="mt-1 text-xs font-medium text-[#8b87b8]">
              {new Date(booking.checkInAt).toLocaleDateString("th-TH")} –{" "}
              {new Date(booking.checkOutAt).toLocaleDateString("th-TH")}
            </p>
          </div>

          <div>
            <p className={hotelResortFormLabelClass}>ค่าใช้จ่ายเพิ่ม</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presetList.map((p) => (
                <HotelResortButton
                  key={p.label}
                  type="button"
                  disabled={saving || savingExtras}
                  onClick={() => addPreset(p.label, p.amountBaht)}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "min-h-[36px] rounded-full px-3 text-[11px] font-black text-[#4d47b6]",
                  )}
                >
                  + {p.label}
                </HotelResortButton>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-[1fr_6.5rem_auto] gap-2">
              <input
                className={hotelResortFieldClass}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="รายการอื่น"
                aria-label="ชื่อรายการเพิ่ม"
              />
              <input
                className={hotelResortFieldClass}
                type="number"
                min={0}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="บาท"
                aria-label="จำนวนเงินรายการเพิ่ม"
              />
              <HotelResortButton
                type="button"
                disabled={saving || savingExtras}
                onClick={addCustom}
                className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]")}
              >
                เพิ่ม
              </HotelResortButton>
            </div>

            {extras.length > 0 ? (
              <>
                <ul className="mt-2 space-y-1.5">
                  {extras.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-[1rem] border border-white/60 bg-white/80 px-2.5 py-1.5 text-sm"
                    >
                      <span className="min-w-0 truncate font-semibold text-[#2e2a58]">{e.label}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className={cn("font-black tabular-nums", hotelResortGradientPriceClass)}>
                          ฿{e.amountBaht.toLocaleString("th-TH")}
                        </span>
                        <button
                          type="button"
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[1rem] border border-rose-200 bg-rose-50 text-rose-600"
                          aria-label={`ลบ ${e.label}`}
                          title="ลบ"
                          disabled={saving || savingExtras}
                          onClick={() => setExtras((prev) => prev.filter((x) => x.id !== e.id))}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <HotelResortButton
                  type="button"
                  disabled={saving || savingExtras}
                  onClick={() => void saveExtrasOnly()}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "mt-2 min-h-[40px] w-full rounded-[1rem] px-3 text-xs font-black text-[#4d47b6] sm:w-auto",
                  )}
                  aria-label="บันทึกรายการเพิ่ม โดยยังไม่เช็คเอาต์"
                >
                  {savingExtras ? "กำลังบันทึก…" : "บันทึกรายการเพิ่ม"}
                </HotelResortButton>
              </>
            ) : (
              <p className="mt-2 text-xs font-semibold text-[#8b87b8]">ยังไม่มีรายการเพิ่ม</p>
            )}
          </div>

          <div className="space-y-1 rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="font-semibold text-[#66638c]">ค่าห้อง/จองเดิม</span>
              <span className="font-black tabular-nums text-[#2e2a58]">฿{stayTotal.toLocaleString("th-TH")}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-semibold text-[#66638c]">รายการเพิ่ม</span>
              <span className="font-black tabular-nums text-[#2e2a58]">฿{extrasSum.toLocaleString("th-TH")}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-white/70 pt-1.5">
              <span className="font-black text-[#1e1b4b]">ยอดรวม</span>
              <span className={cn("text-lg font-black tabular-nums", hotelResortGradientPriceClass)}>
                ฿{finalTotal.toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-semibold text-[#66638c]">ชำระแล้ว</span>
              <span className="font-black tabular-nums text-emerald-700">฿{alreadyPaid.toLocaleString("th-TH")}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-black text-amber-800">คงเหลือ</span>
              <span className="font-black tabular-nums text-amber-800">฿{remaining.toLocaleString("th-TH")}</span>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ยอดชำระตอนนี้ (บาท)</span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={0}
              max={remaining}
              value={payNow}
              onChange={(e) => setPayNow(e.target.value)}
              aria-label="ยอดชำระตอนเช็คเอาต์"
            />
          </label>

          <HotelResortPaymentPanel
            amountBaht={payNowBaht}
            method={paymentMethod}
            slipUrl={paymentSlipUrl}
            onMethodChange={setPaymentMethod}
            onSlipUrlChange={setPaymentSlipUrl}
            disabled={saving}
          />

          <div>
            <p className={hotelResortFormLabelClass}>ที่อยู่ / เลขผู้เสียภาษี (ใบกำกับ)</p>
            <div className="mt-2 space-y-3">
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
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">หมายเหตุ</span>
            <textarea
              className={cn(hotelResortFieldClass, "min-h-[72px]")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเช็คเอาต์"
              aria-label="หมายเหตุเช็คเอาต์"
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
                  "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
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
                  "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
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
                  "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
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
    </FormModal>
  );
}
