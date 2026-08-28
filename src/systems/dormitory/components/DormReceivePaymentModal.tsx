"use client";

import { useEffect, useState } from "react";
import {
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { formatDormAmountStable, formatPeriodMonthLabelStable } from "@/lib/dormitory/format-display-stable";
import { DormPaymentPanel } from "@/systems/dormitory/components/DormPaymentPanel";
import { dormFieldClass, dormFormLabelClass } from "@/systems/dormitory/lib/ui-tokens";
import {
  dormPaymentMethodLabel,
  type DormPaymentMethod,
} from "@/systems/dormitory/lib/payment-method";
import {
  printDormPaidDocuments,
  type DormReceiptBrand,
  type DormReceiptPrintInput,
} from "@/systems/dormitory/lib/dorm-receipt-print";
import { useDormitoryApiFetch } from "@/systems/dormitory/lib/staff-api-fetch";

export type DormReceivePaymentSource = {
  paymentId: number;
  billId: number;
  tenantId: number;
  tenantName: string;
  tenantPhone?: string | null;
  tenantIdCard?: string | null;
  roomNumber: string;
  periodMonth: string;
  amountBaht: number;
  proofSlipUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  source: DormReceivePaymentSource | null;
  brand: DormReceiptBrand;
  onSuccess?: () => void;
};

export function DormReceivePaymentModal({ open, onClose, source, brand, onSuccess }: Props) {
  const apiFetch = useDormitoryApiFetch();
  const { paper } = useAppSlipPaperSize(brand.defaultPaperSize);
  const [paymentMethod, setPaymentMethod] = useState<DormPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);
  const [tenantAddress, setTenantAddress] = useState("");
  const [tenantTaxId, setTenantTaxId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !source) return;
    setPaymentMethod(source.proofSlipUrl ? "PROMPTPAY" : "CASH");
    setSlipUrl(source.proofSlipUrl ?? null);
    setNote("");
    setPrintReceipt(true);
    setPrintTaxInvoice(false);
    setTenantAddress("");
    setTenantTaxId(source.tenantIdCard?.trim() ?? "");
    setErr(null);
  }, [open, source]);

  function runPrint(opts: {
    paidAtIso: string;
    receiptNumber?: string | null;
    paymentMethod: string;
    note?: string | null;
  }) {
    if (!source) return;
    if (!printReceipt && !printTaxInvoice) return;
    if (printTaxInvoice && (!tenantAddress.trim() || !tenantTaxId.trim())) {
      setErr("พิมพ์ใบกำกับภาษีต้องมีที่อยู่และเลขผู้เสียภาษีลูกค้า");
      return;
    }

    const receiptData: DormReceiptPrintInput = {
      dormTitle: brand.dormTitle,
      logoUrl: brand.logoUrl,
      taxId: brand.taxId,
      address: brand.address,
      caretakerPhone: brand.caretakerPhone,
      roomNumber: source.roomNumber,
      tenantName: source.tenantName,
      periodMonth: source.periodMonth,
      amountBaht: source.amountBaht,
      paidAtIso: opts.paidAtIso,
      receiptNumber: opts.receiptNumber,
      note: opts.note,
      paymentMethod: opts.paymentMethod,
    };

    printDormPaidDocuments({
      receipt: printReceipt,
      taxInvoice: printTaxInvoice,
      receiptData,
      taxData: {
        ...receiptData,
        tenantAddress: tenantAddress.trim() || null,
        tenantTaxId: tenantTaxId.trim() || null,
      },
      paper,
    });
  }

  async function submitReceive() {
    if (!source) return;
    setErr(null);
    if (printTaxInvoice && (!tenantAddress.trim() || !tenantTaxId.trim())) {
      setErr("พิมพ์ใบกำกับภาษีต้องมีที่อยู่และเลขผู้เสียภาษีลูกค้า");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/api/dorm/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: source.billId,
          tenantId: source.tenantId,
          paymentMethod,
          note: note.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        payment?: {
          paidAt?: string | null;
          receiptNumber?: string | null;
          paymentMethod?: string | null;
          note?: string | null;
        };
      };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }

      const paid = data.payment;
      runPrint({
        paidAtIso: paid?.paidAt ?? new Date().toISOString(),
        receiptNumber: paid?.receiptNumber,
        paymentMethod: paid?.paymentMethod ?? paymentMethod,
        note: paid?.note ?? (note.trim() || null),
      });

      onSuccess?.();
      onClose();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title="รับชำระเงิน"
      description={
        source
          ? `${source.tenantName} · ห้อง ${source.roomNumber} · งวด ${formatPeriodMonthLabelStable(source.periodMonth)}`
          : undefined
      }
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={() => void submitReceive()}
          submitLabel={busy ? "กำลังบันทึก…" : "ยืนยันรับชำระ"}
          submitDisabled={busy || !source}
        />
      }
    >
      {!source ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <p className="font-black text-[#1e1b4b]">{source.tenantName}</p>
            <p className="text-xs font-semibold text-[#66638c]">
              ห้อง {source.roomNumber} · งวด {source.periodMonth}
            </p>
            <p className="mt-2 text-lg font-black text-emerald-700">
              {formatDormAmountStable(source.amountBaht, 2)} บาท
            </p>
            {source.proofSlipUrl ? (
              <p className="mt-1 text-[11px] font-semibold text-sky-700">
                มีสลิปจากผู้พักแนบแล้ว — ตรวจสอบก่อนยืนยัน
              </p>
            ) : null}
          </div>

          <DormPaymentPanel
            paymentId={source.paymentId}
            amountBaht={source.amountBaht}
            method={paymentMethod}
            slipUrl={slipUrl}
            onMethodChange={setPaymentMethod}
            onSlipUrlChange={setSlipUrl}
            disabled={busy}
          />

          <div>
            <label className={dormFormLabelClass} htmlFor="dorm-receive-note">
              หมายเหตุ <span className="font-normal text-[#8b87b8]">(ไม่บังคับ)</span>
            </label>
            <input
              id="dorm-receive-note"
              className={dormFieldClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`เช่น ${dormPaymentMethodLabel(paymentMethod)}`}
              disabled={busy}
            />
          </div>

          <div>
            <p className={dormFormLabelClass}>พิมพ์หลังรับชำระ</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={busy}
                aria-pressed={printReceipt}
                aria-label="พิมพ์ใบเสร็จรับเงิน"
                onClick={() => setPrintReceipt((v) => !v)}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] rounded-xl px-3 text-xs font-black",
                  printReceipt
                    ? "border-[#5b61ff]/45 bg-[#ecebff]/80 text-[#4d47b6] ring-2 ring-[#5b61ff]/20"
                    : "text-[#4d47b6]",
                )}
              >
                ใบเสร็จรับเงิน
              </button>
              <button
                type="button"
                disabled={busy}
                aria-pressed={printTaxInvoice}
                aria-label="พิมพ์ใบกำกับภาษี"
                onClick={() => setPrintTaxInvoice((v) => !v)}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] rounded-xl px-3 text-xs font-black",
                  printTaxInvoice
                    ? "border-[#5b61ff]/45 bg-[#ecebff]/80 text-[#4d47b6] ring-2 ring-[#5b61ff]/20"
                    : "text-[#4d47b6]",
                )}
              >
                ใบกำกับภาษี
              </button>
            </div>
            {printTaxInvoice ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={dormFormLabelClass} htmlFor="dorm-receive-tax-address">
                    ที่อยู่ลูกค้า <span className="font-semibold text-rose-600">*</span>
                  </label>
                  <input
                    id="dorm-receive-tax-address"
                    className={dormFieldClass}
                    value={tenantAddress}
                    onChange={(e) => setTenantAddress(e.target.value)}
                    placeholder="ที่อยู่บนใบกำกับภาษี"
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className={dormFormLabelClass} htmlFor="dorm-receive-tax-id">
                    เลขผู้เสียภาษี <span className="font-semibold text-rose-600">*</span>
                  </label>
                  <input
                    id="dorm-receive-tax-id"
                    className={dormFieldClass}
                    value={tenantTaxId}
                    onChange={(e) => setTenantTaxId(e.target.value)}
                    placeholder="เลขผู้เสียภาษี"
                    disabled={busy}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}
        </div>
      )}
    </FormModal>
  );
}
