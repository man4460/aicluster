import {
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { bangkokDateKey } from "@/lib/time/bangkok";
import type {
  FootballTurfBooking,
  FootballTurfPromotionSale,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";
import { footballTurfBookingAmountPaidBaht } from "@/systems/football-turf/lib/portal-booking";

export type FootballTurfPrintDocInput = {
  venueName: string;
  venueAddress?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  accountName?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  teamName?: string | null;
  /** ชื่อรายการบนสลิป (สนาม / โปรโมชั่น) */
  itemLabel: string;
  bookingDate: string;
  startTime?: string | null;
  endTime?: string | null;
  totalBaht: number;
  amountPaidBaht: number;
  paymentMethodLabel?: string | null;
  note?: string | null;
  docNo?: string | null;
  paper?: AppSlipPaperSize | string | null;
};

function baht(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("th-TH");
}

function ymdTh(ymd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function footballTurfPaymentMethodLabel(
  method: string | null | undefined,
): string {
  if (method === "TRANSFER") return "โอนเงิน / พร้อมเพย์";
  if (method === "ONSITE" || method === "CASH") return "เงินสด / หน้าสนาม";
  return "ไม่ระบุ";
}

type PrintExtras = {
  customerName?: string;
  customerAddress?: string;
  customerTaxId?: string;
  noteExtra?: string;
};

export function buildFootballTurfPrintDocFromBooking(
  booking: FootballTurfBooking,
  settings: FootballTurfVenueSettings,
  extras?: PrintExtras,
): FootballTurfPrintDocInput {
  const noteParts = [booking.note?.trim(), extras?.noteExtra?.trim()].filter(Boolean);
  return {
    venueName: settings.venueName.trim() || "สนามหญ้าเทียม",
    venueAddress: settings.venueAddress,
    taxId: settings.taxId,
    contactPhone: settings.contactPhone,
    accountName: settings.accountName,
    customerName: extras?.customerName?.trim() || booking.customerName,
    customerPhone: booking.customerPhone,
    customerAddress: extras?.customerAddress,
    customerTaxId: extras?.customerTaxId,
    teamName: booking.teamName,
    itemLabel: `ค่าสนาม ${booking.courtName}`,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalBaht: booking.finalPrice,
    amountPaidBaht: footballTurfBookingAmountPaidBaht(booking),
    paymentMethodLabel: footballTurfPaymentMethodLabel(booking.paymentMethod),
    note: noteParts.length ? noteParts.join(" · ") : null,
    docNo: `FT-${booking.id}`,
    paper: settings.slipPaperSize,
  };
}

export function buildFootballTurfPrintDocFromPromotionSale(
  sale: FootballTurfPromotionSale,
  settings: FootballTurfVenueSettings,
  extras?: PrintExtras,
): FootballTurfPrintDocInput {
  const paid = (sale.paymentStatus ?? "PAID") === "PAID" ? sale.price : 0;
  const noteParts = [
    `${sale.totalUses} รอบ · เหลือ ${sale.remainingUses}`,
    extras?.noteExtra?.trim(),
  ].filter(Boolean);
  return {
    venueName: settings.venueName.trim() || "สนามหญ้าเทียม",
    venueAddress: settings.venueAddress,
    taxId: settings.taxId,
    contactPhone: settings.contactPhone,
    accountName: settings.accountName,
    customerName: extras?.customerName?.trim() || sale.customerName,
    customerPhone: sale.customerPhone,
    customerAddress: extras?.customerAddress,
    customerTaxId: extras?.customerTaxId,
    teamName: sale.teamName,
    itemLabel: `โปรโมชั่น ${sale.promotionName}`,
    bookingDate: bangkokDateKey(new Date(sale.createdAt)),
    startTime: null,
    endTime: null,
    totalBaht: sale.price,
    amountPaidBaht: paid,
    paymentMethodLabel: footballTurfPaymentMethodLabel(sale.paymentMethod),
    note: noteParts.length ? noteParts.join(" · ") : null,
    docNo: `FT-P-${sale.id}`,
    paper: settings.slipPaperSize,
  };
}

function baseParams(data: FootballTurfPrintDocInput, paper: AppSlipPaperSize) {
  const team = data.teamName?.trim();
  const timePart =
    data.startTime && data.endTime ? ` · ${data.startTime}–${data.endTime}` : "";
  return {
    shopLabel: data.venueName,
    address: data.venueAddress,
    taxId: data.taxId,
    contactPhone: data.contactPhone,
    orderRef: data.docNo,
    printedAt: new Date().toISOString(),
    customerName: data.customerName,
    paymentMethodLabel: data.paymentMethodLabel,
    items: [
      {
        name: data.itemLabel,
        qty: 1,
        unitPrice: data.totalBaht,
        note: `${ymdTh(data.bookingDate)}${timePart}${team ? ` · ${team}` : ""}${
          data.note?.trim() ? ` · ${data.note.trim()}` : ""
        }`,
      },
    ],
    grandTotal: data.totalBaht,
    signerCustomerLabel: data.customerName,
    signerShopLabel: data.accountName?.trim() || data.venueName,
    paper,
    footerNote:
      data.amountPaidBaht >= data.totalBaht
        ? `ชำระครบ ${baht(data.totalBaht)} บาท — ขอบคุณที่ใช้บริการ${
            data.customerPhone?.trim() ? ` · โทร ${data.customerPhone.trim()}` : ""
          }`
        : `ชำระแล้ว ${baht(data.amountPaidBaht)} บาท · ค้าง ${baht(
            Math.max(0, data.totalBaht - data.amountPaidBaht),
          )} บาท`,
  };
}

/** สลิป / ใบเสร็จทั่วไป — ขนาดตามตั้งค่าโมดูล */
export function printFootballTurfSimpleReceipt(data: FootballTurfPrintDocInput) {
  const paper = resolveAppSlipPaperSize(data.paper);
  printAppReceiptSlip({
    ...baseParams(data, paper),
    subtitle: "ใบเสร็จรับเงิน",
    documentTitle: data.docNo ? `ใบเสร็จ ${data.docNo}` : "ใบเสร็จรับเงิน",
  });
}

/** ใบกำกับภาษี — แบบฟอร์มทางการ A4 + ที่อยู่/เลขผู้เสียภาษีลูกค้า */
export function printFootballTurfTaxInvoice(data: FootballTurfPrintDocInput) {
  printAppReceiptSlip({
    ...baseParams(data, "A4"),
    subtitle: "ใบกำกับภาษี",
    customerAddress: data.customerAddress,
    customerTaxId: data.customerTaxId,
    documentTitle: data.docNo ? `ใบกำกับภาษี ${data.docNo}` : "ใบกำกับภาษี",
  });
}

export function printFootballTurfDocs(opts: {
  receipt?: boolean;
  taxInvoice?: boolean;
  data: FootballTurfPrintDocInput;
}) {
  const queue: Array<() => void> = [];
  if (opts.receipt) queue.push(() => printFootballTurfSimpleReceipt(opts.data));
  if (opts.taxInvoice) queue.push(() => printFootballTurfTaxInvoice(opts.data));
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}
