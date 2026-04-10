import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function waitDocumentImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.images);
  return Promise.all(
    imgs.map(
      (img) =>
        img.complete && img.naturalHeight !== 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
              setTimeout(done, 5000);
            }),
    ),
  ).then(() => undefined);
}

export type PosTableBillPdfCaptureOptions = {
  iframeTitle?: string;
  /** ข้อความเมื่อไม่พบ `.root` ใน iframe */
  notFoundMessage?: string;
};

/**
 * แปลงเอกสารจาก `buildPosTableStaticDocumentHtml` เป็น PDF A4 (html2canvas + jsPDF)
 * — ใช้ร่วมกับบิลโต๊ะ POS และใบแจ้งหนี้หอพัก
 */
export async function downloadPosTableStaticHtmlAsA4Pdf(
  fullHtml: string,
  filename: string,
  options?: PosTableBillPdfCaptureOptions,
): Promise<void> {
  const iframeTitle = options?.iframeTitle ?? "สร้าง PDF";
  const notFoundMessage = options?.notFoundMessage ?? "ไม่พบเนื้อหาเอกสาร";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", iframeTitle);
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:210mm;min-height:297mm;border:0;margin:0;padding:0;opacity:0;pointer-events:none";

  document.body.appendChild(iframe);

  try {
    /** about:blank + document.write — สม่ำเสมอกว่า Blob/srcdoc; รองรับโหลด sync ที่ onload ไม่ยิง */
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error("หมดเวลาโหลดเอกสาร — ลองอีกครั้ง"));
      }, 15000);

      const clear = () => window.clearTimeout(timeout);
      let settled = false;
      let attemptStarted = false;

      const finishOk = () => {
        if (settled) return;
        settled = true;
        clear();
        resolve();
      };

      const finishErr = (err: Error) => {
        if (settled) return;
        settled = true;
        clear();
        reject(err);
      };

      const tryWrite = () => {
        if (settled || attemptStarted) return;
        const idoc = iframe.contentWindow?.document ?? iframe.contentDocument;
        if (!idoc || idoc.readyState !== "complete") return;

        attemptStarted = true;
        try {
          idoc.open();
          idoc.write(fullHtml);
          idoc.close();
          const root = idoc.querySelector(".root");
          if (!(root instanceof HTMLElement)) {
            finishErr(new Error(notFoundMessage));
            return;
          }
          finishOk();
        } catch (e) {
          finishErr(e instanceof Error ? e : new Error(notFoundMessage));
        }
      };

      iframe.onload = () => tryWrite();
      iframe.onerror = () => finishErr(new Error("โหลดกรอบเอกสารไม่สำเร็จ"));

      iframe.src = "about:blank";
      queueMicrotask(tryWrite);
      requestAnimationFrame(() => tryWrite());
    });

    const idoc = iframe.contentWindow?.document ?? iframe.contentDocument;
    if (!idoc) throw new Error("ไม่พบเอกสารใน iframe");
    const root = idoc.querySelector(".root");
    if (!(root instanceof HTMLElement)) throw new Error(notFoundMessage);

    await waitDocumentImages(idoc);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const pxW = canvas.width;
    const pxH = canvas.height;
    let mmW = maxW;
    let mmH = (pxH * mmW) / pxW;
    if (mmH > maxH) {
      mmH = maxH;
      mmW = (pxW * mmH) / pxH;
    }
    const x = (pageW - mmW) / 2;
    const y = margin + (maxH - mmH) / 2;
    pdf.addImage(imgData, "PNG", x, y, mmW, mmH);
    pdf.save(filename);
  } finally {
    iframe.remove();
  }
}
