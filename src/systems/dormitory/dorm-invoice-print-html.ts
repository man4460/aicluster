/** HTML ภายในสำหรับ window.print แบบ POS (58 / 80 / A4) — ใบแจ้งหนี้หอพัก */

import { formatDormAmountStable } from "@/lib/dormitory/format-display-stable";

export type DormInvoicePrintPayload = {
  dormName: string;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  roomNumber: string;
  tenantName: string;
  tenantPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote: string | null;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
};

/** slip = กระดาษร้อนแคบ | a4Preview = หัวกระดาษสองคอลัมน์เหมือนหน้าพรีวิว */
export type DormInvoicePrintLayout = "slip" | "a4Preview";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDormInvoiceBillInnerHtml(
  p: DormInvoicePrintPayload,
  layout: DormInvoicePrintLayout = "slip",
): string {
  const amt = formatDormAmountStable(p.amount, 2);

  const logoImg = p.logoUrl?.trim()
    ? `<img src="${escapeHtml(p.logoUrl.trim())}" alt="" style="width:72px;height:72px;max-width:80px;max-height:80px;object-fit:contain;border-radius:10px;border:1px solid #f1f5f9;background:#fff;box-sizing:border-box;padding:3px;" />`
    : "";

  const headerPreview = `
<header style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-start;padding-bottom:16px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;">
  <div style="display:flex;gap:12px;align-items:flex-start;flex:1;min-width:200px;">
    ${logoImg ? `<div style="flex-shrink:0;">${logoImg}</div>` : ""}
    <div style="min-width:0;">
      <h1 style="margin:0;font-size:1.125rem;line-height:1.25;font-weight:700;color:#0f172a;">${escapeHtml(p.dormName)}</h1>
      <p style="margin:6px 0 0;font-size:0.75rem;font-weight:600;color:#3730a3;">ใบแจ้งหนี้ / แจ้งชำระค่าห้อง</p>
    </div>
  </div>
  <div style="flex:1;min-width:200px;max-width:55%;font-size:0.75rem;line-height:1.45;color:#475569;text-align:right;">
    ${p.taxId?.trim() ? `<p style="margin:0 0 4px;font-weight:600;color:#1e293b;">เลขผู้เสียภาษี ${escapeHtml(p.taxId.trim())}</p>` : ""}
    ${p.address?.trim() ? `<p style="margin:0 0 4px;white-space:pre-wrap;">${escapeHtml(p.address.trim())}</p>` : ""}
    ${p.caretakerPhone?.trim() ? `<p style="margin:0;font-weight:600;color:#1e293b;">ติดต่อ ${escapeHtml(p.caretakerPhone.trim())}</p>` : ""}
  </div>
</header>`;

  const logoBlockSlip =
    logoImg ? `<div style="text-align:center;margin-bottom:8px;">${logoImg}</div>` : "";

  const shopBlockSlip = `
<h1 style="margin:0 0 4px;text-align:center;">${escapeHtml(p.dormName)}</h1>
<p style="margin:0;text-align:center;font-weight:600;color:#3730a3;">ใบแจ้งหนี้ / แจ้งชำระค่าห้อง</p>`;

  const metaTopSlip = `
<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:0.9em;line-height:1.45;color:#334155;">
${p.taxId?.trim() ? `<p style="margin:0 0 4px;">เลขผู้เสียภาษี ${escapeHtml(p.taxId.trim())}</p>` : ""}
${p.address?.trim() ? `<p style="margin:0 0 4px;white-space:pre-wrap;">${escapeHtml(p.address.trim())}</p>` : ""}
${p.caretakerPhone?.trim() ? `<p style="margin:0;">ติดต่อ ${escapeHtml(p.caretakerPhone.trim())}</p>` : ""}
</div>`;

  const headerBlock = layout === "a4Preview" ? headerPreview : `${logoBlockSlip}${shopBlockSlip}${metaTopSlip}`;

  const tenantBlockSlip = `
<section style="margin-top:10px;">
<h2 style="margin:0 0 6px;font-size:0.85em;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">ข้อมูลผู้พัก</h2>
<table style="width:100%;font-size:0.95em;border-collapse:collapse;">
<tr><td style="padding:2px 8px 2px 0;color:#64748b;">ห้อง</td><td style="padding:2px 0;font-weight:600;">${escapeHtml(p.roomNumber)}</td></tr>
<tr><td style="padding:2px 8px 2px 0;color:#64748b;">ผู้พัก</td><td style="padding:2px 0;font-weight:600;">${escapeHtml(p.tenantName)}</td></tr>
<tr><td style="padding:2px 8px 2px 0;color:#64748b;">เบอร์</td><td style="padding:2px 0;">${escapeHtml(p.tenantPhone)}</td></tr>
<tr><td style="padding:2px 8px 2px 0;color:#64748b;">งวด</td><td style="padding:2px 0;font-family:ui-monospace,monospace;font-weight:600;">${escapeHtml(p.periodMonth)}</td></tr>
</table>
</section>`;

  const tenantBlockA4 = `
<section style="margin-top:16px;">
<h2 style="margin:0 0 10px;font-size:0.625rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;">ข้อมูลผู้พัก</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;font-size:0.875rem;line-height:1.35;">
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">ห้อง</div>
    <div style="margin-top:2px;font-weight:600;color:#0f172a;">${escapeHtml(p.roomNumber)}</div>
  </div>
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">ผู้พัก</div>
    <div style="margin-top:2px;font-weight:600;color:#0f172a;">${escapeHtml(p.tenantName)}</div>
  </div>
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">เบอร์ผู้พัก</div>
    <div style="margin-top:2px;font-weight:500;word-break:break-all;color:#1e293b;">${escapeHtml(p.tenantPhone)}</div>
  </div>
  <div style="min-width:0;">
    <div style="font-size:0.625rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">งวด</div>
    <div style="margin-top:2px;font-family:ui-monospace,monospace;font-size:0.875rem;font-weight:600;color:#1e293b;">${escapeHtml(p.periodMonth)}</div>
  </div>
</div>
</section>`;

  const tenantBlock = layout === "a4Preview" ? tenantBlockA4 : tenantBlockSlip;

  const amountBlockSlip = `
<div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:10px;text-align:center;border:1px solid #e0e7ff;">
<p style="margin:0;font-size:0.85em;color:#475569;">ยอดที่ต้องชำระ (บาท)</p>
<p style="margin:6px 0 0;font-size:1.75em;font-weight:800;color:#3730a3;">${escapeHtml(amt)}</p>
</div>`;

  const amountBlockA4 = `
<div style="margin-top:18px;padding:16px 18px;text-align:center;border-radius:12px;border:1px solid #e0e7ff;background:linear-gradient(to bottom right,#eef2ff,#ffffff,#f8fafc);">
<p style="margin:0;font-size:0.6875rem;font-weight:600;color:#475569;">ยอดที่ต้องชำระ (บาท)</p>
<p style="margin:6px 0 0;font-size:2rem;font-weight:800;color:#3730a3;">${escapeHtml(amt)}</p>
</div>`;

  const amountBlock = layout === "a4Preview" ? amountBlockA4 : amountBlockSlip;

  const channelsBlockSlip =
    p.paymentChannelsNote?.trim() ?
      `<section style="margin-top:10px;"><h2 style="margin:0 0 4px;font-size:0.85em;color:#64748b;">ช่องทางชำระเงิน</h2><p style="margin:0;white-space:pre-wrap;font-size:0.95em;">${escapeHtml(p.paymentChannelsNote.trim())}</p></section>`
    : `<p style="margin-top:8px;font-size:0.85em;color:#64748b;">(ตั้งค่าช่องทางโอนที่ตั้งค่าหอพัก)</p>`;

  const channelsBlockA4 =
    p.paymentChannelsNote?.trim() ?
      `<section style="margin-top:18px;">
<h2 style="margin:0 0 8px;font-size:0.625rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">ช่องทางชำระเงิน</h2>
<p style="margin:0;white-space:pre-wrap;font-size:0.875rem;line-height:1.5;color:#1e293b;">${escapeHtml(p.paymentChannelsNote.trim())}</p>
</section>`
    : `<p style="margin-top:12px;font-size:0.8125rem;color:#64748b;">(ตั้งค่าช่องทางโอนได้ที่โปรไฟล์ / ตั้งค่าหอพัก)</p>`;

  const channelsBlock = layout === "a4Preview" ? channelsBlockA4 : channelsBlockSlip;

  const ppBlockSlip =
    p.promptPayQrDataUrl ?
      `<section class="qr-wrap"><h2 style="text-align:center;font-size:0.95em;margin:0 0 6px;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeHtml(p.promptPayQrDataUrl)}" alt="PromptPay QR" />
<p style="margin:6px 0 0;text-align:center;color:#64748b;font-size:0.85em;">ยอด ${escapeHtml(amt)} บาท</p></section>`
    : `<p style="margin-top:10px;text-align:center;color:#92400e;font-size:0.85em;">ยังไม่ได้ตั้งเบอร์พร้อมเพย์</p>`;

  const ppBlockA4 =
    p.promptPayQrDataUrl ?
      `<section style="margin-top:24px;padding-top:22px;border-top:1px dashed #cbd5e1;text-align:center;">
<h2 style="margin:0 0 10px;font-size:0.625rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.12em;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeHtml(p.promptPayQrDataUrl)}" alt="PromptPay QR" style="width:200px;max-width:100%;height:auto;object-fit:contain;" />
<p style="margin:8px 0 0;font-size:0.6875rem;color:#64748b;">ยอด ${escapeHtml(amt)} บาท</p>
</section>`
    : `<p style="margin-top:18px;padding-top:16px;border-top:1px dashed #cbd5e1;text-align:center;color:#92400e;font-size:0.8125rem;line-height:1.45;">ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งค่าได้ที่โปรไฟล์ส่วนกลาง</p>`;

  const ppBlock = layout === "a4Preview" ? ppBlockA4 : ppBlockSlip;

  const slipStepsSlip = `
<section style="margin-top:12px;padding:10px;background:#f1f5f9;border-radius:10px;border:1px solid #e2e8f0;">
<h2 style="margin:0 0 8px;text-align:center;font-size:0.8em;color:#64748b;text-transform:uppercase;">หลังโอนแล้ว — แนบสลิป</h2>
<ol style="margin:0;padding-left:1.1em;font-size:0.9em;line-height:1.5;color:#334155;">
<li>โอนเงินตามช่องทางให้ครบยอด</li>
<li>สแกน QR แนบสลิปด้านล่าง หรือขอลิงก์จากเจ้าของหอ</li>
<li>เจ้าของหอตรวจสลิปที่หน้าห้องแล้วกดรับชำระ</li>
</ol>
${p.slipUploadQrDataUrl ? `<div style="text-align:center;margin-top:10px;"><img src="${escapeHtml(p.slipUploadQrDataUrl)}" alt="สแกนแนบสลิป" style="width:112px;height:112px;object-fit:contain;border-radius:8px;border:1px solid #fff;background:#fff;" /><p style="margin:6px 0 0;font-size:0.75em;font-weight:700;color:#475569;">สแกนแนบสลิป</p></div>` : ""}
</section>`;

  const slipStepsA4 = `
<section style="margin-top:22px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
<h2 style="margin:0 0 14px;text-align:center;font-size:0.625rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">หลังโอนแล้ว — แนบสลิป</h2>
<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;justify-content:space-between;">
<ol style="flex:1;min-width:220px;margin:0;padding:0;list-style:none;font-size:0.8125rem;line-height:1.45;color:#334155;">
<li style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-start;">
<span style="flex-shrink:0;width:24px;height:24px;border-radius:999px;background:#3730a3;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">1</span>
<span>โอนเงินตามช่องทางด้านบนให้ครบยอด</span>
</li>
<li style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-start;">
<span style="flex-shrink:0;width:24px;height:24px;border-radius:999px;background:#3730a3;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">2</span>
<span>สแกน QR มุมขวาเพื่ออัปโหลดสลิป หรือขอลิงก์จากเจ้าของหอแล้วเปิดลิงก์แนบรูปสลิป</span>
</li>
<li style="display:flex;gap:8px;align-items:flex-start;">
<span style="flex-shrink:0;width:24px;height:24px;border-radius:999px;background:#3730a3;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">3</span>
<span>เจ้าของหอจะตรวจสลิปที่หน้าห้อง แล้วกดยืนยันรับชำระ</span>
</li>
</ol>
${p.slipUploadQrDataUrl ? `<div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;margin:0 auto;">
<img src="${escapeHtml(p.slipUploadQrDataUrl)}" alt="สแกนแนบสลิป" style="width:112px;height:112px;object-fit:contain;border-radius:8px;border:1px solid #fff;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.06);" />
<p style="margin:6px 0 0;font-size:0.625rem;font-weight:700;color:#475569;">สแกนแนบสลิป</p>
</div>` : ""}
</div>
</section>`;

  const slipSteps = layout === "a4Preview" ? slipStepsA4 : slipStepsSlip;

  const footer = `<p style="margin-top:14px;text-align:center;color:#94a3b8;font-size:0.75em;">MAWELL — ระบบจัดการหอพัก</p>`;

  return `
${headerBlock}
${tenantBlock}
${amountBlock}
${channelsBlock}
${ppBlock}
${slipSteps}
${footer}
`;
}
