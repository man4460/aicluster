"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useAppNoticePopup } from "@/components/app-templates";
import {
  absoluteAssetUrl,
  buildLmsCertQrDataUrl,
  downloadLmsCertificatePdf,
  formatThaiCertDate,
} from "@/systems/lms/lib/lms-certificate-capture";

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
    certSignerTitle?: string | null;
    certSignatureUrl?: string | null;
    certTemplateNote?: string | null;
  };
};

function rejectAfterMs(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  });
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
      const verifyUrl = `${window.location.origin}/lms/${encodeURIComponent(slug)}/verify/${encodeURIComponent(certCode)}`;
      const qrDataUrl = await buildLmsCertQrDataUrl(verifyUrl);

      await Promise.race([
        downloadLmsCertificatePdf(
          {
            instituteName: data.institute?.displayName || "สถาบัน",
            learnerName: data.learner.fullName,
            courseTitle: data.course.title,
            issueDateLabel: formatThaiCertDate(data.certificate.issueDate),
            certCode,
            signerName: data.institute?.certSignerName || data.institute?.displayName || undefined,
            signerTitle: data.institute?.certSignerTitle || "ผู้ออกใบประกาศ",
            note: data.institute?.certTemplateNote || undefined,
            logoUrl: absoluteAssetUrl(data.institute?.logoUrl),
            signatureUrl: absoluteAssetUrl(data.institute?.certSignatureUrl),
            qrDataUrl,
          },
          `lms-certificate-${certCode}.pdf`,
        ),
        rejectAfterMs(40_000, "สร้าง PDF ใช้เวลานานเกินไป — ลองกดใหม่อีกครั้ง"),
      ]);

      notice.success("ดาวน์โหลดใบประกาศแล้ว");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "สร้างใบประกาศไม่สำเร็จ";
      notice.error(msg);
      console.error("[LmsCertificateDownload]", e);
    } finally {
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
