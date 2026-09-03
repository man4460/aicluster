"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useAppNoticePopup } from "@/components/app-templates";
import { buildLmsCertificateDocumentHtml } from "@/systems/lms/lib/lms-certificate-html";

type Props = {
  slug: string;
  certificateId: string;
  className?: string;
  /** ข้อความปุ่ม — ค่าเริ่ม: ดาวน์โหลดใบประกาศ PDF */
  label?: string;
};

function waitForFonts(doc: Document, maxMs = 6000): Promise<void> {
  const fonts = doc.fonts;
  if (!fonts?.ready) {
    return new Promise((r) => setTimeout(r, 900));
  }
  return Promise.race([
    fonts.ready.then(() => undefined),
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
    let iframe: HTMLIFrameElement | null = null;
    try {
      const res = await fetch(
        `/api/lms/public/${encodeURIComponent(slug)}/certificates/${encodeURIComponent(certificateId)}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as {
        error?: string;
        certificate?: { certCode: string; issueDate: string };
        learner?: { fullName: string };
        course?: { title: string };
        institute?: {
          displayName: string;
          certSignerName?: string;
          certTemplateNote?: string;
        };
      };
      if (!res.ok || !data.certificate || !data.learner || !data.course) {
        notice.error(data.error || "โหลดใบประกาศไม่สำเร็จ");
        return;
      }

      const issueDateLabel = new Date(data.certificate.issueDate).toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const html = buildLmsCertificateDocumentHtml({
        instituteName: data.institute?.displayName || "สถาบัน",
        learnerName: data.learner.fullName,
        courseTitle: data.course.title,
        issueDateLabel,
        certCode: data.certificate.certCode,
        signerName: data.institute?.certSignerName || undefined,
        note: data.institute?.certTemplateNote || undefined,
      });

      iframe = document.createElement("iframe");
      iframe.setAttribute("title", "ใบประกาศนียบัตร LMS");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText =
        "position:fixed;left:-9999px;top:0;width:1123px;height:794px;border:0;margin:0;padding:0;opacity:0;pointer-events:none";
      document.body.appendChild(iframe);

      const idoc = iframe.contentDocument;
      const iwin = iframe.contentWindow;
      if (!idoc || !iwin) {
        throw new Error("iframe unavailable");
      }

      idoc.open();
      idoc.write(html);
      idoc.close();

      await waitForFonts(idoc);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      // รอ stylesheet Google Fonts โหลดเพิ่มเล็กน้อย
      await new Promise<void>((r) => setTimeout(r, 400));

      const root = idoc.getElementById("lms-cert-root");
      if (!(root instanceof HTMLElement)) {
        throw new Error("certificate root missing");
      }

      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#fbf7ef",
        width: 1123,
        height: 794,
        windowWidth: 1123,
        windowHeight: 794,
      });

      const img = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      pdf.addImage(img, "JPEG", 0, 0, 297, 210);
      pdf.save(`lms-certificate-${data.certificate.certCode}.pdf`);
      notice.success("ดาวน์โหลดใบประกาศแล้ว");
    } catch {
      notice.error("สร้างใบประกาศไม่สำเร็จ");
    } finally {
      iframe?.remove();
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
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 disabled:opacity-60"
        }
      >
        <Download className="h-4 w-4" aria-hidden />
        {busy ? "กำลังสร้าง…" : label}
      </button>
    </>
  );
}
