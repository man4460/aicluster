"use client";

import { useEffect, useMemo, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { isValidThaiId13 } from "@/lib/thai-tax-id";
import {
  formatBarberPrintBaht,
  printBarberMemberDocs,
  type BarberPrintShopProfile,
} from "@/systems/barber/lib/barber-print-docs";
import { barberPaymentMethodLabel } from "@/systems/barber/lib/payment-method";

export type BarberMemberPrintRow = {
  id: number;
  createdAt: string;
  remainingSessions: number;
  paymentMethod: string | null;
  package: { name: string; price: string | number; totalSessions: number };
  customer: {
    phone: string;
    name: string | null;
    taxInvoiceEnabled?: boolean;
    billingName?: string;
    taxId?: string;
    taxAddress?: string;
    taxBranch?: string;
  };
};

type Props = {
  open: boolean;
  row: BarberMemberPrintRow | null;
  shop: BarberPrintShopProfile | null;
  preferTaxInvoice?: boolean;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800";

export function BarberMemberPrintModal({
  open,
  row,
  shop,
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

  useEffect(() => {
    if (!open || !row) {
      setError(null);
      setInfo(null);
      return;
    }
    const hasTax = Boolean(row.customer.taxInvoiceEnabled) || preferTaxInvoice;
    setBillingName(
      (row.customer.billingName || row.customer.name || "").trim(),
    );
    setCustomerAddress(row.customer.taxAddress?.trim() || "");
    setCustomerTaxId(row.customer.taxId?.replace(/\D/g, "").slice(0, 13) || "");
    setCustomerBranch(row.customer.taxBranch?.trim() || "");
    setTaxVerified(false);
    setPrintReceipt(true);
    setPrintTaxInvoice(hasTax);
    setError(null);
    setInfo(null);
  }, [open, row, preferTaxInvoice]);

  const priceBaht = useMemo(() => {
    const n = Number(row?.package.price);
    return Number.isFinite(n) ? n : 0;
  }, [row]);

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
      return "กรอกที่อยู่ในใบกำกับภาษีให้ครบ";
    }
    if (!isValidThaiId13(customerTaxId)) {
      return "เลขบัตรประชาชน / เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลักและถูกต้อง";
    }
    if (!taxVerified) {
      return "ยืนยันว่าตรวจชื่อ · เลขบัตร · ที่อยู่ ถูกต้องแล้วก่อนพิมพ์";
    }
    return null;
  }

  function onPrint() {
    if (!row) return;
    setError(null);
    setInfo(null);
    if (!printReceipt && !printTaxInvoice) {
      setError("เลือกอย่างน้อยหนึ่งเอกสาร");
      return;
    }
    if (printTaxInvoice) {
      const err = validateTaxInvoice();
      if (err) {
        setError(err);
        return;
      }
    }
    const customerName =
      (printTaxInvoice ? billingName : row.customer.name || billingName || row.customer.phone).trim() ||
      row.customer.phone;
    printBarberMemberDocs({
      receipt: printReceipt,
      taxInvoice: printTaxInvoice,
      data: {
        shop: shop ?? { displayName: "ร้านตัดผม", slipPaperSize: "SLIP_58" },
        customerName,
        customerPhone: row.customer.phone,
        customerAddress: printTaxInvoice ? customerAddress.trim() : null,
        customerTaxId: printTaxInvoice ? customerTaxId.trim() : null,
        packageName: row.package.name,
        totalSessions: row.package.totalSessions,
        remainingSessions: row.remainingSessions,
        priceBaht,
        paymentMethod: row.paymentMethod,
        soldAtIso: row.createdAt,
        docNo: `BR-${row.id}`,
        note: customerBranch.trim() ? `สาขา ${customerBranch.trim()}` : null,
      },
    });
    setInfo(
      printReceipt && printTaxInvoice
        ? "ส่งพิมพ์ใบเสร็จและใบกำกับภาษีแล้ว"
        : printTaxInvoice
          ? "ส่งพิมพ์ใบกำกับภาษีแล้ว"
          : "ส่งพิมพ์ใบเสร็จแล้ว",
    );
  }

  return (
    <FormModal
      open={open && Boolean(row)}
      onClose={onClose}
      title="พิมพ์เอกสาร"
      appearance="glass"
      glassTint="violet"
      size="md"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          cancelLabel="ปิด"
          onSubmit={onPrint}
          submitLabel="พิมพ์"
          submitDisabled={!row || (printTaxInvoice && !taxReady)}
        />
      }
    >
      {row ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ecebff] bg-[#faf9ff]/90 px-3 py-3">
            <p className="text-sm font-black text-[#1e1b4b]">{row.package.name}</p>
            <p className="mt-1 text-xs font-semibold tabular-nums text-[#66638c]">
              {row.customer.phone}
              {row.customer.name ? ` · ${row.customer.name}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
              <span className="text-[#66638c]">
                ยอด <span className="font-black text-[#1e1b4b]">{formatBarberPrintBaht(priceBaht)}</span>
              </span>
              <span className="text-[#66638c]">
                ช่องทาง{" "}
                <span className="font-black text-[#1e1b4b]">
                  {barberPaymentMethodLabel(row.paymentMethod)}
                </span>
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
                    hint: `ขนาดตามตั้งค่า (${shop?.slipPaperSize || "SLIP_58"})`,
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
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                เลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
                <input
                  className={fieldClass}
                  value={customerTaxId}
                  inputMode="numeric"
                  maxLength={13}
                  onChange={(e) => {
                    setCustomerTaxId(e.target.value.replace(/\D/g, "").slice(0, 13));
                    setTaxVerified(false);
                  }}
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
                />
              </label>
              <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
                สาขา (ถ้ามี)
                <input
                  className={fieldClass}
                  value={customerBranch}
                  onChange={(e) => setCustomerBranch(e.target.value)}
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
                </span>
              </label>
            </div>
          ) : null}

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}
        </div>
      ) : null}
    </FormModal>
  );
}
