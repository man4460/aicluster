"use client";

import { useEffect, useState } from "react";
import {
  AppSlipPaperSizeToolbar,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  formatPeriodMonthLabelStable,
  formatVillageAmountStable,
} from "@/lib/village/format-display-stable";
import { villageField } from "@/systems/village/village-ui";
import {
  printVillagePaidDocuments,
  type VillageReceiptPrintInput,
  type VillageTaxInvoicePrintInput,
} from "@/systems/village/lib/village-receipt-print";

export type VillagePaymentPrintSource = {
  houseNo: string;
  residentName: string;
  residentPhone?: string | null;
  periodMonth: string;
  amountBaht: number;
  paidAtIso: string;
  receiptNumber?: string | null;
  note?: string | null;
  paymentMethod?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  defaultPaperSize?: string | null;
  brand: Omit<
    VillageReceiptPrintInput,
    "houseNo" | "residentName" | "periodMonth" | "amountBaht" | "paidAtIso"
  >;
  payment: VillagePaymentPrintSource | null;
  preferTaxInvoice?: boolean;
};

export function VillagePaymentPrintModal({
  open,
  onClose,
  defaultPaperSize,
  brand,
  payment,
  preferTaxInvoice = false,
}: Props) {
  const { paper, setPaper } = useAppSlipPaperSize(defaultPaperSize);
  const [residentAddress, setResidentAddress] = useState("");
  const [residentTaxId, setResidentTaxId] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !payment) return;
    setResidentAddress("");
    setResidentTaxId("");
    setPrintReceipt(!preferTaxInvoice);
    setPrintTaxInvoice(preferTaxInvoice);
    setError(null);
    setInfo(null);
  }, [open, payment, preferTaxInvoice]);

  function submitPrint() {
    if (!payment) return;
    if (!printReceipt && !printTaxInvoice) {
      setError("เลือกเอกสารอย่างน้อย 1 ประเภท");
      return;
    }
    if (printTaxInvoice && (!residentAddress.trim() || !residentTaxId.trim())) {
      setError("พิมพ์ใบกำกับภาษีต้องมีที่อยู่และเลขผู้เสียภาษีลูกค้า");
      return;
    }

    const receiptData: VillageReceiptPrintInput = {
      ...brand,
      houseNo: payment.houseNo,
      residentName: payment.residentName,
      periodMonth: payment.periodMonth,
      amountBaht: payment.amountBaht,
      paidAtIso: payment.paidAtIso,
      receiptNumber: payment.receiptNumber,
      note: payment.note,
      paymentMethod: payment.paymentMethod,
    };

    const taxData: VillageTaxInvoicePrintInput = {
      ...receiptData,
      residentAddress: residentAddress.trim() || null,
      residentTaxId: residentTaxId.trim() || null,
    };

    setError(null);
    printVillagePaidDocuments({
      receipt: printReceipt,
      taxInvoice: printTaxInvoice,
      receiptData,
      taxData,
      paper,
    });

    const kinds = [
      printReceipt ? "ใบเสร็จ" : null,
      printTaxInvoice ? "ใบกำกับภาษี" : null,
    ].filter(Boolean);
    setInfo(`ส่งพิมพ์แล้ว: ${kinds.join(" · ")}`);
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title="พิมพ์เอกสาร"
      description={
        payment
          ? `${payment.residentName} · บ้าน ${payment.houseNo} · งวด ${formatPeriodMonthLabelStable(payment.periodMonth)}`
          : undefined
      }
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={submitPrint}
          submitLabel="พิมพ์ที่เลือก"
          submitDisabled={!payment || (!printReceipt && !printTaxInvoice)}
        />
      }
    >
      {!payment ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <p className="font-black text-[#1e1b4b]">{payment.residentName}</p>
            <p className="text-xs font-semibold text-[#66638c]">
              {payment.residentPhone?.trim() || "—"} · บ้าน {payment.houseNo}
            </p>
            <p className="mt-1 text-xs font-medium text-[#8b87b8]">
              งวด {formatPeriodMonthLabelStable(payment.periodMonth)} ({payment.periodMonth})
            </p>
            <p className="mt-2 text-sm font-black text-emerald-700">
              ชำระแล้ว {formatVillageAmountStable(payment.amountBaht, 2)} บาท
            </p>
          </div>

          <div>
            <p className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">ขนาดกระดาษ</p>
            <div className="mt-2">
              <AppSlipPaperSizeToolbar
                value={paper}
                onChange={setPaper}
                sizes={["SLIP_58", "SLIP_80", "A4"]}
                aria-label="ขนาดกระดาษเอกสาร"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#66638c]">
              58 mm กึ่งกลางบนกระดาษ · 80 mm / A4 ชิดซ้าย
            </p>
          </div>

          <div>
            <p className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">เลือกเอกสารพิมพ์</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  { key: "receipt" as const, label: "ใบเสร็จรับเงิน", checked: printReceipt, set: setPrintReceipt },
                  {
                    key: "tax" as const,
                    label: "ใบกำกับภาษี",
                    checked: printTaxInvoice,
                    set: setPrintTaxInvoice,
                  },
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

          {printTaxInvoice ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
              <p className="text-xs font-bold text-[#4d47b6]">
                ที่อยู่ / เลขผู้เสียภาษีลูกค้า
                <span className="ml-1 font-semibold text-rose-600">· บังคับเมื่อพิมพ์ใบกำกับ</span>
              </p>
              <textarea
                className={cn(villageField, "min-h-[72px]")}
                value={residentAddress}
                onChange={(e) => setResidentAddress(e.target.value)}
                placeholder="ที่อยู่ลูกบ้าน (สำหรับใบกำกับภาษี)"
                aria-label="ที่อยู่ลูกบ้าน"
              />
              <input
                className={villageField}
                value={residentTaxId}
                onChange={(e) => setResidentTaxId(e.target.value)}
                placeholder="เลขผู้เสียภาษี / เลขบัตรประชาชน"
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
