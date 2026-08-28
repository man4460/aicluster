import {
  alertIfSlipPrintFailed,
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppReceiptSlipBuildParams,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { formatPeriodMonthLabelStable } from "@/lib/dormitory/format-display-stable";
import { dormPaymentMethodLabel } from "@/systems/dormitory/lib/payment-method";

export type DormReceiptBrand = {
  dormTitle: string;
  logoUrl?: string | null;
  taxId?: string | null;
  address?: string | null;
  caretakerPhone?: string | null;
  defaultPaperSize: string;
};

export type DormReceiptPrintInput = {
  dormTitle: string;
  logoUrl?: string | null;
  taxId?: string | null;
  address?: string | null;
  caretakerPhone?: string | null;
  roomNumber: string;
  tenantName: string;
  periodMonth: string;
  amountBaht: number;
  paidAtIso: string;
  receiptNumber?: string | null;
  note?: string | null;
  paymentMethod?: string | null;
};

export function dormReceiptSlipBuildParams(
  data: DormReceiptPrintInput,
  paper?: AppSlipPaperSize | string | null,
): AppReceiptSlipBuildParams {
  const periodLabel = formatPeriodMonthLabelStable(data.periodMonth);
  const amount = Math.round(data.amountBaht * 100) / 100;
  return {
    shopLabel: data.dormTitle,
    logoUrl: data.logoUrl,
    taxId: data.taxId,
    address: data.address,
    contactPhone: data.caretakerPhone,
    subtitle: "ใบเสร็จรับเงิน",
    orderRef: data.receiptNumber?.trim() || undefined,
    printedAt: data.paidAtIso,
    customerName: data.tenantName,
    items: [
      {
        name: `ค่าเช่า / น้ำไฟ ห้อง ${data.roomNumber}`,
        qty: 1,
        unitPrice: amount,
        note: `งวด ${periodLabel} (${data.periodMonth})`,
      },
    ],
    grandTotal: amount,
    paymentMethodLabel:
      data.paymentMethod && data.paymentMethod.trim()
        ? dormPaymentMethodLabel(data.paymentMethod)
        : data.note?.trim() || "ชำระแล้ว",
    footerNote: "ขอบคุณที่ใช้บริการ",
    signerCustomerLabel: data.tenantName,
    signerShopLabel: data.dormTitle,
    paper,
  };
}

/** พิมพ์ใบเสร็จหอพัก — เลย์เอาต์มาตรฐาน 58 / 80 / A4 เหมือน POS / โรงแรม */
export function printDormReceipt(
  data: DormReceiptPrintInput,
  paper: AppSlipPaperSize | string | null,
): void {
  const resolved = resolveAppSlipPaperSize(paper);
  const ok = printAppReceiptSlip({
    ...dormReceiptSlipBuildParams(data, resolved),
    paper: resolved,
    documentTitle: `ใบเสร็จ ห้อง ${data.roomNumber}`,
    pageOpts: resolved === "A4" ? { a4TightVerticalMargins: true } : undefined,
  });
  alertIfSlipPrintFailed(ok);
}

export type DormTaxInvoicePrintInput = DormReceiptPrintInput & {
  tenantAddress?: string | null;
  tenantTaxId?: string | null;
};

export function dormTaxInvoiceSlipBuildParams(
  data: DormTaxInvoicePrintInput,
  paper?: AppSlipPaperSize | string | null,
): AppReceiptSlipBuildParams {
  return {
    ...dormReceiptSlipBuildParams(data, paper),
    subtitle: "ใบกำกับภาษี",
    customerAddress: data.tenantAddress?.trim() || undefined,
    customerTaxId: data.tenantTaxId?.trim() || undefined,
    footerNote: "เอกสารนี้ออกในนามผู้พักตามที่ระบุ",
  };
}

/** พิมพ์ใบกำกับภาษีหอพัก — แบบฟอร์มเดียวกับใบเสร็จ + ที่อยู่/เลขผู้เสียภาษีลูกค้า */
export function printDormTaxInvoice(
  data: DormTaxInvoicePrintInput,
  paper: AppSlipPaperSize | string | null,
): void {
  const resolved = resolveAppSlipPaperSize(paper);
  const ok = printAppReceiptSlip({
    ...dormTaxInvoiceSlipBuildParams(data, resolved),
    paper: resolved,
    documentTitle: `ใบกำกับภาษี ห้อง ${data.roomNumber}`,
    pageOpts: resolved === "A4" ? { a4TightVerticalMargins: true } : undefined,
  });
  alertIfSlipPrintFailed(ok);
}

/** พิมพ์เอกสารหลังชำระแล้ว — ใบเสร็จ · ใบกำกับ (ทีละฉบับ) */
export function printDormPaidDocuments(opts: {
  receipt?: boolean;
  taxInvoice?: boolean;
  receiptData: DormReceiptPrintInput;
  taxData?: DormTaxInvoicePrintInput;
  paper: AppSlipPaperSize | string | null;
}): void {
  const queue: Array<() => void> = [];
  if (opts.receipt) {
    queue.push(() => printDormReceipt(opts.receiptData, opts.paper));
  }
  if (opts.taxInvoice && opts.taxData) {
    const taxData = opts.taxData;
    queue.push(() => printDormTaxInvoice(taxData, opts.paper));
  }
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}
