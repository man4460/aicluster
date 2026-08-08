import {
  printAppReceiptSlip,
  type AppSlipLineItem,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";

export type HotelResortPrintExtraLine = {
  label: string;
  amountBaht: number;
};

export type HotelResortPrintDocInput = {
  propertyName: string;
  propertyTaxId?: string | null;
  propertyAddress?: string | null;
  propertyPhone?: string | null;
  logoUrl?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  /** ชื่อผู้จัดการจากตั้งค่าที่พัก — ลายเซ็นผู้รับเงิน */
  managerName?: string | null;
  guestName: string;
  guestPhone: string;
  guestAddress?: string | null;
  guestTaxId?: string | null;
  roomNumber?: string | null;
  roomTypeName?: string | null;
  checkInAt: string;
  checkOutAt: string;
  /** ค่าห้อง (ก่อนรายการเพิ่ม) — ไม่ส่ง = ใช้ totalBaht */
  roomChargeBaht?: number;
  totalBaht: number;
  amountPaidBaht: number;
  paymentMethodLabel?: string | null;
  note?: string | null;
  docNo?: string | null;
  printedAt?: Date;
  extras?: HotelResortPrintExtraLine[];
};

function baht(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("th-TH");
}

function ymdTh(isoOrYmd: string) {
  const key = isoOrYmd.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return isoOrYmd;
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

function stayLineItems(data: HotelResortPrintDocInput): AppSlipLineItem[] {
  const roomCharge =
    typeof data.roomChargeBaht === "number" && Number.isFinite(data.roomChargeBaht)
      ? Math.max(0, Math.round(data.roomChargeBaht))
      : Math.max(
          0,
          Math.round(
            data.totalBaht - (data.extras ?? []).reduce((s, e) => s + Math.max(0, Math.round(e.amountBaht)), 0),
          ),
        );
  const items: AppSlipLineItem[] = [
    {
      name: `ค่าห้องพัก ห้อง ${data.roomNumber || "-"}`,
      qty: 1,
      unitPrice: roomCharge,
      note: `${ymdTh(data.checkInAt)} – ${ymdTh(data.checkOutAt)}${
        data.roomTypeName ? ` · ${data.roomTypeName}` : ""
      }`,
    },
  ];
  for (const e of data.extras ?? []) {
    const amount = Math.max(0, Math.round(e.amountBaht));
    if (!e.label.trim() || amount <= 0) continue;
    items.push({ name: e.label.trim(), qty: 1, unitPrice: amount });
  }
  return items;
}

function paidFooter(data: HotelResortPrintDocInput, kind: "receipt" | "tax" | "folio"): string {
  const remaining = Math.max(0, data.totalBaht - data.amountPaidBaht);
  const bits: string[] = [];
  if (data.amountPaidBaht < data.totalBaht) {
    bits.push(`ชำระแล้ว ${baht(data.amountPaidBaht)} บาท · ค้าง ${baht(remaining)} บาท`);
  } else if (kind !== "folio") {
    bits.push("ชำระครบแล้ว — ขอบคุณที่ใช้บริการ");
  } else {
    bits.push(`ชำระแล้ว ${baht(data.amountPaidBaht)} บาท · ยอดค้าง ${baht(remaining)} บาท`);
  }
  if (data.guestPhone?.trim()) bits.push(`โทรลูกค้า ${data.guestPhone.trim()}`);
  return bits.join(" · ");
}

function baseSlipParams(data: HotelResortPrintDocInput) {
  return {
    shopLabel: data.propertyName,
    logoUrl: data.logoUrl,
    taxId: data.propertyTaxId,
    address: data.propertyAddress,
    contactPhone: data.propertyPhone,
    orderRef: data.docNo,
    printedAt: (data.printedAt ?? new Date()).toISOString(),
    customerName: data.guestName,
    paymentMethodLabel: data.paymentMethodLabel,
    items: stayLineItems(data),
    grandTotal: data.totalBaht,
    signerCustomerLabel: data.guestName,
    signerShopLabel:
      data.managerName?.trim() || data.bankAccountName?.trim() || data.propertyName,
    paper: "A4" as AppSlipPaperSize,
  };
}

/** ใบเสร็จธรรมดา — แบบฟอร์ม A4 มาตรฐานกลาง */
export function printHotelResortSimpleReceipt(data: HotelResortPrintDocInput) {
  printAppReceiptSlip({
    ...baseSlipParams(data),
    subtitle: "ใบเสร็จรับเงิน",
    footerNote: paidFooter(data, "receipt"),
  });
}

/** ใบกำกับภาษี — แบบฟอร์ม A4 เดียวกับใบเสร็จ + ที่อยู่/เลขผู้เสียภาษีลูกค้า */
export function printHotelResortTaxInvoice(data: HotelResortPrintDocInput) {
  printAppReceiptSlip({
    ...baseSlipParams(data),
    subtitle: "ใบกำกับภาษี",
    customerAddress: data.guestAddress,
    customerTaxId: data.guestTaxId,
    footerNote: paidFooter(data, "tax"),
  });
}

/** โฟลิโอ — แบบฟอร์ม A4 ตารางรายการค่าใช้จ่าย */
export function printHotelResortFolio(data: HotelResortPrintDocInput) {
  printAppReceiptSlip({
    ...baseSlipParams(data),
    subtitle: "โฟลิโอ",
    customerAddress: data.guestAddress,
    customerTaxId: data.guestTaxId,
    footerNote: paidFooter(data, "folio"),
  });
}

/** พิมพ์ทีละฉบับตามที่เลือก — ใบเสร็จ · ใบกำกับ · โฟลิโอ (A4) */
export function printHotelResortCheckInDocs(opts: {
  receipt?: boolean;
  taxInvoice?: boolean;
  folio?: boolean;
  data: HotelResortPrintDocInput;
  /** ไม่ใช้แล้ว — เอกสารโรงแรมบังคับ A4 ตามแบบฟอร์ม */
  receiptPaper?: AppSlipPaperSize | string | null;
}) {
  const queue: Array<() => void> = [];
  if (opts.receipt) queue.push(() => printHotelResortSimpleReceipt(opts.data));
  if (opts.taxInvoice) queue.push(() => printHotelResortTaxInvoice(opts.data));
  if (opts.folio) queue.push(() => printHotelResortFolio(opts.data));
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}
