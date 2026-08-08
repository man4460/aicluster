import {
  alertIfSlipPrintFailed,
  printAppOrderTicketSlip,
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import type { DrinkPosOrderBoardRow } from "@/systems/drink-pos/lib/order-board";
import { drinkPosPaymentMethodLabel } from "@/systems/drink-pos/lib/payment-method";

export type DrinkPosShopReceiptMeta = {
  shopLabel?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  slipPaperSize?: AppSlipPaperSize | string | null;
};

export type DrinkPosSaleReceiptInput = {
  id: string;
  note?: string | null;
  totalBaht: number;
  paymentMethod?: string | null;
  createdAt: string;
  memberPhone?: string | null;
  isRewardRedemption?: boolean | null;
  lines: Array<{
    id?: string;
    productName: string;
    sizeLabel?: string | null;
    quantity: number;
    unitPriceBaht?: number | null;
    lineTotalBaht?: number | null;
  }>;
};

/** พิมพ์สลิปคิวครัว (กระดานคิว) — ไม่ใช่ใบเสร็จ */
export function printDrinkPosOrderTicket(
  order: DrinkPosOrderBoardRow,
  opts?: { paper?: AppSlipPaperSize | string | null; shopLabel?: string | null },
): boolean {
  const shortId = order.id.slice(-6).toUpperCase();
  const ok = printAppOrderTicketSlip({
    shopLabel: opts?.shopLabel,
    subtitle: "สลิปครัว · เครื่องดื่ม",
    tableLabel: shortId,
    highlightLabel: `คิว ${shortId}`,
    orderRef: shortId,
    customerName: order.memberPhone ? `ลูกค้า ${order.memberPhone}` : null,
    note: order.note,
    printedAt: order.createdAt,
    items: order.lines.map((l) => ({
      name: l.sizeLabel ? `${l.productName} (${l.sizeLabel})` : l.productName,
      qty: l.quantity,
    })),
    variant: "kitchen",
    grandTotal: order.totalBaht,
    paper: resolveAppSlipPaperSize(opts?.paper),
    footerNote: order.isRewardRedemption ? "แลกคะแนน" : "พร้อมเสิร์ฟ",
    documentTitle: `สลิปเครื่องดื่ม ${shortId}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

/**
 * ใบเสร็จหลังออเดอร์ — template กลาง · ขนาดจากตั้งค่าโมดูล
 */
export function printDrinkPosSaleReceipt(
  sale: DrinkPosSaleReceiptInput,
  shop?: DrinkPosShopReceiptMeta | null,
  opts?: { paper?: AppSlipPaperSize | string | null },
): boolean {
  const shortId = sale.id.slice(-6).toUpperCase();
  const paper = resolveAppSlipPaperSize(opts?.paper ?? shop?.slipPaperSize);
  const shopLabel = shop?.shopLabel?.trim() || "ร้านเครื่องดื่ม";
  const ok = printAppReceiptSlip({
    shopLabel,
    logoUrl: shop?.logoUrl,
    address: shop?.address,
    taxId: shop?.taxId,
    contactPhone: shop?.contactPhone,
    subtitle: "ใบเสร็จรับเงิน",
    orderRef: shortId,
    printedAt: sale.createdAt,
    customerName: sale.memberPhone?.trim() || null,
    paymentMethodLabel: drinkPosPaymentMethodLabel(sale.paymentMethod),
    signerShopLabel: shopLabel,
    items: sale.lines.map((l) => {
      const unit =
        typeof l.unitPriceBaht === "number" && Number.isFinite(l.unitPriceBaht)
          ? l.unitPriceBaht
          : typeof l.lineTotalBaht === "number" && l.quantity > 0
            ? l.lineTotalBaht / l.quantity
            : undefined;
      return {
        name: l.sizeLabel ? `${l.productName} (${l.sizeLabel})` : l.productName,
        qty: l.quantity,
        unitPrice: unit,
      };
    }),
    grandTotal: sale.totalBaht,
    paper,
    footerNote: sale.isRewardRedemption ? "แลกคะแนน · ขอบคุณที่ใช้บริการ" : "ขอบคุณที่ใช้บริการ",
    documentTitle: `ใบเสร็จเครื่องดื่ม ${shortId}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

/** @deprecated ใช้ printDrinkPosSaleReceipt */
export function drinkPosSaleToOrderTicketRow(sale: {
  id: string;
  note?: string | null;
  totalBaht: number;
  fulfillmentStatus?: string | null;
  statusUpdatedAt?: string | null;
  createdAt: string;
  memberPhone?: string | null;
  isRewardRedemption?: boolean | null;
  lines: Array<{
    id?: string;
    productName: string;
    sizeLabel?: string | null;
    quantity: number;
  }>;
}): DrinkPosOrderBoardRow {
  const status = (["RECEIVED", "MAKING", "DONE", "SERVED"].includes(sale.fulfillmentStatus ?? "")
    ? sale.fulfillmentStatus
    : "RECEIVED") as DrinkPosOrderBoardRow["fulfillmentStatus"];
  return {
    id: sale.id,
    note: sale.note ?? null,
    totalBaht: sale.totalBaht,
    fulfillmentStatus: status,
    statusUpdatedAt: sale.statusUpdatedAt ?? sale.createdAt,
    createdAt: sale.createdAt,
    memberPhone: sale.memberPhone ?? null,
    isRewardRedemption: sale.isRewardRedemption === true,
    lines: sale.lines.map((l, i) => ({
      id: l.id ?? `line-${i}`,
      productName: l.productName,
      sizeLabel: l.sizeLabel ?? null,
      quantity: l.quantity,
    })),
  };
}
