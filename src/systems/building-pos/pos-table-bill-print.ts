import { printPrintableHtmlInHiddenIframe } from "@/components/app-templates/openPrintableHtml";
import type { PosOrder } from "@/systems/building-pos/building-pos-service";

export type PosTablePaperSize = "SLIP_58" | "SLIP_80" | "A4";

/** ตัวเลือกหน้ากระดาษ (เช่น ใบแจ้งหนี้หอ — A4 ลด margin บน-ล่าง) */
export type PosTablePrintPageOptions = {
  /** A4: ลด margin แนวตั้งเพื่อตัดพื้นที่ว่างบน-ล่างตอนพิมพ์ */
  a4TightVerticalMargins?: boolean;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function pageAndRootCss(paper: PosTablePaperSize, opts?: PosTablePrintPageOptions): string {
  if (paper === "A4") {
    const tight = opts?.a4TightVerticalMargins === true;
    const v = tight ? "5mm" : "12mm";
    const h = tight ? "10mm" : "12mm";
    return `
@page { size: A4 portrait; margin: ${v} ${h}; }
body { margin: 0; font-family: system-ui, "Segoe UI", sans-serif; color: #0f172a; background: #fff; }
.root { max-width: 180mm; margin: 0 auto; font-size: 12px; line-height: 1.4; }
h1 { font-size: 1.25rem; margin: 0 0 0.25rem; }
h2 { font-size: 0.85rem; margin: 0.75rem 0 0.35rem; }
.total-big { font-size: 1.75rem; font-weight: 800; color: #0000bf; }
.qr-wrap { text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: 200px; height: 200px; object-fit: contain; }
`;
  }
  const w = paper === "SLIP_80" ? "80mm" : "58mm";
  const inner = paper === "SLIP_80" ? "74mm" : "52mm";
  const fs = paper === "SLIP_80" ? "11px" : "9px";
  const qr = paper === "SLIP_80" ? "160px" : "120px";
  return `
@page { size: ${w} auto; margin: 2mm; }
body { margin: 0; font-family: system-ui, "Segoe UI", sans-serif; color: #0f172a; background: #fff; font-size: ${fs}; line-height: 1.35; }
.root { width: ${inner}; max-width: 100%; margin: 0 auto; box-sizing: border-box; }
h1 { font-size: 1.1em; margin: 0 0 0.15rem; text-align: center; }
h2 { font-size: 0.95em; margin: 0.5rem 0 0.2rem; }
.total-big { font-size: 1.35em; font-weight: 800; color: #0000bf; text-align: center; }
.qr-wrap { text-align: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #cbd5e1; }
.qr-wrap img { width: ${qr}; height: ${qr}; object-fit: contain; }
`;
}

export function buildPosTableBillInnerHtml(params: {
  shopLabel: string;
  logoUrl: string | null;
  tableLabel: string;
  billPrintedAt: string;
  orders: PosOrder[];
  grandTotal: number;
  paymentChannelsNote: string | null;
  ppQrUrl: string | null;
}): string {
  const {
    shopLabel,
    logoUrl,
    tableLabel,
    billPrintedAt,
    orders,
    grandTotal,
    paymentChannelsNote,
    ppQrUrl,
  } = params;

  const logoBlock =
    logoUrl?.trim() ?
      `<div style="text-align:center;margin-bottom:6px;"><img src="${escapeHtml(logoUrl.trim())}" alt="" style="max-height:48px;max-width:120px;object-fit:contain;" /></div>`
    : "";

  const orderBlocks = orders
    .map((o) => {
      const lines = o.items
        .map(
          (it) =>
            `<div style="display:flex;justify-content:space-between;gap:4px;margin:2px 0;"><span>${escapeHtml(it.name)} × ${it.qty}</span><span style="white-space:nowrap;">฿${(it.price * it.qty).toLocaleString()}</span></div>`,
        )
        .join("");
      return `<div style="border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
<p style="margin:0;font-size:0.85em;color:#64748b;">#${o.id}</p>
${lines}
<p style="margin:4px 0 0;text-align:right;font-weight:600;">รวม ฿${o.total_amount.toLocaleString()}</p>
</div>`;
    })
    .join("");

  const channelsBlock =
    paymentChannelsNote?.trim() ?
      `<section style="margin-top:8px;"><h2 style="font-size:0.9em;">ช่องทางชำระ</h2><p style="margin:0;white-space:pre-wrap;">${escapeHtml(paymentChannelsNote.trim())}</p></section>`
    : "";

  const qrBlock =
    ppQrUrl ?
      `<section class="qr-wrap"><h2 style="text-align:center;font-size:0.95em;">สแกนจ่าย พร้อมเพย์</h2>
<img src="${escapeHtml(ppQrUrl)}" alt="PromptPay QR" />
<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">ยอด ${grandTotal.toLocaleString("th-TH")} บาท</p></section>`
    : `<p style="margin-top:8px;text-align:center;color:#92400e;font-size:0.85em;">ยังไม่มี QR พร้อมเพย์ — ตั้งเบอร์ที่โปรไฟล์</p>`;

  return `
${logoBlock}
<h1>${escapeHtml(shopLabel)}</h1>
<p style="margin:0;text-align:center;font-weight:600;color:#0000bf;">ใบสรุปยอด / ชำระเงิน</p>
<p style="margin:6px 0 0;text-align:center;">โต๊ะ <strong>${escapeHtml(tableLabel)}</strong></p>
<p style="margin:4px 0 0;text-align:center;color:#64748b;font-size:0.85em;">${escapeHtml(billPrintedAt)}</p>
<div style="margin-top:10px;">${orderBlocks}</div>
<div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;text-align:center;">
<p style="margin:0;font-size:0.85em;color:#475569;">ยอดรวมทั้งหมด (บาท)</p>
<p class="total-big" style="margin:4px 0 0;">${grandTotal.toLocaleString("th-TH")}</p>
</div>
${channelsBlock}
${qrBlock}
<p style="margin-top:12px;text-align:center;color:#94a3b8;font-size:0.8em;">ขอบคุณที่ใช้บริการ</p>
`;
}

function escapeDocTitle(title: string): string {
  return title.replace(/[<>"]/g, "");
}

function buildPrintDocumentHtml(
  paper: PosTablePaperSize,
  innerHtml: string,
  afterPrint: "closeWindow" | "none",
  documentTitle = "บิลโต๊ะ",
  pageOpts?: PosTablePrintPageOptions,
): string {
  const css = pageAndRootCss(paper, pageOpts);
  const after =
    afterPrint === "closeWindow" ?
      "setTimeout(function(){try{window.close();}catch(e){}},400);"
    : "";
  // ต้องใช้ window.onload — addEventListener เปล่า ๆ จะ ReferenceError ในเบราว์เซอร์
  const boot = `window.onload=function(){setTimeout(function(){window.print();${after}},200);};`;
  const safeTitle = escapeDocTitle(documentTitle);
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>${css}</style></head><body><div class="root">${innerHtml}</div><script>${boot}<\/script></body></html>`;
}

/** เอกสาร HTML นิ่ง (ไม่มีสคริปต์พิมพ์) — ใช้จับภาพ PDF / preview */
export function buildPosTableStaticDocumentHtml(
  paper: PosTablePaperSize,
  innerHtml: string,
  documentTitle: string,
  pageOpts?: PosTablePrintPageOptions,
): string {
  const css = pageAndRootCss(paper, pageOpts);
  const safeTitle = escapeDocTitle(documentTitle);
  return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"/><title>${safeTitle}</title><style>${css}</style></head><body><div class="root">${innerHtml}</div></body></html>`;
}

/**
 * เปิดหน้าต่างพิมพ์ทันทีตามขนาดกระดาษ
 * ไม่ใส่ noopener ใน window.open — ถ้าใส่ เบราว์เซอร์ใหม่มักคืน null แล้วพิมพ์ไม่ทำงาน
 * หน้าต่างใหม่ใช้สคริปต์ปิดหลังพิมพ์; iframe สำรองใช้เอกสารแยกโดยไม่เรียก window.close
 */
export function openPosTableBillPrintWindow(
  paper: PosTablePaperSize,
  innerHtml: string,
  documentTitle?: string,
  pageOpts?: PosTablePrintPageOptions,
): boolean {
  const title = documentTitle ?? "บิลโต๊ะ";
  const htmlPopup = buildPrintDocumentHtml(paper, innerHtml, "closeWindow", title, pageOpts);
  const w = window.open("about:blank", "_blank", "width=520,height=720");
  if (w) {
    try {
      w.document.open();
      w.document.write(htmlPopup);
      w.document.close();
      return true;
    } catch {
      try {
        w.close();
      } catch {
        /* ignore */
      }
    }
  }
  const htmlIframe = buildPrintDocumentHtml(paper, innerHtml, "none", title, pageOpts);
  return printPrintableHtmlInHiddenIframe(htmlIframe);
}
