/**
 * พิมพ์ผ่าน iframe ซ่อน — ใช้เมื่อเปิดหน้าต่างใหม่ไม่ได้
 * เอกสาร HTML ไม่ควรเรียก `window.close()` หลังพิมพ์ (เช่น บิล POS ใช้โหมด `afterPrint: "none"`)
 */
export function printPrintableHtmlInHiddenIframe(fullDocumentHtml: string): boolean {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "พิมพ์เอกสาร");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:210mm;min-height:200mm;border:0;margin:0;padding:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);
  const cw = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!cw || !doc) {
    iframe.remove();
    return false;
  }
  try {
    doc.open();
    doc.write(fullDocumentHtml);
    doc.close();
  } catch {
    iframe.remove();
    return false;
  }
  const cleanup = () => {
    iframe.remove();
  };
  cw.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 60_000);
  return true;
}

/**
 * เปิด HTML ฉบับสมบูรณ์ (มี DOCTYPE + style + script พิมพ์) ในหน้าต่างใหม่ หรือ iframe สำรอง
 * ใช้ร่วมกับบิล POS, ใบแนบ, หรือรายงานที่สร้าง HTML สำหรับ window.print() เอง
 */
export function openPrintableHtml(fullDocumentHtml: string): boolean {
  const w = window.open("about:blank", "_blank", "width=520,height=720");
  if (w) {
    try {
      w.document.open();
      w.document.write(fullDocumentHtml);
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

  return printPrintableHtmlInHiddenIframe(fullDocumentHtml);
}
