import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/** ตรงกับ `buildPosTableStaticDocumentHtml` — ค้นหาเร็วกว่า class เดี่ยว */
const PDF_ROOT_ID = "pos-pdf-root";

function waitElementImages(root: HTMLElement, maxTotalMs = 8000): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();

  const waitOne = (img: HTMLImageElement) => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    const isData = /^data:/i.test(img.src.trim());
    const perImgCapMs = isData ? 2000 : 4500;
    return new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      setTimeout(done, perImgCapMs);
    });
  };

  return Promise.race([
    Promise.all(imgs.map(waitOne)).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, maxTotalMs)),
  ]);
}

function findRoot(doc: Document | null | undefined): HTMLElement | null {
  if (!doc) return null;
  const byId = doc.getElementById(PDF_ROOT_ID);
  if (byId instanceof HTMLElement) return byId;
  const el = doc.querySelector(".root");
  return el instanceof HTMLElement ? el : null;
}

function createHiddenIframe(title: string): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", title);
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-9999px;top:0;width:210mm;min-height:297mm;border:0;margin:0;padding:0;opacity:0;pointer-events:none";
  return iframe;
}

function rejectAfterMs(ms: number, message: string): Promise<never> {
  return new Promise((_, rej) => {
    window.setTimeout(() => rej(new Error(message)), ms);
  });
}

/** หนึ่งเฟรมพอหลัง srcdoc / write — ไม่ต้องหน่วง 80ms */
async function deferParseHint(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

function iframeAttemptBudgetMs(pollForRootMaxMs: number): number {
  return pollForRootMaxMs + 12_000;
}

/**
 * หา root ทันทีถ้ามีอยู่แล้ว; ไม่เช่นนั้น MutationObserver + interval (เร็วกว่า rAF ทุกเฟรม เมื่อ DOM ยัง parse ไม่จบ)
 */
function waitForRootInDocument(doc: Document, notFoundMessage: string, maxMs: number): Promise<HTMLElement> {
  const sync = findRoot(doc);
  if (sync) return Promise.resolve(sync);

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs;
    let settled = false;
    let intervalId = 0;

    function cleanup() {
      observer.disconnect();
      window.clearInterval(intervalId);
    }

    function tick() {
      if (settled) return;
      const root = findRoot(doc);
      if (root) {
        settled = true;
        cleanup();
        resolve(root);
        return;
      }
      if (Date.now() >= deadline) {
        settled = true;
        cleanup();
        reject(new Error(notFoundMessage));
      }
    }

    const observer = new MutationObserver(() => tick());

    if (doc.documentElement) {
      observer.observe(doc.documentElement, { childList: true, subtree: true });
    }
    intervalId = window.setInterval(tick, 40);
    queueMicrotask(tick);
  });
}

async function tryLoadViaSrcdoc(
  iframe: HTMLIFrameElement,
  fullHtml: string,
  notFoundMessage: string,
  pollForRootMaxMs: number,
): Promise<{ doc: Document; root: HTMLElement }> {
  const budgetMs = iframeAttemptBudgetMs(pollForRootMaxMs);
  return new Promise((resolve, reject) => {
    let settled = false;
    let to = 0;

    function finishOk(doc: Document, root: HTMLElement) {
      if (settled) return;
      settled = true;
      window.clearTimeout(to);
      resolve({ doc, root });
    }

    function finishErr(err: Error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(to);
      reject(err);
    }

    to = window.setTimeout(() => finishErr(new Error("หมดเวลาโหลดเอกสาร — ลองอีกครั้ง")), budgetMs);

    iframe.onload = () => {
      const doc = iframe.contentWindow?.document ?? iframe.contentDocument;
      if (!doc) {
        finishErr(new Error(notFoundMessage));
        return;
      }
      void (async () => {
        await deferParseHint();
        try {
          const root = await waitForRootInDocument(doc, notFoundMessage, pollForRootMaxMs);
          finishOk(doc, root);
        } catch {
          finishErr(new Error(notFoundMessage));
        }
      })();
    };

    iframe.onerror = () => finishErr(new Error("โหลดกรอบเอกสารไม่สำเร็จ"));

    iframe.removeAttribute("src");
    iframe.srcdoc = fullHtml;

    const trySync = () => {
      if (settled) return;
      const doc = iframe.contentWindow?.document ?? iframe.contentDocument;
      const root = findRoot(doc);
      if (doc && root) finishOk(doc, root);
    };
    queueMicrotask(trySync);
    requestAnimationFrame(trySync);
  });
}

async function tryLoadViaAboutBlankWrite(
  iframe: HTMLIFrameElement,
  fullHtml: string,
  notFoundMessage: string,
  pollForRootMaxMs: number,
): Promise<{ doc: Document; root: HTMLElement }> {
  const budgetMs = iframeAttemptBudgetMs(pollForRootMaxMs);
  return new Promise((resolve, reject) => {
    const to = window.setTimeout(() => reject(new Error("หมดเวลาโหลดเอกสาร — ลองอีกครั้ง")), budgetMs);

    iframe.onload = () => {
      void (async () => {
        try {
          const idoc = iframe.contentWindow?.document ?? iframe.contentDocument;
          if (!idoc) {
            window.clearTimeout(to);
            reject(new Error(notFoundMessage));
            return;
          }
          idoc.open();
          idoc.write(fullHtml);
          idoc.close();
          /* write/close สร้าง DOM พร้อม root ทันที — ไม่ต้องรอเฟรม */
          const root = await waitForRootInDocument(idoc, notFoundMessage, pollForRootMaxMs);
          window.clearTimeout(to);
          resolve({ doc: idoc, root });
        } catch (e) {
          window.clearTimeout(to);
          reject(e instanceof Error ? e : new Error(notFoundMessage));
        }
      })();
    };

    iframe.onerror = () => {
      window.clearTimeout(to);
      reject(new Error("โหลดกรอบเอกสารไม่สำเร็จ"));
    };

    iframe.removeAttribute("srcdoc");
    iframe.src = "about:blank";
  });
}

async function tryLoadViaBlobUrl(
  iframe: HTMLIFrameElement,
  fullHtml: string,
  notFoundMessage: string,
  pollForRootMaxMs: number,
): Promise<{ doc: Document; root: HTMLElement }> {
  const budgetMs = iframeAttemptBudgetMs(pollForRootMaxMs);
  let objectUrl: string | null = null;
  return new Promise((resolve, reject) => {
    const to = window.setTimeout(() => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error("หมดเวลาโหลดเอกสาร — ลองอีกครั้ง"));
    }, budgetMs);

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    iframe.onload = () => {
      void (async () => {
        try {
          const doc = iframe.contentWindow?.document ?? iframe.contentDocument;
          if (!doc) {
            window.clearTimeout(to);
            cleanup();
            reject(new Error(notFoundMessage));
            return;
          }
          await deferParseHint();
          const root = await waitForRootInDocument(doc, notFoundMessage, pollForRootMaxMs);
          window.clearTimeout(to);
          cleanup();
          resolve({ doc, root });
        } catch (e) {
          window.clearTimeout(to);
          cleanup();
          reject(e instanceof Error ? e : new Error(notFoundMessage));
        }
      })();
    };

    iframe.onerror = () => {
      window.clearTimeout(to);
      cleanup();
      reject(new Error("โหลดกรอบเอกสารไม่สำเร็จ"));
    };

    try {
      iframe.removeAttribute("srcdoc");
      objectUrl = URL.createObjectURL(new Blob([fullHtml], { type: "text/html;charset=utf-8" }));
      iframe.src = objectUrl;
    } catch {
      window.clearTimeout(to);
      cleanup();
      reject(new Error(notFoundMessage));
    }
  });
}

/**
 * ข้าม iframe เมื่อโหลดใน iframe ไม่เสถียร (HTML ใหญ่ / srcdoc) — parse ในเบราว์เซอร์แล้วแนบ host ลับ
 */
function tryLoadViaDomParserHost(fullHtml: string, notFoundMessage: string): { root: HTMLElement; cleanup: () => void } | null {
  let parsed: Document;
  try {
    parsed = new DOMParser().parseFromString(fullHtml, "text/html");
  } catch {
    return null;
  }
  if (parsed.querySelector("parsererror")) {
    return null;
  }
  const root = findRoot(parsed);
  if (!root) return null;

  const host = document.createElement("div");
  host.setAttribute("data-pos-pdf-capture-host", "1");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-9999px;top:0;width:210mm;min-height:297mm;border:0;margin:0;padding:0;opacity:0;pointer-events:none;contain:strict;z-index:-1";

  for (const node of parsed.head.querySelectorAll("style")) {
    host.appendChild(node.cloneNode(true));
  }
  const clone = root.cloneNode(true);
  if (
    !(clone instanceof HTMLElement) ||
    (clone.id !== PDF_ROOT_ID && !clone.classList.contains("root"))
  ) {
    return null;
  }
  host.appendChild(clone);
  document.body.appendChild(host);

  return {
    root: clone,
    cleanup: () => {
      host.remove();
    },
  };
}

/**
 * ลอง DOMParser + host ก่อน (ได้ root ทันที ไม่รอ iframe หลายรอบ — HTML จาก buildPosTableStaticDocumentHtml)
 * ถ้าไม่ได้ ค่อย srcdoc → about:blank+write → Blob URL
 */
async function loadCaptureRoot(
  fullHtml: string,
  iframeTitle: string,
  notFoundMessage: string,
  pollForRootMaxMs: number,
): Promise<{ root: HTMLElement; cleanup: () => void }> {
  const fast = tryLoadViaDomParserHost(fullHtml, notFoundMessage);
  if (fast) return fast;

  /* about:blank+write มักเร็วและเสถียรกว่า srcdoc เมื่อ HTML ยาว */
  const attempts: Array<
    (el: HTMLIFrameElement, html: string, msg: string, pollMs: number) => Promise<{ doc: Document; root: HTMLElement }>
  > = [tryLoadViaAboutBlankWrite, tryLoadViaBlobUrl, tryLoadViaSrcdoc];

  let lastErr: unknown;
  for (const attempt of attempts) {
    const iframe = createHiddenIframe(iframeTitle);
    document.body.appendChild(iframe);
    try {
      const { root } = await attempt(iframe, fullHtml, notFoundMessage, pollForRootMaxMs);
      return {
        root,
        cleanup: () => {
          iframe.remove();
        },
      };
    } catch (e) {
      lastErr = e;
      iframe.remove();
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(notFoundMessage);
}

export type PosTableBillPdfCaptureOptions = {
  iframeTitle?: string;
  /** ข้อความเมื่อไม่พบ `.root` ใน iframe */
  notFoundMessage?: string;
  /** รอหา `.root` ใน iframe นานแค่ไหน (HTML ใหญ่หรือเครื่องช้า) */
  pollForRootMaxMs?: number;
  /** จำกัดเวลา html2canvas + บันทึก PDF — กันปุ่มค้างเมื่อเบราว์เซอร์ค้าง */
  captureTimeoutMs?: number;
  /** ค่า scale ของ html2canvas (ค่าน้อยเร็วขึ้น ลดโอกาสค้าง) */
  html2canvasScale?: number;
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
  const pollForRootMaxMs = options?.pollForRootMaxMs ?? 20_000;
  const captureTimeoutMs = options?.captureTimeoutMs ?? 45_000;
  const html2canvasScale = options?.html2canvasScale ?? 2;

  const { root, cleanup } = await loadCaptureRoot(fullHtml, iframeTitle, notFoundMessage, pollForRootMaxMs);

  try {
    const captureAndSave = async () => {
      await waitElementImages(root);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const canvas = await html2canvas(root, {
        scale: html2canvasScale,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 10_000,
        backgroundColor: "#ffffff",
        logging: false,
        foreignObjectRendering: false,
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
    };

    await Promise.race([
      captureAndSave(),
      rejectAfterMs(
        captureTimeoutMs,
        "สร้าง PDF ใช้เวลานานเกินไป — ลองกดใหม่ หรือปิดแท็บอื่นชั่วคราว แล้วลดขนาดโลโก้/QR ในตั้งค่าหากยังซ้ำ",
      ),
    ]);
  } finally {
    cleanup();
  }
}
