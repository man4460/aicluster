/** HTML ใบประกาศนียบัตรจบหลักสูตร — A4 แนวนอน · CSS decorations (html2canvas-safe) · QR */

export type LmsCertificateHtmlInput = {
  instituteName: string;
  learnerName: string;
  courseTitle: string;
  /** เช่น «ให้ไว้ ณ วันที่ 30 ธันวาคม พ.ศ. 2569» */
  issueDateLabel: string;
  certCode: string;
  signerName?: string;
  /** ตำแหน่งผู้ลงนาม เช่น ประธานการจัดงาน */
  signerTitle?: string;
  note?: string;
  /** โลโก้สถาบัน (data URL หรือ absolute URL) */
  logoUrl?: string;
  /** รูปลายเซ็น (data URL หรือ absolute URL) */
  signatureUrl?: string;
  /** QR data URL สำหรับตรวจสอบใบประกาศ */
  qrDataUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** ขนาดพิกเซลอ้างอิง A4 landscape ที่ 96dpi ประมาณ 1123×794 */
export const LMS_CERT_PX = { width: 1123, height: 794 } as const;

/** ถ้วยรางวัลเป็น data-URI (html2canvas จับ <img> ได้ แต่จับ SVG inline+gradient ไม่ได้) */
const TROPHY_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" fill="none">
      <path fill="#c4a35a" d="M35 18h50v8H35zm8 8h34c2 18 8 28 17 34-6 4-10 10-10 18v6H36v-6c0-8-4-14-10-18 9-6 15-16 17-34zm-3 66h40v8H40zm6 8h28l4 22H42z"/>
      <path fill="#0b2a5b" opacity=".55" d="M28 26c-10 2-18 12-18 24 0 10 6 18 14 20 2-8 6-14 10-18V26zm64 0v26c4 4 8 10 10 18 8-2 14-10 14-20 0-12-8-22-18-24z"/>
      <path fill="#8b7340" d="M48 100h24l3 18H45z"/>
    </svg>`,
  );

/**
 * ลำดับขนาดตัวอักษร (ใหญ่ → เล็ก)
 * 1. ชื่อผู้เรียน · 2. หัวข้อ · 3. ชื่อคอร์ส · 4. บรรทัดผ่านอบรม
 * 5. บทนำ/วันที่/ชื่อผู้ลงนาม · 6. ตำแหน่ง/หมายเหตุ/QR
 *
 * หมายเหตุ: ตกแต่งมุมใช้ CSS + <img> เท่านั้น — ห้าม SVG inline gradient
 * เพราะ html2canvas มักไม่เรนเดอร์ ทำให้พรีวิว/PDF ดูโล่ง
 */
export function buildLmsCertificateDocumentHtml(input: LmsCertificateHtmlInput): string {
  const institute = escapeHtml(input.instituteName || "สถาบัน");
  const learner = escapeHtml(input.learnerName);
  const course = escapeHtml(input.courseTitle);
  const dateLabel = escapeHtml(input.issueDateLabel);
  const code = escapeHtml(input.certCode);
  const signer = input.signerName ? escapeHtml(input.signerName) : escapeHtml(institute);
  const signerTitle = escapeHtml(input.signerTitle || "ผู้ออกใบประกาศ");
  const note = input.note ? escapeHtml(input.note.slice(0, 160)) : "";
  const logoUrl = input.logoUrl ? escapeHtml(input.logoUrl) : "";
  const signatureUrl = input.signatureUrl ? escapeHtml(input.signatureUrl) : "";
  const qrDataUrl = input.qrDataUrl ? escapeHtml(input.qrDataUrl) : "";

  const logoBlock = logoUrl
    ? `<img class="logo-img" src="${logoUrl}" alt="" crossorigin="anonymous" />`
    : `<span class="logo-fallback">โลโก้</span>`;

  const signVisual = signatureUrl
    ? `<img class="sign-img" src="${signatureUrl}" alt="" crossorigin="anonymous" />`
    : `<div class="sign-scribble" aria-hidden="true"></div>`;

  const qrInner = qrDataUrl
    ? `<div class="qr-frame"><img class="qr-img" src="${qrDataUrl}" alt="QR ตรวจสอบใบประกาศ" /></div>
       <p class="qr-label">สแกนตรวจสอบ</p>
       <p class="qr-code">${code}</p>`
    : `<p class="qr-label">รหัสใบประกาศ</p>
       <p class="qr-code">${code}</p>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ใบประกาศนียบัตร ${code}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }

  #lms-cert-root {
    width: ${LMS_CERT_PX.width}px;
    height: ${LMS_CERT_PX.height}px;
    margin: 0;
    padding: 0;
    background: linear-gradient(180deg, #ffffff 0%, #f5f7fc 48%, #e8eef8 100%);
    font-family: "Sarabun", "TH Sarabun New", "Tahoma", "Segoe UI", sans-serif;
    color: #0f172a;
    position: relative;
    overflow: hidden;
  }

  /* กรอบคู่ — ทอง + กรมท่า */
  .edge-outer {
    position: absolute;
    inset: 12px;
    border: 2px solid #c4a35a;
    border-radius: 8px;
    z-index: 1;
    pointer-events: none;
  }
  .edge-inner {
    position: absolute;
    inset: 18px;
    border: 1px solid #0b2a5b;
    border-radius: 5px;
    opacity: 0.35;
    z-index: 1;
    pointer-events: none;
  }

  /* ถ้วยลายน้ำ — <img> data-URI */
  .trophy {
    position: absolute;
    top: 46%;
    width: 200px;
    height: 230px;
    opacity: 0.16;
    z-index: 0;
    pointer-events: none;
  }
  .trophy--left { left: 40px; transform: translateY(-50%); }
  .trophy--right { right: 40px; transform: translateY(-50%) scaleX(-1); }

  /* มุมคลื่น — ชั้น CSS (html2canvas รองรับ) */
  .wave {
    position: absolute;
    bottom: 0;
    width: 340px;
    height: 250px;
    z-index: 1;
    pointer-events: none;
  }
  .wave--left { left: 0; }
  .wave--right { right: 0; transform: scaleX(-1); }

  .wave-base {
    position: absolute;
    left: -30px;
    bottom: -40px;
    width: 320px;
    height: 260px;
    background: #0b2a5b;
    border-radius: 0 120% 0 0;
  }
  .wave-mid {
    position: absolute;
    left: -10px;
    bottom: -20px;
    width: 250px;
    height: 190px;
    background: #1a3f7a;
    border-radius: 0 110% 0 0;
  }
  .wave-top {
    position: absolute;
    left: 10px;
    bottom: 0;
    width: 190px;
    height: 130px;
    background: #5b61ff;
    border-radius: 0 100% 0 0;
    opacity: 0.85;
  }
  .wave-gold {
    position: absolute;
    left: -5px;
    bottom: -5px;
    width: 160px;
    height: 70px;
    background: #c4a35a;
    border-radius: 0 90% 0 0;
    opacity: 0.9;
  }

  .content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px 140px 28px;
  }

  .logo {
    width: 78px;
    height: 78px;
    border-radius: 9999px;
    background: #0b2a5b;
    border: 4px solid #c4a35a;
    box-shadow: 0 8px 20px rgba(11, 42, 91, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .logo-img { width: 100%; height: 100%; object-fit: cover; }
  .logo-fallback {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .title {
    margin: 0 0 8px;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #0b2a5b;
    line-height: 1.15;
  }
  .title-rule {
    width: 140px;
    height: 4px;
    margin: 0 0 12px;
    border-radius: 99px;
    background: #c4a35a;
    box-shadow: 0 0 0 2px rgba(91, 97, 255, 0.25);
  }

  .lead {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  .recipient {
    margin: 0 0 8px;
    font-size: 48px;
    font-weight: 800;
    color: #0b2a5b;
    line-height: 1.18;
    max-width: 860px;
  }
  .recipient-rule {
    width: 380px;
    max-width: 70%;
    height: 3px;
    margin: 0 0 16px;
    background: #c4a35a;
  }

  .body {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: #334155;
    line-height: 1.5;
    max-width: 760px;
  }

  .course {
    display: inline-block;
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.35;
    color: #4d47b6;
    background: #eef0ff;
    padding: 6px 20px 8px;
    border-radius: 999px;
    border: 2px solid #c4a35a;
  }

  .date {
    margin: 16px 0 0;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  .sign-block {
    margin-top: auto;
    padding-top: 18px;
    padding-bottom: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 220px;
  }
  .sign-img {
    height: 52px;
    max-width: 200px;
    object-fit: contain;
    margin-bottom: 2px;
  }
  .sign-scribble {
    width: 170px;
    height: 36px;
    margin-bottom: 2px;
    background:
      radial-gradient(circle at 12% 60%, transparent 40%, #0b2a5b 41%, #0b2a5b 48%, transparent 50%),
      radial-gradient(circle at 38% 40%, transparent 42%, #0b2a5b 43%, #0b2a5b 50%, transparent 52%),
      radial-gradient(circle at 62% 55%, transparent 40%, #0b2a5b 41%, #0b2a5b 48%, transparent 50%),
      radial-gradient(circle at 88% 35%, transparent 42%, #0b2a5b 43%, #0b2a5b 50%, transparent 52%);
    background-size: 40px 36px, 48px 36px, 44px 36px, 40px 36px;
    background-repeat: no-repeat;
    background-position: 0 0, 40px 0, 85px 0, 130px 0;
    opacity: 0.85;
  }
  .sign-line {
    width: 200px;
    border-top: 2px solid #0b2a5b;
    margin: 4px 0 8px;
  }
  .sign-name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #0b2a5b;
  }
  .sign-role {
    margin: 3px 0 0;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
  .note {
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8;
    max-width: 480px;
  }

  /* QR — การ์ดบนมุมคลื่น โทนกรมท่า+ทอง */
  .qr-box {
    position: absolute;
    right: 28px;
    bottom: 28px;
    z-index: 4;
    width: 132px;
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    background: #ffffff;
    border: 2px solid #c4a35a;
    box-shadow:
      0 10px 28px rgba(11, 42, 91, 0.28),
      0 0 0 3px rgba(255, 255, 255, 0.9);
    text-align: center;
  }
  .qr-box-head {
    background: #0b2a5b;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 6px 8px 5px;
    line-height: 1.2;
  }
  .qr-box-body {
    padding: 10px 10px 8px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  }
  .qr-frame {
    width: 100px;
    height: 100px;
    margin: 0 auto 6px;
    padding: 5px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid #e2e8f0;
    box-shadow: inset 0 0 0 2px #0b2a5b;
  }
  .qr-img {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 4px;
  }
  .qr-label {
    margin: 0;
    font-size: 11px;
    font-weight: 800;
    color: #0b2a5b;
  }
  .qr-code {
    margin: 2px 0 0;
    font-size: 8px;
    color: #94a3b8;
    letter-spacing: 0.02em;
    max-width: 112px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: auto;
    margin-right: auto;
  }
  .qr-box--empty .qr-box-body {
    padding: 14px 10px;
  }
</style>
</head>
<body>
  <div id="lms-cert-root">
    <div class="edge-outer" aria-hidden="true"></div>
    <div class="edge-inner" aria-hidden="true"></div>

    <img class="trophy trophy--left" src="${TROPHY_IMG}" alt="" />
    <img class="trophy trophy--right" src="${TROPHY_IMG}" alt="" />

    <div class="wave wave--left" aria-hidden="true">
      <div class="wave-base"></div>
      <div class="wave-mid"></div>
      <div class="wave-top"></div>
      <div class="wave-gold"></div>
    </div>
    <div class="wave wave--right" aria-hidden="true">
      <div class="wave-base"></div>
      <div class="wave-mid"></div>
      <div class="wave-top"></div>
      <div class="wave-gold"></div>
    </div>

    <div class="content">
      <div class="logo">${logoBlock}</div>
      <h1 class="title">ประกาศนียบัตร</h1>
      <div class="title-rule" aria-hidden="true"></div>
      <p class="lead">ใบประกาศนียบัตรให้ไว้เพื่อแสดงว่า</p>
      <p class="recipient">${learner}</p>
      <div class="recipient-rule" aria-hidden="true"></div>
      <p class="body">ได้ผ่านการฝึกอบรมออนไลน์ ในหัวข้อ</p>
      <p class="course">“ ${course} ”</p>
      <p class="date">${dateLabel}</p>

      <div class="sign-block">
        ${signVisual}
        <div class="sign-line" aria-hidden="true"></div>
        <p class="sign-name">${signer}</p>
        <p class="sign-role">${signerTitle}</p>
        ${note ? `<p class="note">${note}</p>` : ""}
      </div>
    </div>

    <div class="qr-box${qrDataUrl ? "" : " qr-box--empty"}">
      <div class="qr-box-head">ตรวจสอบใบประกาศ</div>
      <div class="qr-box-body">${qrInner}</div>
    </div>
  </div>
</body>
</html>`;
}
