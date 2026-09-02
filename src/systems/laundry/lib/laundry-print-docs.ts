import {
  alertIfSlipPrintFailed,
  printAppOrderTicketSlip,
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  laundryOrderStatusLabelTh,
  type LaundryOrder,
} from "@/systems/laundry/laundry-service";
import { laundryPaymentMethodLabel } from "@/systems/laundry/lib/payment-method";

export type LaundryPrintShopProfile = {
  displayName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  bankAccountName?: string | null;
  slipPaperSize?: AppSlipPaperSize | string | null;
};

export type LaundryPrintMemberInput = {
  shop: LaundryPrintShopProfile;
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

function formatSoldLabel(iso: string | null | undefined) {
  if (!iso) return bangkokDateKey();
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderLineName(order: LaundryOrder) {
  const svc = order.service_type?.trim();
  if (svc && svc !== order.package_name?.trim()) return svc;
  return order.package_name?.trim() || "บริการซักผ้า";
}

function orderItemNotes(order: LaundryOrder) {
  const parts: string[] = [];
  if (order.weight_kg > 0) parts.push(`${order.weight_kg} กก.`);
  if (order.item_count > 0) parts.push(`${order.item_count} ชิ้น`);
  const pickup = order.pickup_address?.trim();
  if (pickup && pickup !== "หน้าร้าน" && pickup !== "-") parts.push(`รับ: ${pickup}`);
  const note = order.note?.trim();
  if (note) parts.push(note);
  return parts.length ? parts.join(" · ") : undefined;
}

function resolveShopLabel(shop?: LaundryPrintShopProfile | null) {
  return shop?.displayName?.trim() || "รับฝากซักผ้า";
}

function memberBaseParams(data: LaundryPrintMemberInput, paper: AppSlipPaperSize) {
  const shop = resolveShopLabel(data.shop);
  const soldLabel = formatSoldLabel(data.soldAtIso);
  return {
    shopLabel: shop,
    logoUrl: data.shop.logoUrl,
    address: data.shop.address,
    taxId: data.shop.taxId,
    contactPhone: data.shop.contactPhone,
    orderRef: data.docNo,
    printedAt: data.soldAtIso || new Date().toISOString(),
    customerName: data.customerName,
    paymentMethodLabel: laundryPaymentMethodLabel(data.paymentMethod),
    items: [
      {
        name: data.packageName,
        qty: 1,
        unitPrice: data.priceBaht,
        note: [
          data.totalSessions > 0 ? `${data.totalSessions} ครั้ง · เหลือ ${data.remainingSessions}` : null,
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

/** ใบเสร็จรับเงิน — ออเดอร์ซักผ้า */
export function printLaundryOrderReceipt(
  order: LaundryOrder,
  shop?: LaundryPrintShopProfile | null,
  paperOverride?: AppSlipPaperSize | string | null,
): boolean {
  if (!(order.final_price > 0)) return false;
  const paper = resolveAppSlipPaperSize(paperOverride ?? shop?.slipPaperSize);
  const shopLabel = resolveShopLabel(shop);
  const ok = printAppReceiptSlip({
    shopLabel,
    logoUrl: shop?.logoUrl,
    address: shop?.address,
    taxId: shop?.taxId,
    contactPhone: shop?.contactPhone,
    subtitle: "ใบเสร็จรับเงิน",
    orderRef: `LD-${order.id}`,
    printedAt: order.order_at,
    customerName: order.customer_name?.trim() || order.customer_phone?.trim() || null,
    paymentMethodLabel: laundryPaymentMethodLabel(order.payment_method),
    items: [
      {
        name: orderLineName(order),
        qty: 1,
        unitPrice: order.final_price,
        note: orderItemNotes(order),
      },
    ],
    grandTotal: order.final_price,
    signerShopLabel: shop?.bankAccountName?.trim() || shopLabel,
    paper,
    footerNote: "ขอบคุณที่ใช้บริการ",
    documentTitle: `ใบเสร็จซักผ้า #${order.id}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

/** สลิปงานติดถุง — แบบสลิปครัว POS */
export function printLaundryOrderWorkTicket(
  order: LaundryOrder,
  shop?: LaundryPrintShopProfile | null,
  paperOverride?: AppSlipPaperSize | string | null,
): boolean {
  const paper = resolveAppSlipPaperSize(paperOverride ?? shop?.slipPaperSize);
  const pickup = order.pickup_address?.trim();
  const dropoff = order.dropoff_address?.trim();
  const ok = printAppOrderTicketSlip({
    shopLabel: resolveShopLabel(shop),
    logoUrl: shop?.logoUrl,
    subtitle: "สลิปงาน · ซักผ้า",
    tableLabel: `#${order.id}`,
    highlightLabel: `#${order.id}`,
    orderRef: String(order.id),
    customerName:
      [order.customer_name?.trim(), order.customer_phone?.trim()].filter(Boolean).join(" · ") || null,
    note: [
      pickup && pickup !== "หน้าร้าน" ? `รับ: ${pickup}` : null,
      dropoff && dropoff !== "หน้าร้าน" ? `ส่ง: ${dropoff}` : null,
      order.note?.trim() || null,
    ]
      .filter(Boolean)
      .join(" · "),
    printedAt: order.order_at,
    items: [
      {
        name: orderLineName(order),
        qty: 1,
        note: orderItemNotes(order),
      },
    ],
    variant: "kitchen",
    grandTotal: order.final_price > 0 ? order.final_price : undefined,
    paper,
    footerNote: laundryOrderStatusLabelTh(order.status),
    documentTitle: `สลิปงานซัก #${order.id}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

export function printLaundryOrderDocs(opts: {
  order: LaundryOrder;
  shop?: LaundryPrintShopProfile | null;
  receipt?: boolean;
  workTicket?: boolean;
  paper?: AppSlipPaperSize | string | null;
}) {
  const queue: Array<() => void> = [];
  if (opts.receipt) queue.push(() => printLaundryOrderReceipt(opts.order, opts.shop, opts.paper));
  if (opts.workTicket) queue.push(() => printLaundryOrderWorkTicket(opts.order, opts.shop, opts.paper));
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}

export function printLaundryMemberReceipt(
  data: LaundryPrintMemberInput,
  paperOverride?: AppSlipPaperSize | string | null,
) {
  const paper = resolveAppSlipPaperSize(paperOverride ?? data.shop.slipPaperSize);
  printAppReceiptSlip({
    ...memberBaseParams(data, paper),
    subtitle: "ใบเสร็จรับเงิน",
    documentTitle: `ใบเสร็จแพ็กซัก ${data.docNo ?? ""}`.trim(),
  });
}

export function printLaundryTaxInvoice(data: LaundryPrintMemberInput) {
  printAppReceiptSlip({
    ...memberBaseParams(data, "A4"),
    subtitle: "ใบกำกับภาษี",
    customerAddress: data.customerAddress,
    customerTaxId: data.customerTaxId,
    documentTitle: `ใบกำกับภาษีแพ็กซัก ${data.docNo ?? ""}`.trim(),
  });
}

export function printLaundryMemberDocs(opts: {
  receipt?: boolean;
  taxInvoice?: boolean;
  data: LaundryPrintMemberInput;
  receiptPaper?: AppSlipPaperSize | string | null;
}) {
  const queue: Array<() => void> = [];
  if (opts.receipt) queue.push(() => printLaundryMemberReceipt(opts.data, opts.receiptPaper));
  if (opts.taxInvoice) queue.push(() => printLaundryTaxInvoice(opts.data));
  queue.forEach((fn, i) => {
    window.setTimeout(fn, i * 650);
  });
}

export function formatLaundryPrintBaht(n: number) {
  return `฿${baht(n)}`;
}
