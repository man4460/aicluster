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
import QRCode from "qrcode";

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

/** แถบบาร์โค้ดแบบ CSS จากสตริง (สำหรับพิมพ์ฉลาก — ไม่ต้องสแกนจริง) */
function buildBarcodeBarsHtml(code: string, heightPx = 42): string {
  const raw = code.replace(/\s+/g, "").toUpperCase() || "TRACK";
  const bits: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    bits.push(1, (c >> 0) & 1, (c >> 1) & 1, (c >> 2) & 1, (c >> 3) & 1, 0);
  }
  while (bits.length < 48) bits.push(...bits.slice(0, 8));
  const slice = bits.slice(0, 64);
  const bars = slice
    .map((b, i) => {
      const w = b ? 2 + (i % 3 === 0 ? 1 : 0) : 1;
      const color = b ? "#111" : "#fff";
      return `<span style="display:inline-block;width:${w}px;height:${heightPx}px;background:${color};"></span>`;
    })
    .join("");
  return `<div style="display:inline-flex;align-items:stretch;line-height:0;border:1px solid #111;padding:2px;background:#fff;">${bars}</div>`;
}

function formatPrintDate(iso: string | null | undefined) {
  if (!iso) return bangkokDateKey();
  return new Date(iso).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * พิมพ์ฉลากจัดส่งแบบพัสดุ (โครงคล้ายฉลากขนส่งไทย)
 * ส่วนบน = ฉลากติดกล่อง · เส้นตัด · ส่วนล่าง = รายการแพ็ค
 */
export async function printEcommerceShippingLabel(
  order: EcommerceOrderPrintInput,
  shop?: EcommerceOrderPrintShop | null,
): Promise<boolean> {
  const store = shopLabel(shop);
  const shopAddr = shop?.address?.trim() || "—";
  const shopPhone = shop?.contactPhone?.trim() || "—";
  const toAddr = order.customerAddress?.trim() || "— ไม่ระบุที่อยู่ —";
  const courier = order.courierTrackingNo?.trim() || order.trackingCode;
  const trackPayload = courier || order.referenceCode;
  const printDay = formatPrintDate(order.createdAt);

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(trackPayload, {
      width: 160,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    });
  } catch {
    qrDataUrl = "";
  }

  const itemRows =
    order.items.length === 0
      ? `<tr><td colspan="3" style="padding:6px 4px;color:#64748b;">ไม่มีรายการสินค้า</td></tr>`
      : order.items
          .map(
            (it, i) => `<tr>
  <td style="width:28px;text-align:center;padding:5px 4px;border-bottom:1px solid #111;vertical-align:top;">${i + 1}</td>
  <td style="padding:5px 4px;border-bottom:1px solid #111;border-left:1px solid #111;vertical-align:top;">${escapeSlipHtml(it.productName)}</td>
  <td style="width:52px;text-align:center;padding:5px 4px;border-bottom:1px solid #111;border-left:1px solid #111;vertical-align:top;font-weight:700;">${it.quantity}</td>
</tr>`,
          )
          .join("");

  const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8"/>
<title>ฉลาก ${escapeSlipHtml(order.referenceCode)}</title>
<style>
@page { size: A6 portrait; margin: 4mm; }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Segoe UI", Tahoma, "Sarabun", system-ui, sans-serif;
  color: #111;
  background: #fff;
  font-size: 11px;
  line-height: 1.35;
}
.label {
  width: 100%;
  max-width: 105mm;
  margin: 0 auto;
  border: 1.5px solid #111;
}
.row { display: flex; width: 100%; }
.cell { border-right: 1px solid #111; border-bottom: 1px solid #111; padding: 5px 6px; }
.cell:last-child { border-right: 0; }
.muted { color: #444; font-size: 9px; font-weight: 700; letter-spacing: 0.02em; }
.badge {
  display: inline-block;
  background: #525252;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  letter-spacing: 0.04em;
}
.badge-lg {
  background: #525252;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
  padding: 8px 10px;
  text-align: center;
  min-width: 36px;
}
.strong { font-weight: 800; }
.mono { font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; letter-spacing: 0.03em; }
.cut {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 6px;
  color: #333;
  font-size: 10px;
}
.cut-line {
  flex: 1;
  border-top: 1.5px dashed #111;
  height: 0;
}
.pack { width: 100%; max-width: 105mm; margin: 0 auto; border-collapse: collapse; }
.pack th, .pack td { font-size: 10px; }
.pack th {
  text-align: left;
  font-weight: 800;
  border-top: 1.5px solid #111;
  border-bottom: 1.5px solid #111;
  padding: 5px 4px;
}
.pack th + th { border-left: 1px solid #111; }
</style></head><body>

<div class="label">
  <!-- Header -->
  <div class="row">
    <div class="cell" style="flex:1.2;display:flex;flex-direction:column;justify-content:center;gap:6px;">
      <div style="font-size:16px;font-weight:900;letter-spacing:0.02em;">MAWELL <span style="font-size:11px;font-weight:700;color:#444;">SHIP</span></div>
      <div><span class="badge">DROP OFF</span></div>
      <div class="muted">ออเดอร์ ${escapeSlipHtml(order.referenceCode)}</div>
    </div>
    <div class="cell" style="flex:1;text-align:center;padding-top:6px;padding-bottom:4px;">
      ${buildBarcodeBarsHtml(courier, 48)}
      <div class="mono strong" style="margin-top:4px;font-size:12px;">${escapeSlipHtml(courier)}</div>
    </div>
  </div>

  <!-- FROM / TO + side -->
  <div class="row">
    <div style="flex:1.55;display:flex;flex-direction:column;min-width:0;">
      <div class="cell" style="border-right:1px solid #111;min-height:52px;">
        <div class="muted">ผู้ส่ง (FROM)</div>
        <div class="strong" style="font-size:12px;margin-top:2px;">${escapeSlipHtml(store)}</div>
        <div style="margin-top:2px;white-space:pre-wrap;">${escapeSlipHtml(shopAddr)}</div>
        <div class="muted" style="margin-top:3px;">โทร. ${escapeSlipHtml(shopPhone)}</div>
      </div>
      <div class="cell" style="border-right:1px solid #111;min-height:64px;flex:1;">
        <div class="muted">ผู้รับ (TO)</div>
        <div class="strong" style="font-size:13px;margin-top:2px;">${escapeSlipHtml(order.customerName)}</div>
        <div style="margin-top:2px;white-space:pre-wrap;">${escapeSlipHtml(toAddr)}</div>
      </div>
    </div>
    <div style="flex:0.7;display:flex;flex-direction:column;min-width:0;">
      <div class="cell" style="border-right:0;text-align:center;font-weight:900;font-size:13px;padding:8px 4px;">HOME</div>
      <div class="cell" style="border-right:0;">
        <div class="muted">Phone</div>
        <div class="strong" style="margin-top:2px;font-size:12px;">${escapeSlipHtml(order.customerPhone)}</div>
      </div>
      <div class="cell" style="border-right:0;text-align:center;font-weight:900;font-size:12px;padding:10px 4px;">ไม่ต้องเก็บเงิน</div>
      <div class="cell" style="border-right:0;flex:1;">
        <div class="muted">Delivery Attempts</div>
        <div style="margin-top:6px;">1. ____________</div>
        <div style="margin-top:6px;">2. ____________</div>
      </div>
    </div>
  </div>

  <!-- Order barcode row -->
  <div class="row">
    <div class="cell" style="flex:1.2;text-align:center;padding-top:6px;">
      ${buildBarcodeBarsHtml(order.referenceCode, 28)}
      <div class="muted" style="margin-top:3px;">Order No. <span class="mono">${escapeSlipHtml(order.referenceCode)}</span></div>
    </div>
    <div class="cell" style="flex:1;border-right:0;">
      <div class="muted">PICKUP / SHIP DATE</div>
      <div class="strong" style="margin-top:2px;">${escapeSlipHtml(printDay)}</div>
      <div class="muted" style="margin-top:6px;">NOTE</div>
      <div>ติดตาม ${escapeSlipHtml(order.trackingCode)}</div>
    </div>
  </div>

  <!-- Routing + QR -->
  <div class="row" style="align-items:stretch;">
    <div class="cell" style="flex:0 0 auto;border-bottom:0;display:flex;align-items:center;justify-content:center;padding:8px;">
      <div class="badge-lg">TH</div>
    </div>
    <div class="cell" style="flex:1;border-bottom:0;display:flex;flex-direction:column;justify-content:center;gap:4px;">
      <div class="strong" style="font-size:14px;">จัดส่งพัสดุ · ชำระแล้ว</div>
      <div class="mono strong" style="font-size:15px;letter-spacing:0.06em;">${escapeSlipHtml(courier)}</div>
      <div class="muted" style="font-size:8px;font-weight:500;">กรุณาติดฉลากด้านนอกกล่อง · ตัดตามเส้นประด้านล่างหากต้องการแยกรายการแพ็ค</div>
    </div>
    <div class="cell" style="flex:0 0 auto;border-right:0;border-bottom:0;text-align:center;padding:6px;">
      ${
        qrDataUrl
          ? `<img src="${qrDataUrl}" alt="QR" width="72" height="72" style="display:block;width:72px;height:72px;" />`
          : `<div class="mono" style="width:72px;height:72px;border:1px solid #111;display:flex;align-items:center;justify-content:center;font-size:9px;">QR</div>`
      }
    </div>
  </div>
</div>

<div class="cut">
  <span aria-hidden="true">✂</span>
  <div class="cut-line"></div>
</div>

<table class="pack" cellspacing="0" cellpadding="0">
  <thead>
    <tr>
      <th style="width:28px;text-align:center;">#</th>
      <th>ชื่อสินค้า</th>
      <th style="width:52px;text-align:center;">จำนวน</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

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
