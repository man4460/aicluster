"use client";

import { useEffect, useMemo, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import {
  buildFootballTurfPrintDocFromBooking,
  buildFootballTurfPrintDocFromPromotionSale,
  printFootballTurfDocs,
} from "@/systems/football-turf/lib/football-turf-print-docs";
import { footballTurfBookingAmountPaidBaht } from "@/systems/football-turf/lib/portal-booking";
import { isValidThaiId13 } from "@/systems/football-turf/lib/thai-tax-id";
import type {
  FootballTurfBooking,
  FootballTurfCustomer,
  FootballTurfPromotionSale,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";
import { footballTurfInteractiveButtonClass } from "@/systems/football-turf/lib/ui-tokens";

type Props = {
  open: boolean;
  booking?: FootballTurfBooking | null;
  promotionSale?: FootballTurfPromotionSale | null;
  settings: FootballTurfVenueSettings;
  customers?: FootballTurfCustomer[];
  /** เปิดมาพร้อมติ๊กใบกำกับ (เช่น จากฟอร์มขายโปร) */
  preferTaxInvoice?: boolean;
  onClose: () => void;
};

function formatMoney(n: number) {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800";

function findCustomerByPhone(
  customers: FootballTurfCustomer[] | undefined,
  phoneRaw: string,
): FootballTurfCustomer | undefined {
  if (!customers?.length || !phoneRaw.trim()) return undefined;
  const phone = normalizeMemberPhone(phoneRaw) || phoneRaw.trim();
  return customers.find((c) => {
    const p = normalizeMemberPhone(c.phone) || c.phone.trim();
    return p === phone || c.phone === phoneRaw;
  });
}

export function FootballTurfBookingPrintModal({
  open,
  booking = null,
  promotionSale = null,
  settings,
  customers,
  preferTaxInvoice = false,
  onClose,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [billingName, setBillingName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerBranch, setCustomerBranch] = useState("");
  const [taxVerified, setTaxVerified] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);

  const sourcePhone = booking?.customerPhone ?? promotionSale?.customerPhone ?? "";
  const sourceName =
    booking?.customerName ||
    booking?.teamName ||
    promotionSale?.customerName ||
    promotionSale?.teamName ||
    "";

  useEffect(() => {
    if (!open || (!booking && !promotionSale)) {
      setError(null);
      setInfo(null);
      return;
    }
    const cust = findCustomerByPhone(customers, sourcePhone);
    const hasTaxProfile = Boolean(cust?.taxInvoiceEnabled) || preferTaxInvoice;
    setBillingName(
      (cust?.billingName || cust?.name || sourceName || "").trim(),
    );
    setCustomerAddress(cust?.taxAddress?.trim() || "");
    setCustomerTaxId(cust?.taxId?.replace(/\D/g, "").slice(0, 13) || "");
    setCustomerBranch(cust?.taxBranch?.trim() || "");
    setTaxVerified(false);
    setPrintReceipt(true);
    setPrintTaxInvoice(hasTaxProfile);
    setError(null);
    setInfo(null);
  }, [open, booking, promotionSale, customers, preferTaxInvoice, sourceName, sourcePhone]);

  const taxReady = useMemo(() => {
    const nameOk = billingName.trim().length >= 2;
    const addressOk = customerAddress.trim().length >= 8;
    const idOk = isValidThaiId13(customerTaxId);
    return nameOk && addressOk && idOk && taxVerified;
  }, [billingName, customerAddress, customerTaxId, taxVerified]);

  function validateTaxInvoice(): string | null {
    if (!billingName.trim() || billingName.trim().length < 2) {
      return "กรอกชื่อในใบกำกับภาษีให้ถูกต้อง";
    }
    if (!customerAddress.trim() || customerAddress.trim().length < 8) {
      return "กรอกที่อยู่ในใบกำกับภาษีให้ครบ (อย่างน้อยบ้านเลขที่ · ถนน · เขต/อำเภอ · จังหวัด)";
    }
    if (!isValidThaiId13(customerTaxId)) {
      return "เลขบัตรประชาชน / เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลักและถูกต้อง";
    }
    if (!taxVerified) {
      return "ยืนยันว่าตรวจชื่อ · เลขบัตร · ที่อยู่ ถูกต้องแล้วก่อนพิมพ์";
    }
    return null;
  }

  function printSelected(opts: { receipt?: boolean; taxInvoice?: boolean }) {
    if (!booking && !promotionSale) return;
    const receipt = Boolean(opts.receipt);
    const taxInvoice = Boolean(opts.taxInvoice);
    if (!receipt && !taxInvoice) {
      setError("เลือกเอกสารอย่างน้อย 1 ประเภท");
      return;
    }
    if (taxInvoice) {
      const taxErr = validateTaxInvoice();
      if (taxErr) {
        setError(taxErr);
        return;
      }
    }
    setError(null);
    const extras = {
      customerName: billingName.trim(),
      customerAddress: customerAddress.trim(),
      customerTaxId: customerTaxId.replace(/\D/g, ""),
      noteExtra: customerBranch.trim() ? `สาขา ${customerBranch.trim()}` : undefined,
    };
    const data = booking
      ? buildFootballTurfPrintDocFromBooking(booking, settings, extras)
      : buildFootballTurfPrintDocFromPromotionSale(promotionSale!, settings, extras);
    printFootballTurfDocs({ receipt, taxInvoice, data });
    const kinds = [receipt ? "ใบเสร็จ" : null, taxInvoice ? "ใบกำกับ" : null].filter(Boolean);
    setInfo(`ส่งพิมพ์แล้ว: ${kinds.join(" · ")}`);
  }

  const titleBits = booking
    ? `${booking.teamName || booking.customerName} · ${booking.courtName} · ${booking.startTime}–${booking.endTime}`
    : promotionSale
      ? `${promotionSale.teamName || promotionSale.customerName} · ${promotionSale.promotionName}`
      : undefined;

  const totalBaht = booking?.finalPrice ?? promotionSale?.price ?? 0;
  const paidBaht = booking
    ? footballTurfBookingAmountPaidBaht(booking)
    : (promotionSale?.paymentStatus ?? "PAID") === "PAID"
      ? promotionSale?.price ?? 0
      : 0;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title="พิมพ์เอกสาร"
      description={titleBits}
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={() =>
            printSelected({
              receipt: printReceipt,
              taxInvoice: printTaxInvoice,
            })
          }
          submitLabel="พิมพ์ที่เลือก"
          submitDisabled={
            (!booking && !promotionSale) ||
            (!printReceipt && !printTaxInvoice) ||
            (printTaxInvoice && !taxReady)
          }
        />
      }
    >
      {!booking && !promotionSale ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <p className="font-black text-[#1e1b4b]">
              {booking
                ? booking.teamName || booking.customerName
                : promotionSale?.teamName || promotionSale?.customerName}
            </p>
            <p className="text-xs font-semibold text-[#66638c]">
              {sourcePhone}
              {booking
                ? `${booking.teamName ? ` · ${booking.customerName}` : ""} · ${booking.courtName}`
                : ` · ${promotionSale?.promotionName}`}
            </p>
            {booking ? (
              <p className="mt-1 text-xs font-medium text-[#8b87b8]">
                {booking.bookingDate} · {booking.startTime}–{booking.endTime}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
              <span className="text-[#66638c]">
                ยอดรวม <span className="font-black text-[#1e1b4b]">{formatMoney(totalBaht)}</span>
              </span>
              <span className="text-emerald-700">
                ชำระแล้ว <span className="font-black">{formatMoney(paidBaht)}</span>
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">เลือกเอกสาร</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    key: "receipt" as const,
                    label: "ใบเสร็จ / สลิปทั่วไป",
                    hint: `ขนาดตามตั้งค่า (${settings.slipPaperSize || "SLIP_58"})`,
                    checked: printReceipt,
                    set: setPrintReceipt,
                  },
                  {
                    key: "tax" as const,
                    label: "ใบกำกับภาษี",
                    hint: "ต้องตรวจชื่อ · เลขบัตร · ที่อยู่",
                    checked: printTaxInvoice,
                    set: setPrintTaxInvoice,
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.key}
                  className={cn(
                    "flex min-h-[48px] cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition",
                    footballTurfInteractiveButtonClass,
                    opt.checked
                      ? "border-[#5b61ff]/45 bg-[#ecebff]/70 ring-1 ring-[#5b61ff]/20"
                      : "border-white/60 bg-white/55 hover:bg-white/80",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#5b61ff]"
                    checked={opt.checked}
                    onChange={(e) => {
                      opt.set(e.target.checked);
                      if (opt.key === "tax" && !e.target.checked) setTaxVerified(false);
                    }}
                  />
                  <span>
                    <span className="block text-sm font-black text-[#1e1b4b]">{opt.label}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-[#8b87b8]">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {printTaxInvoice ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
              <p className="text-xs font-bold text-[#4d47b6]">
                ข้อมูลใบกำกับภาษี
                <span className="ml-1 font-semibold text-rose-600">· ตรวจให้ครบก่อนพิมพ์</span>
              </p>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ชื่อ / ชื่อบริษัทในใบกำกับ
                <input
                  className={fieldClass}
                  value={billingName}
                  onChange={(e) => {
                    setBillingName(e.target.value);
                    setTaxVerified(false);
                  }}
                  placeholder="ชื่อตามบัตรประชาชน หรือชื่อนิติบุคคล"
                  aria-label="ชื่อในใบกำกับภาษี"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                เลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
                <input
                  className={fieldClass}
                  value={customerTaxId}
                  onChange={(e) => {
                    setCustomerTaxId(e.target.value.replace(/[^\d]/g, "").slice(0, 13));
                    setTaxVerified(false);
                  }}
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="1234567890123"
                  aria-label="เลขบัตรประชาชนหรือเลขผู้เสียภาษี"
                />
                {customerTaxId.trim() && !isValidThaiId13(customerTaxId) ? (
                  <span className="font-semibold text-rose-600">เลข 13 หลักไม่ถูกต้อง</span>
                ) : null}
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                ที่อยู่
                <textarea
                  className={cn(fieldClass, "min-h-[88px]")}
                  value={customerAddress}
                  onChange={(e) => {
                    setCustomerAddress(e.target.value);
                    setTaxVerified(false);
                  }}
                  placeholder="บ้านเลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์"
                  aria-label="ที่อยู่ลูกค้าในใบกำกับ"
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                สาขา (ถ้ามี)
                <input
                  className={fieldClass}
                  value={customerBranch}
                  onChange={(e) => setCustomerBranch(e.target.value)}
                  placeholder="เช่น สำนักงานใหญ่ / สาขา 00000"
                  aria-label="สาขาลูกค้า"
                />
              </label>
              <label className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-sm font-semibold text-amber-950">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#5b61ff]"
                  checked={taxVerified}
                  onChange={(e) => setTaxVerified(e.target.checked)}
                />
                <span>
                  ตรวจแล้วว่า <strong className="font-black">ชื่อ · เลขบัตรประชาชน · ที่อยู่</strong> ถูกต้อง
                  ตรงกับเอกสารลูกค้า
                </span>
              </label>
            </div>
          ) : null}

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}
        </div>
      )}
    </FormModal>
  );
}
