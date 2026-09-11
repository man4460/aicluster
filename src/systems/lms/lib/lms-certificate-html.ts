/** HTML ใบประกาศนียบัตรจบหลักสูตร — A4 แนวนอน · ขาว · มุมคลื่นกรมท่า · QR ตรวจสอบ */

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
    : `<svg class="sign-scribble" viewBox="0 0 200 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 32 C28 8, 42 40, 58 22 C72 8, 78 36, 98 24 C118 10, 128 38, 148 20 C162 10, 172 30, 192 18" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>
      </svg>`;

  const qrBlock = qrDataUrl
    ? `<div class="qr-box">
        <img class="qr-img" src="${qrDataUrl}" alt="QR ตรวจสอบใบประกาศ" />
        <p class="qr-label">สแกนตรวจสอบ</p>
        <p class="qr-code">${code}</p>
      </div>`
    : `<div class="qr-box qr-box--empty">
        <p class="qr-label">รหัสใบประกาศ</p>
        <p class="qr-code">${code}</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ใบประกาศนียบัตร ${code}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  #lms-cert-root {
    width: ${LMS_CERT_PX.width}px;
    height: ${LMS_CERT_PX.height}px;
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: "Sarabun", "TH Sarabun New", "Tahoma", "Segoe UI", sans-serif;
    color: #111111;
    position: relative;
    overflow: hidden;
  }

  /* ถ้วยรางวัลลายน้ำซ้าย–ขวา */
  .trophy {
    position: absolute;
    top: 50%;
    transform: translateY(-54%);
    width: 210px;
    height: 240px;
    opacity: 0.07;
    pointer-events: none;
    z-index: 0;
  }
  .trophy--left { left: 36px; }
  .trophy--right { right: 36px; transform: translateY(-54%) scaleX(-1); }

  /* มุมคลื่นกรมท่า */
  .wave {
    position: absolute;
    bottom: 0;
    width: 280px;
    height: 210px;
    z-index: 1;
    pointer-events: none;
  }
  .wave--left { left: 0; }
  .wave--right { right: 0; transform: scaleX(-1); }

  .content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 48px 120px 36px;
  }

  .logo {
    width: 72px;
    height: 72px;
    border-radius: 9999px;
    background: #0b2a5b;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .logo-fallback {
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .title {
    margin: 0 0 10px;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #0a0a0a;
    line-height: 1.15;
  }
  .lead {
    margin: 0 0 18px;
    font-size: 17px;
    font-weight: 400;
    color: #1a1a1a;
  }
  .recipient {
    margin: 0 0 16px;
    font-size: 40px;
    font-weight: 800;
    color: #0a0a0a;
    line-height: 1.2;
    max-width: 820px;
  }
  .body {
    margin: 0;
    font-size: 17px;
    color: #1a1a1a;
    line-height: 1.55;
    max-width: 760px;
  }
  .course {
    font-weight: 800;
  }
  .date {
    margin: 18px 0 0;
    font-size: 16px;
    color: #1a1a1a;
  }

  .sign-block {
    margin-top: auto;
    padding-top: 28px;
    padding-bottom: 8px;
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
    width: 180px;
    height: 44px;
    margin-bottom: 2px;
  }
  .sign-line {
    width: 200px;
    border-top: 1.5px solid #111;
    margin: 4px 0 8px;
  }
  .sign-name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #111;
  }
  .sign-role {
    margin: 2px 0 0;
    font-size: 13px;
    color: #333;
  }
  .note {
    margin-top: 8px;
    font-size: 11px;
    color: #64748b;
    max-width: 520px;
  }

  .qr-box {
    position: absolute;
    right: 36px;
    bottom: 36px;
    z-index: 3;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px 8px 6px;
    text-align: center;
    box-shadow: 0 4px 14px rgba(11, 42, 91, 0.12);
  }
  .qr-box--empty {
    min-width: 110px;
    padding: 10px 12px;
  }
  .qr-img {
    width: 96px;
    height: 96px;
    display: block;
    margin: 0 auto;
  }
  .qr-label {
    margin: 4px 0 0;
    font-size: 10px;
    font-weight: 600;
    color: #0b2a5b;
  }
  .qr-code {
    margin: 1px 0 0;
    font-size: 9px;
    color: #64748b;
    letter-spacing: 0.02em;
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
</head>
<body>
  <div id="lms-cert-root">
    <svg class="trophy trophy--left" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#94a3b8" d="M35 18h50v8H35zm8 8h34c2 18 8 28 17 34-6 4-10 10-10 18v6H36v-6c0-8-4-14-10-18 9-6 15-16 17-34zm-3 66h40v8H40zm6 8h28l4 22H42z"/>
      <path fill="#94a3b8" d="M28 26c-10 2-18 12-18 24 0 10 6 18 14 20 2-8 6-14 10-18V26zm64 0v26c4 4 8 10 10 18 8-2 14-10 14-20 0-12-8-22-18-24z"/>
    </svg>
    <svg class="trophy trophy--right" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#94a3b8" d="M35 18h50v8H35zm8 8h34c2 18 8 28 17 34-6 4-10 10-10 18v6H36v-6c0-8-4-14-10-18 9-6 15-16 17-34zm-3 66h40v8H40zm6 8h28l4 22H42z"/>
      <path fill="#94a3b8" d="M28 26c-10 2-18 12-18 24 0 10 6 18 14 20 2-8 6-14 10-18V26zm64 0v26c4 4 8 10 10 18 8-2 14-10 14-20 0-12-8-22-18-24z"/>
    </svg>

    <svg class="wave wave--left" viewBox="0 0 280 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
      <path fill="#0b2a5b" d="M0 210V78c28 6 48 28 72 52 22 22 48 48 88 58 18 4 36 6 56 6H0z"/>
      <path fill="#123a72" d="M0 210V118c22 4 38 18 58 36 18 16 40 34 72 42 14 4 28 6 42 6H0z"/>
      <path fill="#0b2a5b" d="M0 210V148c16 2 28 12 44 24 14 12 32 24 56 30 10 2 20 4 30 4H0z"/>
    </svg>
    <svg class="wave wave--right" viewBox="0 0 280 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
      <path fill="#0b2a5b" d="M0 210V78c28 6 48 28 72 52 22 22 48 48 88 58 18 4 36 6 56 6H0z"/>
      <path fill="#123a72" d="M0 210V118c22 4 38 18 58 36 18 16 40 34 72 42 14 4 28 6 42 6H0z"/>
      <path fill="#0b2a5b" d="M0 210V148c16 2 28 12 44 24 14 12 32 24 56 30 10 2 20 4 30 4H0z"/>
    </svg>

    <div class="content">
      <div class="logo">${logoBlock}</div>
      <h1 class="title">ประกาศนียบัตร</h1>
      <p class="lead">ใบประกาศนียบัตรให้ไว้เพื่อแสดงว่า</p>
      <p class="recipient">${learner}</p>
      <p class="body">ได้ผ่านการฝึกอบรมออนไลน์ ในหัวข้อ<br/><span class="course">“ ${course} ”</span></p>
      <p class="date">${dateLabel}</p>

      <div class="sign-block">
        ${signVisual}
        <div class="sign-line" aria-hidden="true"></div>
        <p class="sign-name">${signer}</p>
        <p class="sign-role">${signerTitle}</p>
        ${note ? `<p class="note">${note}</p>` : ""}
      </div>
    </div>

    ${qrBlock}
  </div>
</body>
</html>`;
}
