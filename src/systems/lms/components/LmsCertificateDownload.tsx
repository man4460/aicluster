"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { useAppNoticePopup } from "@/components/app-templates";
import {
  buildLmsCertificateDocumentHtml,
  LMS_CERT_PX,
} from "@/systems/lms/lib/lms-certificate-html";

type Props = {
  slug: string;
  certificateId: string;
  className?: string;
  /** ข้อความปุ่ม — ค่าเริ่ม: ดาวน์โหลดใบประกาศ PDF */
  label?: string;
};

type CertApiPayload = {
  error?: string;
  certificate?: { certCode: string; issueDate: string };
  learner?: { fullName: string };
  course?: { title: string };
  institute?: {
    displayName: string;
    logoUrl?: string | null;
    certSignerName?: string | null;
    certSignatureUrl?: string | null;
    certTemplateNote?: string | null;
  };
};

function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  const v = pathOrUrl.trim();
  if (!v) return undefined;
  if (v.startsWith("data:") || /^https?:\/\//i.test(v)) return v;
  if (typeof window === "undefined") return v;
  return `${window.location.origin}${v.startsWith("/") ? v : `/${v}`}`;
}

function formatThaiCertDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dayMonthYear = d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `ให้ไว้ ณ วันที่ ${dayMonthYear}`;
}

function rejectAfterMs(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  });
}

/** ฝัง HTML ใน host เดียวกันกับหน้า (ไม่พึ่ง iframe / Google Fonts) — เสถียรกว่า html2canvas */
function mountCertCaptureHost(fullHtml: string): { root: HTMLElement; cleanup: () => void } {
  const parsed = new DOMParser().parseFromString(fullHtml, "text/html");
  const root = parsed.getElementById("lms-cert-root");
  if (!(root instanceof HTMLElement)) {
    throw new Error("ไม่พบต้นแบบใบประกาศ");
  }

  const host = document.createElement("div");
  host.setAttribute("data-lms-cert-capture-host", "1");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1123px;height:794px;border:0;margin:0;padding:0;opacity:0;pointer-events:none;z-index:-1;overflow:hidden";

  for (const node of parsed.head.querySelectorAll("style")) {
    host.appendChild(node.cloneNode(true));
  }
  const clone = root.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    throw new Error("ไม่พบต้นแบบใบประกาศ");
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

async function waitImages(root: HTMLElement, maxMs = 8000): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) return;
  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    ),
    new Promise<void>((r) => setTimeout(r, maxMs)),
  ]);
}

export function LmsCertificateDownload({
  slug,
  certificateId,
  className,
  label = "ดาวน์โหลดใบประกาศ PDF",
}: Props) {
  const notice = useAppNoticePopup();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    let cleanup: (() => void) | null = null;
    try {
      const res = await fetch(
        `/api/lms/public/${encodeURIComponent(slug)}/certificates/${encodeURIComponent(certificateId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as CertApiPayload;
      if (!res.ok || !data.certificate || !data.learner || !data.course) {
        notice.error(data.error || "โหลดใบประกาศไม่สำเร็จ");
        return;
      }

      const certCode = data.certificate.certCode;
      const verifyPath = `/lms/${encodeURIComponent(slug)}/verify/${encodeURIComponent(certCode)}`;
      const verifyUrl = `${window.location.origin}${verifyPath}`;

      let qrDataUrl: string | undefined;
      try {
        qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 192,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#0b2a5b", light: "#ffffff" },
        });
      } catch {
        qrDataUrl = undefined;
      }

      const html = buildLmsCertificateDocumentHtml({
        instituteName: data.institute?.displayName || "สถาบัน",
        learnerName: data.learner.fullName,
        courseTitle: data.course.title,
        issueDateLabel: formatThaiCertDate(data.certificate.issueDate),
        certCode,
        signerName: data.institute?.certSignerName || data.institute?.displayName || undefined,
        signerTitle: "ผู้ออกใบประกาศ",
        note: data.institute?.certTemplateNote || undefined,
        logoUrl: absoluteUrl(data.institute?.logoUrl),
        signatureUrl: absoluteUrl(data.institute?.certSignatureUrl),
        qrDataUrl,
      });

      const mounted = mountCertCaptureHost(html);
      cleanup = mounted.cleanup;
      const { root } = mounted;

      await waitImages(root);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const captureAndSave = async () => {
        const canvas = await html2canvas(root, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          width: LMS_CERT_PX.width,
          height: LMS_CERT_PX.height,
          windowWidth: LMS_CERT_PX.width,
          windowHeight: LMS_CERT_PX.height,
          logging: false,
          imageTimeout: 10_000,
          foreignObjectRendering: false,
        });

        const img = canvas.toDataURL("image/jpeg", 0.94);
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        pdf.addImage(img, "JPEG", 0, 0, 297, 210);
        pdf.save(`lms-certificate-${certCode}.pdf`);
      };

      await Promise.race([
        captureAndSave(),
        rejectAfterMs(40_000, "สร้าง PDF ใช้เวลานานเกินไป — ลองกดใหม่อีกครั้ง"),
      ]);

      notice.success("ดาวน์โหลดใบประกาศแล้ว");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "สร้างใบประกาศไม่สำเร็จ";
      notice.error(msg);
      console.error("[LmsCertificateDownload]", e);
    } finally {
      cleanup?.();
      setBusy(false);
    }
  }

  return (
    <>
      {notice.popup}
      <button
        type="button"
        disabled={busy}
        onClick={() => void download()}
        className={
          className ||
          "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 disabled:opacity-60"
        }
      >
        <Download className="h-4 w-4" aria-hidden />
        {busy ? "กำลังสร้าง…" : label}
      </button>
    </>
  );
}
