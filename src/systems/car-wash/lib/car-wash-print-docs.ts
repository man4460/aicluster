import {
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { bangkokDateKey } from "@/lib/time/bangkok";
import type { ServiceVisit, WashBundle } from "@/systems/car-wash/car-wash-service";
import {
  carWashPaymentMethodLabel,
  type CarWashPaymentMethod,
} from "@/systems/car-wash/lib/payment-method";

export type CarWashPrintShopProfile = {
  displayName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  bankAccountName?: string | null;
  slipPaperSize?: AppSlipPaperSize | string | null;
};

export type CarWashPrintVisitInput = {
  shop: CarWashPrintShopProfile;
  customerName: string;
  customerPhone: string;
  plateNumber?: string | null;
  packageName: string;
  priceBaht: number;
  paymentMethod?: string | null;
  soldAtIso?: string | null;
  docNo?: string | null;
  note?: string | null;
};

function baht(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("th-TH");
}

function baseParams(data: CarWashPrintVisitInput, paper: AppSlipPaperSize) {
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
  const shop = data.shop.displayName?.trim() || "คาร์แคร์";
  return {
    shopLabel: shop,
    logoUrl: data.shop.logoUrl,
    address: data.shop.address,
    taxId: data.shop.taxId,
    contactPhone: data.shop.contactPhone,
    orderRef: data.docNo,
    printedAt: new Date().toISOString(),
    customerName: data.customerName,
    paymentMethodLabel: carWashPaymentMethodLabel(data.paymentMethod),
    items: [
      {
        name: data.packageName,
        qty: 1,
        unitPrice: data.priceBaht,
        note: [soldLabel, data.customerPhone?.trim() || null, data.plateNumber?.trim() || null, data.note?.trim() || null]
          .filter(Boolean)
          .join(" · "),
      },
    ],
    grandTotal: data.priceBaht,
    signerCustomerLabel: data.customerName,
    signerShopLabel: data.shop.bankAccountName?.trim() || shop,
    paper,
    footerNote:
      data.priceBaht > 0
        ? `ชำระครบ ${baht(data.priceBaht)} บาท — ขอบคุณที่ใช้บริการ`
        : "ใช้สิทธิ์แพ็กเหมา — ขอบคุณที่ใช้บริการ",
  };
}

export function printCarWashVisitReceipt(data: CarWashPrintVisitInput) {
  const paper = resolveAppSlipPaperSize(data.shop.slipPaperSize);
  printAppReceiptSlip({
    ...baseParams(data, paper),
    subtitle: "ใบเสร็จรับเงิน",
  });
}

/** อ่านช่องทางจากโน้ตที่บันทึกตอนรับชำระ (เช่น `ชำระ: พร้อมเพย์`) */
export function carWashPaymentMethodFromNote(note: string | null | undefined): CarWashPaymentMethod | null {
  const n = note?.trim() ?? "";
  if (!n) return null;
  if (/ชำระ:\s*พร้อมเพย์/i.test(n) || /พร้อมเพย์/.test(n) && /ชำระ/.test(n)) return "PROMPTPAY";
  if (/ชำระ:\s*โอน/.test(n)) return "TRANSFER";
  if (/ชำระ:\s*บัตร/.test(n)) return "CREDIT_CARD";
  if (/ชำระ:\s*เงินสด/.test(n)) return "CASH";
  return null;
}

export function printCarWashVisitReceiptFromVisit(
  shop: CarWashPrintShopProfile,
  visit: ServiceVisit,
): boolean {
  if (!(visit.final_price > 0)) return false;
  const noteClean = (visit.note ?? "")
    .replace(/\s*·\s*ชำระ:\s*[^\n·]+/g, "")
    .trim();
  printCarWashVisitReceipt({
    shop,
    customerName: visit.customer_name.trim() || visit.plate_number.trim() || "ลูกค้า",
    customerPhone: visit.customer_phone,
    plateNumber: visit.plate_number,
    packageName: visit.package_name || "บริการคาร์แคร์",
    priceBaht: visit.final_price,
    paymentMethod: carWashPaymentMethodFromNote(visit.note) ?? "CASH",
    soldAtIso: visit.visit_at,
    docNo: `CW-${visit.id}`,
    note: noteClean || null,
  });
  return true;
}

export function printCarWashBundleReceipt(
  shop: CarWashPrintShopProfile,
  bundle: WashBundle,
): boolean {
  if (!(bundle.paid_amount > 0)) return false;
  const remaining = Math.max(0, bundle.total_uses - bundle.used_uses);
  printCarWashVisitReceipt({
    shop,
    customerName: bundle.customer_name.trim() || bundle.plate_number.trim() || "ลูกค้า",
    customerPhone: bundle.customer_phone,
    plateNumber: bundle.plate_number,
    packageName: `แพ็กเหมา: ${bundle.package_name}`,
    priceBaht: bundle.paid_amount,
    paymentMethod: "CASH",
    soldAtIso: bundle.created_at,
    docNo: `CB-${bundle.id}`,
    note: `${bundle.total_uses} ครั้ง · เหลือ ${remaining}`,
  });
  return true;
}
