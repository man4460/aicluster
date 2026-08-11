import {
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { barberPaymentMethodLabel } from "@/systems/barber/lib/payment-method";

export type BarberPrintShopProfile = {
  displayName?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  bankAccountName?: string | null;
  slipPaperSize?: AppSlipPaperSize | string | null;
};

export type BarberPrintMemberInput = {
  shop: BarberPrintShopProfile;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  packageName: string;
  totalSessions: number;
  remainingSessions: number;
  priceBaht: number;
  paymentMethod?: string | null;
  soldAtIso?: string | null;
  docNo?: string | null;
  note?: string | null;
};

function baht(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("th-TH");
}

function baseParams(data: BarberPrintMemberInput, paper: AppSlipPaperSize) {
  const soldLabel = data.soldAtIso
    ? new Date(data.soldAtIso).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : bangkokDateKey();
  const shop = data.shop.displayName?.trim() || "ร้านตัดผม";
  return {
    shopLabel: shop,
    address: data.shop.address,
    taxId: data.shop.taxId,
    contactPhone: data.shop.contactPhone,
    orderRef: data.docNo,
    printedAt: new Date().toISOString(),
    customerName: data.customerName,
    paymentMethodLabel: barberPaymentMethodLabel(data.paymentMethod),
    items: [
      {
        name: data.packageName,
        qty: 1,
        unitPrice: data.priceBaht,
        note: [
          data.totalSessions > 0
            ? `${data.totalSessions} ครั้ง · เหลือ ${data.remainingSessions}`
            : null,
          soldLabel,
          data.customerPhone?.trim() || null,
          data.note?.trim() || null,
        ]
          .filter(Boolean)
          .join(" · "),
      },
    ],
    grandTotal: data.priceBaht,
    signerCustomerLabel: data.customerName,
    signerShopLabel: data.shop.bankAccountName?.trim() || shop,
    paper,
    footerNote: `ชำระครบ ${baht(data.priceBaht)} บาท — ขอบคุณที่ใช้บริการ`,
  };
}

export function printBarberSimpleReceipt(data: BarberPrintMemberInput) {
  const paper = resolveAppSlipPaperSize(data.shop.slipPaperSize);
  printAppReceiptSlip({
    ...baseParams(data, paper),
    subtitle: "ใบเสร็จรับเงิน",
  });
}

export function printBarberTaxInvoice(data: BarberPrintMemberInput) {
  printAppReceiptSlip({
    ...baseParams(data, "A4"),
    subtitle: "ใบกำกับภาษี",
    customerAddress: data.customerAddress,
    customerTaxId: data.customerTaxId,
  });
}

export function printBarberMemberDocs(opts: {
  receipt?: boolean;
  taxInvoice?: boolean;
  data: BarberPrintMemberInput;
}) {
  const queue: Array<() => void> = [];
  if (opts.receipt) queue.push(() => printBarberSimpleReceipt(opts.data));
  if (opts.taxInvoice) queue.push(() => printBarberTaxInvoice(opts.data));
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}

export function formatBarberPrintBaht(n: number) {
  return `฿${baht(n)}`;
}
