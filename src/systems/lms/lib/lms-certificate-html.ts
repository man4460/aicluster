/** HTML ใบประกาศนียบัตรจบหลักสูตร — A4 แนวนอน · โทนกรมท่า+ทอง · QR ตรวจสอบ */

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

/**
 * ลำดับขนาดตัวอักษร (ใหญ่ → เล็ก)
 * 1. ชื่อผู้เรียน — เด่นสุด
 * 2. หัวข้อ «ประกาศนียบัตร»
 * 3. ชื่อคอร์ส
 * 4. บรรทัดผ่านอบรม
 * 5. บทนำ / วันที่ / ชื่อผู้ลงนาม
 * 6. ตำแหน่ง · หมายเหตุ · QR
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
    : `<svg class="sign-scribble" viewBox="0 0 200 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 32 C28 8, 42 40, 58 22 C72 8, 78 36, 98 24 C118 10, 128 38, 148 20 C162 10, 172 30, 192 18" fill="none" stroke="#0b2a5b" stroke-width="2.4" stroke-linecap="round"/>
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
    background:
      radial-gradient(ellipse 70% 55% at 50% 28%, rgba(196, 163, 90, 0.10), transparent 62%),
      radial-gradient(ellipse 50% 40% at 12% 70%, rgba(91, 97, 255, 0.06), transparent 55%),
      radial-gradient(ellipse 50% 40% at 88% 70%, rgba(11, 42, 91, 0.07), transparent 55%),
      linear-gradient(180deg, #ffffff 0%, #f7f9fc 55%, #eef2f8 100%);
    font-family: "Sarabun", "TH Sarabun New", "Tahoma", "Segoe UI", sans-serif;
    color: #0f172a;
    position: relative;
    overflow: hidden;
  }

  .edge-frame {
    position: absolute;
    inset: 14px;
    border: 1.5px solid rgba(196, 163, 90, 0.45);
    border-radius: 6px;
    pointer-events: none;
    z-index: 1;
  }
  .edge-frame::before {
    content: "";
    position: absolute;
    inset: 5px;
    border: 1px solid rgba(11, 42, 91, 0.18);
    border-radius: 4px;
  }

  /* ถ้วยรางวัลลายน้ำ — โทนทองอ่อน */
  .trophy {
    position: absolute;
    top: 48%;
    transform: translateY(-54%);
    width: 220px;
    height: 250px;
    opacity: 0.14;
    pointer-events: none;
    z-index: 0;
  }
  .trophy--left { left: 28px; }
  .trophy--right { right: 28px; transform: translateY(-54%) scaleX(-1); }

  /* มุมคลื่น — กรมท่า + อินดิโก + ไฮไลต์ทอง */
  .wave {
    position: absolute;
    bottom: 0;
    width: 300px;
    height: 220px;
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
    padding: 42px 130px 32px;
  }

  .logo {
    width: 76px;
    height: 76px;
    border-radius: 9999px;
    background: linear-gradient(145deg, #0b2a5b 0%, #1e3a6e 55%, #4d47b6 100%);
    box-shadow:
      0 0 0 3px #fff,
      0 0 0 6px rgba(196, 163, 90, 0.85),
      0 10px 24px rgba(11, 42, 91, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .logo-fallback {
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  /* 2) หัวข้อ — ใหญ่รองจากชื่อ */
  .title {
    margin: 0 0 6px;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #0b2a5b;
    line-height: 1.15;
  }
  .title-rule {
    width: 120px;
    height: 3px;
    margin: 0 0 12px;
    border-radius: 99px;
    background: linear-gradient(90deg, transparent, #c4a35a 20%, #5b61ff 50%, #c4a35a 80%, transparent);
  }

  /* 5) บทนำ — เล็ก */
  .lead {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    letter-spacing: 0.01em;
  }

  /* 1) ชื่อผู้เรียน — ใหญ่สุด */
  .recipient {
    margin: 0 0 6px;
    font-size: 48px;
    font-weight: 800;
    color: #0b2a5b;
    line-height: 1.18;
    max-width: 860px;
    letter-spacing: 0.01em;
  }
  .recipient-rule {
    width: min(420px, 70%);
    height: 2px;
    margin: 0 0 16px;
    background: linear-gradient(90deg, transparent, rgba(196,163,90,0.9), rgba(11,42,91,0.55), rgba(196,163,90,0.9), transparent);
  }

  /* 4) บรรทัดผ่านอบรม — กลาง */
  .body {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #334155;
    line-height: 1.5;
    max-width: 760px;
  }

  /* 3) ชื่อคอร์ส — กลางใหญ่ + สีเน้น */
  .course {
    display: inline-block;
    margin-top: 6px;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.35;
    color: #4d47b6;
    background: linear-gradient(180deg, rgba(91, 97, 255, 0.08), rgba(196, 163, 90, 0.12));
    padding: 4px 16px 6px;
    border-radius: 999px;
    border: 1px solid rgba(196, 163, 90, 0.35);
  }

  /* 5) วันที่ — เล็ก */
  .date {
    margin: 16px 0 0;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  .sign-block {
    margin-top: auto;
    padding-top: 22px;
    padding-bottom: 6px;
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
    border-top: 1.5px solid #0b2a5b;
    margin: 4px 0 8px;
  }
  /* 5) ชื่อผู้ลงนาม */
  .sign-name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #0b2a5b;
  }
  /* 6) ตำแหน่ง */
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
    max-width: 520px;
  }

  .qr-box {
    position: absolute;
    right: 40px;
    bottom: 40px;
    z-index: 3;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1.5px solid rgba(196, 163, 90, 0.55);
    border-radius: 14px;
    padding: 8px 8px 6px;
    text-align: center;
    box-shadow: 0 8px 22px rgba(11, 42, 91, 0.16);
  }
  .qr-box--empty {
    min-width: 110px;
    padding: 10px 12px;
  }
  .qr-img {
    width: 92px;
    height: 92px;
    display: block;
    margin: 0 auto;
  }
  .qr-label {
    margin: 4px 0 0;
    font-size: 10px;
    font-weight: 700;
    color: #0b2a5b;
  }
  .qr-code {
    margin: 1px 0 0;
    font-size: 9px;
    color: #94a3b8;
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
    <div class="edge-frame" aria-hidden="true"></div>

    <svg class="trophy trophy--left" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="tgL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c4a35a"/>
          <stop offset="55%" stop-color="#8b7340"/>
          <stop offset="100%" stop-color="#0b2a5b"/>
        </linearGradient>
      </defs>
      <path fill="url(#tgL)" d="M35 18h50v8H35zm8 8h34c2 18 8 28 17 34-6 4-10 10-10 18v6H36v-6c0-8-4-14-10-18 9-6 15-16 17-34zm-3 66h40v8H40zm6 8h28l4 22H42z"/>
      <path fill="url(#tgL)" d="M28 26c-10 2-18 12-18 24 0 10 6 18 14 20 2-8 6-14 10-18V26zm64 0v26c4 4 8 10 10 18 8-2 14-10 14-20 0-12-8-22-18-24z"/>
    </svg>
    <svg class="trophy trophy--right" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="tgR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c4a35a"/>
          <stop offset="55%" stop-color="#8b7340"/>
          <stop offset="100%" stop-color="#0b2a5b"/>
        </linearGradient>
      </defs>
      <path fill="url(#tgR)" d="M35 18h50v8H35zm8 8h34c2 18 8 28 17 34-6 4-10 10-10 18v6H36v-6c0-8-4-14-10-18 9-6 15-16 17-34zm-3 66h40v8H40zm6 8h28l4 22H42z"/>
      <path fill="url(#tgR)" d="M28 26c-10 2-18 12-18 24 0 10 6 18 14 20 2-8 6-14 10-18V26zm64 0v26c4 4 8 10 10 18 8-2 14-10 14-20 0-12-8-22-18-24z"/>
    </svg>

    <svg class="wave wave--left" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wgL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5b61ff"/>
          <stop offset="45%" stop-color="#1e3a6e"/>
          <stop offset="100%" stop-color="#0b2a5b"/>
        </linearGradient>
      </defs>
      <path fill="url(#wgL)" opacity="0.92" d="M0 220V72c30 8 52 30 78 56 24 24 52 52 96 62 20 4 40 8 62 8H0z"/>
      <path fill="#0b2a5b" opacity="0.85" d="M0 220V118c24 6 42 20 64 40 20 18 44 36 78 44 16 4 32 6 48 6H0z"/>
      <path fill="#c4a35a" opacity="0.55" d="M0 220V168c18 4 32 14 50 26 16 12 36 24 62 28 12 2 24 4 36 4H0z"/>
    </svg>
    <svg class="wave wave--right" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wgR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5b61ff"/>
          <stop offset="45%" stop-color="#1e3a6e"/>
          <stop offset="100%" stop-color="#0b2a5b"/>
        </linearGradient>
      </defs>
      <path fill="url(#wgR)" opacity="0.92" d="M0 220V72c30 8 52 30 78 56 24 24 52 52 96 62 20 4 40 8 62 8H0z"/>
      <path fill="#0b2a5b" opacity="0.85" d="M0 220V118c24 6 42 20 64 40 20 18 44 36 78 44 16 4 32 6 48 6H0z"/>
      <path fill="#c4a35a" opacity="0.55" d="M0 220V168c18 4 32 14 50 26 16 12 36 24 62 28 12 2 24 4 36 4H0z"/>
    </svg>

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

    ${qrBlock}
  </div>
</body>
</html>`;
}
