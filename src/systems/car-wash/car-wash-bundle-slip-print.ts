import type { WashBundle } from "@/systems/car-wash/car-wash-service";
import { openPosTableBillPrintWindow, type PosTablePaperSize } from "@/systems/building-pos/pos-table-bill-print";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type { PosTablePaperSize };

/** ใบสรุปแพ็กเกจเหมา + แสดงสลิป (เทมเพลตเดียวกับบิลลานล้าง / POS) */
export function buildCarWashBundleSlipInnerHtml(params: {
  shopLabel: string;
  logoUrl: string | null;
  bundle: WashBundle;
  printedAt: string;
  /** URL รูปสลิปที่ resolve แล้ว (absolute) — ว่างได้ */
  slipImageUrl: string | null;
}): string {
  const { shopLabel, logoUrl, bundle, printedAt, slipImageUrl } = params;
  const grandTotal = bundle.paid_amount;
  const remaining = Math.max(0, bundle.total_uses - bundle.used_uses);

  const logoBlock =
    logoUrl?.trim() ?
      `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeHtml(logoUrl.trim())}" alt="" style="max-height:48px;max-width:120px;object-fit:contain;" /></div>`
    : "";

  const slipBlock =
    slipImageUrl?.trim() ?
      `<section style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px;">
<h2 style="font-size:0.95em;margin:0 0 8px;">หลักฐานการชำระ (สลิป)</h2>
<img src="${escapeHtml(slipImageUrl.trim())}" alt="สลิป" style="max-width:100%;height:auto;border-radius:8px;border:1px solid #e2e8f0;" />
</section>`
    : `<p style="margin-top:10px;color:#64748b;font-size:0.85em;">ยังไม่แนบสลิป — อัปโหลดได้ที่แท็บ «เหมา» หรือ «ยอดขาย»</p>`;

  const detailBlock = `<div style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:8px;">
<p style="margin:0;font-size:0.85em;color:#64748b;">แพ็กเหมา #${bundle.id}</p>
<p style="margin:4px 0 0;"><strong>ลูกค้า</strong> ${escapeHtml(bundle.customer_name.trim() || "—")}</p>
<p style="margin:4px 0 0;"><strong>เบอร์</strong> ${escapeHtml(bundle.customer_phone.trim() || "—")}</p>
<p style="margin:4px 0 0;"><strong>ทะเบียน</strong> ${escapeHtml(bundle.plate_number.trim() || "—")}</p>
<p style="margin:4px 0 0;"><strong>แพ็กเกจ</strong> ${escapeHtml(bundle.package_name.trim() || "—")}</p>
<p style="margin:4px 0 0;"><strong>สิทธิ์</strong> ใช้แล้ว ${bundle.used_uses} / ${bundle.total_uses} ครั้ง · คงเหลือ ${remaining} ครั้ง</p>
<p style="margin:8px 0 0;text-align:right;font-weight:600;">ยอดชำระ ฿${grandTotal.toLocaleString("th-TH")}</p>
</div>`;

  return `
${logoBlock}
<h1>${escapeHtml(shopLabel)}</h1>
<p style="margin:0;text-align:center;font-weight:600;color:#0000bf;">ใบสรุปแพ็กเกจเหมาจ่าย</p>
<p style="margin:6px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeHtml(printedAt)}</p>
<div style="margin-top:10px;">${detailBlock}</div>
<div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;text-align:center;">
<p style="margin:0;font-size:0.85em;color:#475569;">ยอดรับชำระ (บาท)</p>
<p class="total-big" style="margin:4px 0 0;">${grandTotal.toLocaleString("th-TH")}</p>
</div>
${slipBlock}
<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">ขอบคุณที่ใช้บริการ</p>
`;
}

export function openCarWashBundleSlipPrintWindow(paper: PosTablePaperSize, innerHtml: string): boolean {
  return openPosTableBillPrintWindow(paper, innerHtml);
}
