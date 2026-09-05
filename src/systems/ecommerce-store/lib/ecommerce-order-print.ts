import {
  alertIfSlipPrintFailed,
  escapeSlipHtml,
  printAppReceiptSlip,
  resolveAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";
import { openPrintableHtml } from "@/components/app-templates";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ecommercePosPaymentMethodLabel } from "@/systems/ecommerce-store/lib/payment-method";

export type EcommerceOrderPrintShop = {
  storeName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxId?: string | null;
  contactPhone?: string | null;
  slipPaperSize?: AppSlipPaperSize | string | null;
};

export type EcommerceOrderPrintItem = {
  productName: string;
  quantity: number;
  unitPriceBaht: string | number;
  lineTotalBaht?: string | number;
};

export type EcommerceOrderPrintInput = {
  referenceCode: string;
  trackingCode: string;
  courierTrackingNo?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  customerTaxId?: string | null;
  totalAmount: string | number;
  paymentMethod?: string | null;
  createdAt?: string | null;
  items: EcommerceOrderPrintItem[];
};

function baht(n: number) {
  return Math.max(0, Math.round(n)).toLocaleString("th-TH");
}

function num(v: string | number | null | undefined) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function shopLabel(shop?: EcommerceOrderPrintShop | null) {
  return shop?.storeName?.trim() || "ร้านออนไลน์";
}

function baseReceiptParams(order: EcommerceOrderPrintInput, shop: EcommerceOrderPrintShop | null | undefined) {
  const paper = resolveAppSlipPaperSize(shop?.slipPaperSize);
  return {
    shopLabel: shopLabel(shop),
    logoUrl: shop?.logoUrl,
    address: shop?.address,
    taxId: shop?.taxId,
    contactPhone: shop?.contactPhone,
    orderRef: order.referenceCode,
    printedAt: order.createdAt || new Date().toISOString(),
    customerName: order.customerName,
    customerAddress: order.customerAddress,
    customerTaxId: order.customerTaxId,
    paymentMethodLabel: ecommercePosPaymentMethodLabel(order.paymentMethod) || "โอนเงิน",
    items: order.items.map((it) => ({
      name: it.productName,
      qty: it.quantity,
      unitPrice: num(it.unitPriceBaht),
    })),
    grandTotal: num(order.totalAmount),
    footerNote: order.courierTrackingNo
      ? `เลขพัสดุ ${order.courierTrackingNo}`
      : `ติดตามออเดอร์ ${order.trackingCode}`,
    paper,
  };
}

/** พิมพ์ฉลากจัดส่ง (ที่อยู่ผู้รับ) */
export function printEcommerceShippingLabel(
  order: EcommerceOrderPrintInput,
  shop?: EcommerceOrderPrintShop | null,
) {
  const store = shopLabel(shop);
  const addr = order.customerAddress?.trim() || "— ไม่ระบุที่อยู่ —";
  const courier = order.courierTrackingNo?.trim();
  const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8"/><title>ฉลาก ${escapeSlipHtml(order.referenceCode)}</title>
<style>
@page { size: 100mm 150mm; margin: 6mm; }
body { margin: 0; font-family: system-ui, "Segoe UI", Tahoma, sans-serif; color: #0f172a; }
.box { border: 2px solid #0f172a; border-radius: 8px; padding: 12px 14px; box-sizing: border-box; min-height: 130mm; }
.from { font-size: 11px; color: #64748b; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #94a3b8; }
.to-label { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: #64748b; margin: 0 0 4px; }
.name { font-size: 20px; font-weight: 900; margin: 0 0 4px; }
.phone { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
.addr { font-size: 14px; line-height: 1.45; white-space: pre-wrap; margin: 0 0 14px; }
.meta { font-size: 12px; margin-top: auto; padding-top: 10px; border-top: 1px solid #cbd5e1; }
.code { font-family: ui-monospace, monospace; font-weight: 800; font-size: 15px; letter-spacing: 0.04em; }
</style></head><body>
<div class="box">
  <div class="from">ผู้ส่ง: ${escapeSlipHtml(store)}${shop?.contactPhone ? ` · ${escapeSlipHtml(shop.contactPhone)}` : ""}</div>
  <p class="to-label">ส่งถึง</p>
  <p class="name">${escapeSlipHtml(order.customerName)}</p>
  <p class="phone">โทร. ${escapeSlipHtml(order.customerPhone)}</p>
  <p class="addr">${escapeSlipHtml(addr)}</p>
  <div class="meta">
    <div>ออเดอร์ <span class="code">${escapeSlipHtml(order.referenceCode)}</span></div>
    <div style="margin-top:4px;">ติดตามร้าน <span class="code">${escapeSlipHtml(order.trackingCode)}</span></div>
    ${
      courier
        ? `<div style="margin-top:8px;font-size:16px;">เลขพัสดุ <span class="code">${escapeSlipHtml(courier)}</span></div>`
        : ""
    }
    <div style="margin-top:8px;color:#64748b;font-size:11px;">พิมพ์ ${escapeSlipHtml(bangkokDateKey())}</div>
  </div>
</div>
</body></html>`;
  const ok = openPrintableHtml(html);
  alertIfSlipPrintFailed(ok);
  return ok;
}

export function printEcommerceOrderReceipt(
  order: EcommerceOrderPrintInput,
  shop?: EcommerceOrderPrintShop | null,
) {
  const params = baseReceiptParams(order, shop);
  const ok = printAppReceiptSlip({
    ...params,
    subtitle: "ใบเสร็จรับเงิน",
    documentTitle: `ใบเสร็จ ${order.referenceCode}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}

export function printEcommerceOrderTaxInvoice(
  order: EcommerceOrderPrintInput,
  shop?: EcommerceOrderPrintShop | null,
) {
  const params = baseReceiptParams(order, shop);
  const ok = printAppReceiptSlip({
    ...params,
    paper: "A4",
    subtitle: "ใบกำกับภาษี",
    documentTitle: `ใบกำกับภาษี ${order.referenceCode}`,
    footerNote: `ยอดรวม ฿${baht(num(order.totalAmount))} · ${order.trackingCode}`,
  });
  alertIfSlipPrintFailed(ok);
  return ok;
}
