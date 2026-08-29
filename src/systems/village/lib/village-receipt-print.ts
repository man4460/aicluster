import {
  alertIfSlipPrintFailed,
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppReceiptSlipBuildParams,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { formatPeriodMonthLabelStable } from "@/lib/village/format-display-stable";

export type VillageReceiptBrand = {
  villageTitle: string;
  taxId?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  defaultPaperSize: string;
};

export type VillageReceiptPrintInput = {
  villageTitle: string;
  taxId?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  houseNo: string;
  residentName: string;
  periodMonth: string;
  amountBaht: number;
  paidAtIso: string;
  receiptNumber?: string | null;
  note?: string | null;
  paymentMethod?: string | null;
};

export function villageReceiptSlipBuildParams(
  data: VillageReceiptPrintInput,
  paper?: AppSlipPaperSize | string | null,
): AppReceiptSlipBuildParams {
  const periodLabel = formatPeriodMonthLabelStable(data.periodMonth);
  const amount = Math.round(data.amountBaht * 100) / 100;
  return {
    shopLabel: data.villageTitle,
    taxId: data.taxId,
    address: data.address,
    contactPhone: data.contactPhone,
    subtitle: "ใบเสร็จรับเงิน",
    orderRef: data.receiptNumber?.trim() || undefined,
    printedAt: data.paidAtIso,
    customerName: data.residentName,
    items: [
      {
        name: `ค่าส่วนกลาง บ้าน ${data.houseNo}`,
        qty: 1,
        unitPrice: amount,
        note: `งวด ${periodLabel} (${data.periodMonth})`,
      },
    ],
    grandTotal: amount,
    paymentMethodLabel:
      data.paymentMethod && data.paymentMethod.trim()
        ? data.paymentMethod.trim()
        : data.note?.trim() || "ชำระแล้ว",
    footerNote: "ขอบคุณที่ใช้บริการ",
    signerCustomerLabel: data.residentName,
    signerShopLabel: data.villageTitle,
    paper,
  };
}

/** พิมพ์ใบเสร็จหมู่บ้าน — เลย์เอาต์มาตรฐาน 58 / 80 / A4 */
export function printVillageReceipt(
  data: VillageReceiptPrintInput,
  paper: AppSlipPaperSize | string | null,
): void {
  const resolved = resolveAppSlipPaperSize(paper);
  const ok = printAppReceiptSlip({
    ...villageReceiptSlipBuildParams(data, resolved),
    paper: resolved,
    documentTitle: `ใบเสร็จ บ้าน ${data.houseNo}`,
    pageOpts: resolved === "A4" ? { a4TightVerticalMargins: true } : undefined,
  });
  alertIfSlipPrintFailed(ok);
}

export type VillageTaxInvoicePrintInput = VillageReceiptPrintInput & {
  residentAddress?: string | null;
  residentTaxId?: string | null;
};

export function villageTaxInvoiceSlipBuildParams(
  data: VillageTaxInvoicePrintInput,
  paper?: AppSlipPaperSize | string | null,
): AppReceiptSlipBuildParams {
  return {
    ...villageReceiptSlipBuildParams(data, paper),
    subtitle: "ใบกำกับภาษี",
    customerAddress: data.residentAddress?.trim() || undefined,
    customerTaxId: data.residentTaxId?.trim() || undefined,
    footerNote: "เอกสารนี้ออกในนามลูกบ้านตามที่ระบุ",
  };
}

/** พิมพ์ใบกำกับภาษีหมู่บ้าน */
export function printVillageTaxInvoice(
  data: VillageTaxInvoicePrintInput,
  paper: AppSlipPaperSize | string | null,
): void {
  const resolved = resolveAppSlipPaperSize(paper);
  const ok = printAppReceiptSlip({
    ...villageTaxInvoiceSlipBuildParams(data, resolved),
    paper: resolved,
    documentTitle: `ใบกำกับภาษี บ้าน ${data.houseNo}`,
    pageOpts: resolved === "A4" ? { a4TightVerticalMargins: true } : undefined,
  });
  alertIfSlipPrintFailed(ok);
}

/** พิมพ์เอกสารหลังชำระแล้ว — ใบเสร็จ · ใบกำกับ (ทีละฉบับ) */
export function printVillagePaidDocuments(opts: {
  receipt?: boolean;
  taxInvoice?: boolean;
  receiptData: VillageReceiptPrintInput;
  taxData?: VillageTaxInvoicePrintInput;
  paper: AppSlipPaperSize | string | null;
}): void {
  const queue: Array<() => void> = [];
  if (opts.receipt) {
    queue.push(() => printVillageReceipt(opts.receiptData, opts.paper));
  }
  if (opts.taxInvoice && opts.taxData) {
    const taxData = opts.taxData;
    queue.push(() => printVillageTaxInvoice(taxData, opts.paper));
  }
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}
